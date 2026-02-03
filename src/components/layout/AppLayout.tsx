import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { BottomNav } from './BottomNav'
import { FAB } from '@/components/expense/FAB'
import { useAuth } from '@/hooks/useAuth'
import { isBackupNeeded, backupToGoogleDrive } from '@/lib/backup'

export function AppLayout() {
  const { user } = useAuth()
  const backupAttempted = useRef(false)

  // Auto-backup on app open if needed (> 24 hours since last backup)
  useEffect(() => {
    async function autoBackup() {
      if (!user || backupAttempted.current) return
      if (!isBackupNeeded()) return

      backupAttempted.current = true

      try {
        const result = await backupToGoogleDrive(user.id, user.householdId)
        if (result.success) {
          toast.success('Auto-backup completed', {
            description: 'Your data has been backed up to Google Drive',
          })
        }
      } catch (error) {
        console.error('Auto-backup failed:', error)
      }
    }

    // Delay auto-backup to not interfere with initial app load
    const timer = setTimeout(autoBackup, 5000)
    return () => clearTimeout(timer)
  }, [user])

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md pb-20">
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
    </div>
  )
}
