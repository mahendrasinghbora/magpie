import {
  getExpenses,
  getCategories,
  getPaymentMethods,
  getTags,
  getMonthlyIncome,
} from '@/lib/firestore'
import { getMonthKey } from '@/config/constants'

const BACKUP_FOLDER_NAME = 'Magpie Backups'
const LAST_BACKUP_KEY = 'magpie_last_backup'

interface BackupData {
  version: string
  timestamp: string
  userId: string
  expenses: unknown[]
  categories: unknown[]
  paymentMethods: unknown[]
  tags: unknown[]
  monthlyIncome: unknown | null
}

// Get OAuth access token using Google Auth provider
export async function getGoogleAccessToken(): Promise<string | null> {
  try {
    // Get the current user's OAuth credential
    // This requires re-authenticating to get fresh tokens with Drive scope
    const { GoogleAuthProvider, getAuth, signInWithPopup } = await import('firebase/auth')
    const auth = getAuth()
    const provider = new GoogleAuthProvider()
    provider.addScope('https://www.googleapis.com/auth/drive.file')

    const result = await signInWithPopup(auth, provider)
    const credential = GoogleAuthProvider.credentialFromResult(result)

    if (credential?.accessToken) {
      return credential.accessToken
    }
    return null
  } catch (error) {
    console.error('Error getting Google access token:', error)
    return null
  }
}

// Find or create the backup folder in Google Drive
async function getOrCreateBackupFolder(accessToken: string): Promise<string | null> {
  try {
    // Search for existing folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const searchData = await searchResponse.json()

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id
    }

    // Create new folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    })

    const createData = await createResponse.json()
    return createData.id || null
  } catch (error) {
    console.error('Error getting/creating backup folder:', error)
    return null
  }
}

// Upload backup file to Google Drive
async function uploadBackupFile(
  accessToken: string,
  folderId: string,
  data: BackupData
): Promise<boolean> {
  try {
    const fileName = `magpie-backup-${new Date().toISOString().split('T')[0]}.json`
    const fileContent = JSON.stringify(data, null, 2)

    // Check if a backup file with same name exists
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    const searchData = await searchResponse.json()

    if (searchData.files && searchData.files.length > 0) {
      // Update existing file
      const fileId = searchData.files[0].id
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      })
    } else {
      // Create new file using multipart upload
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json',
      }

      const form = new FormData()
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      )
      form.append('file', new Blob([fileContent], { type: 'application/json' }))

      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      })
    }

    return true
  } catch (error) {
    console.error('Error uploading backup file:', error)
    return false
  }
}

// Collect all user data for backup
async function collectBackupData(userId: string, householdId: string | null): Promise<BackupData> {
  // Get all expenses (without date range to get all)
  const startDate = new Date(2020, 0, 1)
  const endDate = new Date(2100, 11, 31)

  const [expenses, categories, paymentMethods, tags] = await Promise.all([
    getExpenses(userId, householdId, startDate, endDate),
    getCategories(householdId),
    getPaymentMethods(userId),
    getTags(householdId),
  ])

  // Get current month's income
  const monthKey = getMonthKey(new Date())
  const monthlyIncome = await getMonthlyIncome(userId, monthKey)

  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    userId,
    expenses: expenses.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    categories,
    paymentMethods: paymentMethods.map((pm) => ({
      ...pm,
      createdAt: pm.createdAt.toISOString(),
    })),
    tags,
    monthlyIncome: monthlyIncome
      ? {
          ...monthlyIncome,
          createdAt: monthlyIncome.createdAt.toISOString(),
          updatedAt: monthlyIncome.updatedAt.toISOString(),
        }
      : null,
  }
}

// Main backup function
export async function backupToGoogleDrive(
  userId: string,
  householdId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get access token
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return { success: false, error: 'Could not get Google access token. Please sign in again.' }
    }

    // Get or create backup folder
    const folderId = await getOrCreateBackupFolder(accessToken)
    if (!folderId) {
      return { success: false, error: 'Could not create backup folder in Google Drive.' }
    }

    // Collect backup data
    const backupData = await collectBackupData(userId, householdId)

    // Upload backup
    const success = await uploadBackupFile(accessToken, folderId, backupData)
    if (!success) {
      return { success: false, error: 'Failed to upload backup file.' }
    }

    // Save last backup timestamp
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())

    return { success: true }
  } catch (error) {
    console.error('Backup error:', error)
    return { success: false, error: 'An unexpected error occurred during backup.' }
  }
}

// Get last backup timestamp
export function getLastBackupTime(): Date | null {
  const timestamp = localStorage.getItem(LAST_BACKUP_KEY)
  return timestamp ? new Date(timestamp) : null
}

// Check if backup is needed (> 24 hours since last backup)
export function isBackupNeeded(): boolean {
  const lastBackup = getLastBackupTime()
  if (!lastBackup) return true

  const hoursSinceLastBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60)
  return hoursSinceLastBackup > 24
}

// Format last backup time for display
export function formatLastBackupTime(date: Date | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString()
}
