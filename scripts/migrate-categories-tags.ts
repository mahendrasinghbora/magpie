/**
 * Migration script to add Savings category and remove unused tags
 *
 * Run with: npx tsx scripts/migrate-categories-tags.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

import serviceAccount from './service-account.json'

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
})

const db = getFirestore()

const TAGS_TO_REMOVE = ['EatSure', 'Ola', 'Ajio', 'Paytm', 'Personal', 'Reimbursable']

async function migrate() {
  console.log('Starting migration...')

  // 1. Add Savings category if it doesn't exist
  console.log('\nChecking for Savings category...')
  const savingsQuery = await db.collection('categories')
    .where('name', '==', 'Savings')
    .where('householdId', '==', null)
    .get()

  if (savingsQuery.empty) {
    console.log('Adding Savings category...')
    await db.collection('categories').add({
      name: 'Savings',
      icon: 'PiggyBank',
      color: '#10b981',
      isCustom: false,
      isTransfer: true,
      order: 27,
      householdId: null,
    })
    console.log('✓ Savings category added')
  } else {
    console.log('✓ Savings category already exists')
  }

  // 2. Remove unused tags
  console.log('\nRemoving unused tags...')
  for (const tagName of TAGS_TO_REMOVE) {
    const tagQuery = await db.collection('tags')
      .where('name', '==', tagName)
      .where('householdId', '==', null)
      .get()

    if (!tagQuery.empty) {
      for (const doc of tagQuery.docs) {
        await doc.ref.delete()
        console.log(`✓ Removed tag: ${tagName}`)
      }
    } else {
      console.log(`- Tag not found: ${tagName}`)
    }
  }

  console.log('\nMigration complete!')
}

migrate().catch(console.error)
