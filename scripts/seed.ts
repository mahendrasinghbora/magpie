/**
 * Seed script to populate default categories and tags in Firestore
 *
 * Run with: npx tsx scripts/seed.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// You'll need to download a service account key from Firebase Console
// Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
// Save it as scripts/service-account.json (already in .gitignore)

import serviceAccount from './service-account.json'

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
})

const db = getFirestore()

const DEFAULT_CATEGORIES = [
  { name: 'Dining Out', icon: 'UtensilsCrossed', color: '#ef4444', isCustom: false, isTransfer: false, order: 1 },
  { name: 'Food Delivery', icon: 'PackageOpen', color: '#f97316', isCustom: false, isTransfer: false, order: 2 },
  { name: 'Groceries', icon: 'ShoppingBasket', color: '#22c55e', isCustom: false, isTransfer: false, order: 3 },
  { name: 'Quick Commerce', icon: 'Zap', color: '#eab308', isCustom: false, isTransfer: false, order: 4 },
  { name: 'Bike Taxi', icon: 'Bike', color: '#52525b', isCustom: false, isTransfer: false, order: 5 },
  { name: 'Auto', icon: 'CarTaxiFront', color: '#0d9488', isCustom: false, isTransfer: false, order: 6 },
  { name: 'Cab', icon: 'Car', color: '#3b82f6', isCustom: false, isTransfer: false, order: 7 },
  { name: 'Transport', icon: 'TrainFront', color: '#6366f1', isCustom: false, isTransfer: false, order: 8 },
  { name: 'Fuel & Vehicle', icon: 'Fuel', color: '#b45309', isCustom: false, isTransfer: false, order: 9 },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#d946ef', isCustom: false, isTransfer: false, order: 10 },
  { name: 'Bills & Utilities', icon: 'Receipt', color: '#8b5cf6', isCustom: false, isTransfer: false, order: 11 },
  { name: 'Household Help', icon: 'HandHelping', color: '#ec4899', isCustom: false, isTransfer: false, order: 12 },
  { name: 'Entertainment', icon: 'Film', color: '#a855f7', isCustom: false, isTransfer: false, order: 13 },
  { name: 'Sports & Fitness', icon: 'Dumbbell', color: '#16a34a', isCustom: false, isTransfer: false, order: 14 },
  { name: 'Health', icon: 'Heart', color: '#dc2626', isCustom: false, isTransfer: false, order: 15 },
  { name: 'Education', icon: 'GraduationCap', color: '#0ea5e9', isCustom: false, isTransfer: false, order: 16 },
  { name: 'Travel', icon: 'Plane', color: '#06b6d4', isCustom: false, isTransfer: false, order: 17 },
  { name: 'Rent', icon: 'Home', color: '#64748b', isCustom: false, isTransfer: false, order: 18 },
  { name: 'EMIs & Loans', icon: 'Landmark', color: '#78716c', isCustom: false, isTransfer: false, order: 19 },
  { name: 'Subscriptions', icon: 'RefreshCw', color: '#7c3aed', isCustom: false, isTransfer: false, order: 20 },
  { name: 'Personal Care', icon: 'Scissors', color: '#f472b6', isCustom: false, isTransfer: false, order: 21 },
  { name: 'Gifts & Donations', icon: 'Gift', color: '#e11d48', isCustom: false, isTransfer: false, order: 22 },
  { name: 'Family', icon: 'Users', color: '#60a5fa', isCustom: false, isTransfer: false, order: 23 },
  { name: 'Bank Charges', icon: 'CreditCard', color: '#94a3b8', isCustom: false, isTransfer: false, order: 24 },
  { name: 'Others', icon: 'MoreHorizontal', color: '#71717a', isCustom: false, isTransfer: false, order: 25 },
  { name: 'Credit Card Payment', icon: 'Wallet', color: '#475569', isCustom: false, isTransfer: true, order: 26 },
  { name: 'Savings', icon: 'PiggyBank', color: '#10b981', isCustom: false, isTransfer: true, order: 27 },
]

const DEFAULT_TAGS = [
  // Food & Delivery
  { name: 'Swiggy', isCustom: false },
  { name: 'Zomato', isCustom: false },
  // Quick Commerce
  { name: 'Blinkit', isCustom: false },
  { name: 'Zepto', isCustom: false },
  { name: 'Instamart', isCustom: false },
  // Transport
  { name: 'Uber', isCustom: false },
  { name: 'Rapido', isCustom: false },
  { name: 'Metro', isCustom: false },
  // Shopping
  { name: 'Amazon', isCustom: false },
  { name: 'Flipkart', isCustom: false },
  { name: 'Myntra', isCustom: false },
  // Payments
  { name: 'CRED', isCustom: false },
  { name: 'PhonePe', isCustom: false },
  { name: 'GPay', isCustom: false },
  // Entertainment
  { name: 'Netflix', isCustom: false },
  { name: 'Prime', isCustom: false },
  { name: 'Hotstar', isCustom: false },
  { name: 'Spotify', isCustom: false },
  // General
  { name: 'Online', isCustom: false },
  { name: 'Offline', isCustom: false },
  { name: 'Work', isCustom: false },
]

async function seed() {
  console.log('Starting seed...')

  // Check if categories already exist
  const categoriesSnapshot = await db.collection('categories').limit(1).get()
  if (!categoriesSnapshot.empty) {
    console.log('Categories already seeded, skipping...')
  } else {
    console.log('Seeding categories...')
    const batch = db.batch()

    for (const category of DEFAULT_CATEGORIES) {
      const ref = db.collection('categories').doc()
      batch.set(ref, { ...category, householdId: null })
    }

    await batch.commit()
    console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`)
  }

  // Check if tags already exist
  const tagsSnapshot = await db.collection('tags').limit(1).get()
  if (!tagsSnapshot.empty) {
    console.log('Tags already seeded, skipping...')
  } else {
    console.log('Seeding tags...')
    const batch = db.batch()

    for (const tag of DEFAULT_TAGS) {
      const ref = db.collection('tags').doc()
      batch.set(ref, { ...tag, householdId: null })
    }

    await batch.commit()
    console.log(`Seeded ${DEFAULT_TAGS.length} tags`)
  }

  console.log('Seed complete!')
}

seed().catch(console.error)
