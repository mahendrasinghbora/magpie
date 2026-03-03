/**
 * Migration script to update default category colors to be distinct
 *
 * Run with: npx tsx scripts/migrate-category-colors.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

import serviceAccount from './service-account.json'

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
})

const db = getFirestore()

// Map of category name → new color
const COLOR_UPDATES: Record<string, string> = {
  'Groceries': '#22c55e',
  'Bike Taxi': '#52525b',
  'Auto': '#0d9488',
  'Fuel & Vehicle': '#b45309',
  'Bills & Utilities': '#8b5cf6',
  'Household Help': '#ec4899',
  'Entertainment': '#a855f7',
  'Sports & Fitness': '#16a34a',
  'Health': '#dc2626',
  'Subscriptions': '#7c3aed',
  'Personal Care': '#f472b6',
  'Gifts & Donations': '#e11d48',
}

async function migrate() {
  console.log('Updating default category colors...\n')

  const snapshot = await db.collection('categories')
    .where('householdId', '==', null)
    .get()

  let updated = 0
  const batch = db.batch()

  for (const doc of snapshot.docs) {
    const name = doc.data().name as string
    const newColor = COLOR_UPDATES[name]
    if (newColor && doc.data().color !== newColor) {
      console.log(`  ${name}: ${doc.data().color} → ${newColor}`)
      batch.update(doc.ref, { color: newColor })
      updated++
    }
  }

  if (updated === 0) {
    console.log('All colors already up to date.')
    return
  }

  await batch.commit()
  console.log(`\nUpdated ${updated} categories.`)
}

migrate().catch(console.error)
