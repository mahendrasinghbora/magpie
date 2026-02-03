import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import type {
  User,
  Expense,
  Category,
  PaymentMethod,
  Tag,
  MonthlyIncome,
  Household,
  HouseholdInvite,
} from '@/types'

// Helper to convert Firestore timestamps to Date
function convertTimestamps<T extends DocumentData>(data: T): T {
  const converted = { ...data } as Record<string, unknown>
  for (const key in converted) {
    const value = converted[key]
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      converted[key] = value.toDate()
    }
  }
  return converted as T
}

// ============== Expenses ==============

export async function createExpense(
  expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'expenses'), {
    ...expense,
    date: Timestamp.fromDate(expense.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, 'id' | 'createdAt'>>
): Promise<void> {
  const expenseRef = doc(db, 'expenses', id)
  await updateDoc(expenseRef, {
    ...updates,
    ...(updates.date && { date: Timestamp.fromDate(updates.date) }),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', id))
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const docSnap = await getDoc(doc(db, 'expenses', id))
  if (!docSnap.exists()) {
    return null
  }
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data()),
  } as Expense
}

export async function getExpenses(
  userId: string,
  householdId: string | null,
  startDate: Date,
  endDate: Date
): Promise<Expense[]> {
  const constraints: QueryConstraint[] = [
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc'),
  ]

  // If user is part of household, get all household expenses
  // Otherwise, get only user's expenses
  if (householdId) {
    constraints.unshift(where('householdId', '==', householdId))
  } else {
    constraints.unshift(where('userId', '==', userId))
  }

  const q = query(collection(db, 'expenses'), ...constraints)
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as Expense[]
}

// ============== Categories ==============

export async function getCategories(householdId: string | null): Promise<Category[]> {
  // Get default categories (householdId is null) and household-specific categories
  const defaultQuery = query(
    collection(db, 'categories'),
    where('householdId', '==', null),
    orderBy('order')
  )

  const defaultSnapshot = await getDocs(defaultQuery)
  const categories = defaultSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[]

  // If user has a household, also get household-specific categories
  if (householdId) {
    const householdQuery = query(
      collection(db, 'categories'),
      where('householdId', '==', householdId),
      orderBy('order')
    )
    const householdSnapshot = await getDocs(householdQuery)
    const householdCategories = householdSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[]

    categories.push(...householdCategories)
  }

  return categories
}

export async function createCategory(
  category: Omit<Category, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'categories'), category)
  return docRef.id
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'categories', id), updates)
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id))
}

// ============== Payment Methods ==============

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const q = query(
    collection(db, 'paymentMethods'),
    where('userId', '==', userId),
    orderBy('createdAt')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as PaymentMethod[]
}

export async function createPaymentMethod(
  paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'paymentMethods'), {
    ...paymentMethod,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updatePaymentMethod(
  id: string,
  updates: Partial<Omit<PaymentMethod, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'paymentMethods', id), updates)
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await deleteDoc(doc(db, 'paymentMethods', id))
}

export async function getHouseholdPaymentMethods(userIds: string[]): Promise<PaymentMethod[]> {
  if (userIds.length === 0) return []

  const allMethods = await Promise.all(
    userIds.map((userId) => getPaymentMethods(userId))
  )

  return allMethods.flat()
}

// ============== Tags ==============

export async function getTags(householdId: string | null): Promise<Tag[]> {
  const defaultQuery = query(
    collection(db, 'tags'),
    where('householdId', '==', null)
  )

  const defaultSnapshot = await getDocs(defaultQuery)
  const tags = defaultSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Tag[]

  if (householdId) {
    const householdQuery = query(
      collection(db, 'tags'),
      where('householdId', '==', householdId)
    )
    const householdSnapshot = await getDocs(householdQuery)
    const householdTags = householdSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tag[]

    tags.push(...householdTags)
  }

  return tags
}

export async function createTag(tag: Omit<Tag, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'tags'), tag)
  return docRef.id
}

export async function deleteTag(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tags', id))
}

// ============== Monthly Income ==============

export async function getMonthlyIncome(
  userId: string,
  month: string
): Promise<MonthlyIncome | null> {
  const q = query(
    collection(db, 'monthlyIncome'),
    where('userId', '==', userId),
    where('month', '==', month)
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...convertTimestamps(doc.data()),
  } as MonthlyIncome
}

export async function getHouseholdMonthlyIncome(
  userIds: string[],
  month: string
): Promise<number> {
  if (userIds.length === 0) return 0

  const incomes = await Promise.all(
    userIds.map((userId) => getMonthlyIncome(userId, month))
  )

  // Sum external income only (total - fromHouseholdAmount)
  return incomes.reduce((sum, income) => {
    if (!income) return sum
    const externalIncome = income.amount - (income.fromHouseholdAmount || 0)
    return sum + externalIncome
  }, 0)
}

export async function setMonthlyIncome(
  userId: string,
  month: string,
  amount: number
): Promise<string> {
  // Check if income record already exists for this month
  const existing = await getMonthlyIncome(userId, month)

  if (existing) {
    await updateDoc(doc(db, 'monthlyIncome', existing.id), {
      amount,
      updatedAt: serverTimestamp(),
    })
    return existing.id
  }

  const docRef = await addDoc(collection(db, 'monthlyIncome'), {
    userId,
    month,
    amount,
    fromHouseholdAmount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

// Add income from household member (for household transfers)
export async function addHouseholdIncomeToRecipient(
  recipientUserId: string,
  month: string,
  amount: number
): Promise<void> {
  const existing = await getMonthlyIncome(recipientUserId, month)

  if (existing) {
    // Add to existing fromHouseholdAmount
    const newFromHouseholdAmount = (existing.fromHouseholdAmount || 0) + amount
    const newTotalAmount = existing.amount + amount
    await updateDoc(doc(db, 'monthlyIncome', existing.id), {
      amount: newTotalAmount,
      fromHouseholdAmount: newFromHouseholdAmount,
      updatedAt: serverTimestamp(),
    })
  } else {
    // Create new income record with only household income
    await addDoc(collection(db, 'monthlyIncome'), {
      userId: recipientUserId,
      month,
      amount: amount,
      fromHouseholdAmount: amount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

// ============== Household ==============

export async function createHousehold(
  name: string,
  userId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, 'households'), {
    name,
    createdBy: userId,
    members: [userId],
    createdAt: serverTimestamp(),
  })

  // Update user's householdId
  await updateDoc(doc(db, 'users', userId), {
    householdId: docRef.id,
  })

  return docRef.id
}

export async function getHousehold(id: string): Promise<Household | null> {
  const docSnap = await getDoc(doc(db, 'households', id))
  if (!docSnap.exists()) {
    return null
  }

  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data()),
  } as Household
}

export async function inviteToHousehold(
  householdId: string,
  householdName: string,
  invitedBy: string,
  invitedByName: string,
  invitedEmail: string
): Promise<string> {
  const docRef = await addDoc(collection(db, 'householdInvites'), {
    householdId,
    householdName,
    invitedBy,
    invitedByName,
    invitedEmail: invitedEmail.toLowerCase(),
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getPendingInvites(email: string): Promise<HouseholdInvite[]> {
  const q = query(
    collection(db, 'householdInvites'),
    where('invitedEmail', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  })) as HouseholdInvite[]
}

// Migrate user's existing expenses to a household
async function migrateUserExpensesToHousehold(
  userId: string,
  householdId: string
): Promise<void> {
  // Find all user's expenses that don't have a householdId
  const q = query(
    collection(db, 'expenses'),
    where('userId', '==', userId),
    where('householdId', '==', null)
  )
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return
  }

  // Update all expenses in a batch
  const batch = writeBatch(db)
  snapshot.docs.forEach((expenseDoc) => {
    batch.update(expenseDoc.ref, { householdId })
  })
  await batch.commit()
}

export async function acceptInvite(
  inviteId: string,
  userId: string
): Promise<void> {
  const inviteRef = doc(db, 'householdInvites', inviteId)
  const inviteSnap = await getDoc(inviteRef)

  if (!inviteSnap.exists()) {
    throw new Error('Invite not found')
  }

  const invite = inviteSnap.data() as HouseholdInvite

  // Add user to household members using arrayUnion (no read required)
  const householdRef = doc(db, 'households', invite.householdId)
  await updateDoc(householdRef, {
    members: arrayUnion(userId),
  })

  // Update user's householdId
  await updateDoc(doc(db, 'users', userId), {
    householdId: invite.householdId,
  })

  // Migrate user's existing expenses to the household
  await migrateUserExpensesToHousehold(userId, invite.householdId)

  // Mark invite as accepted
  await updateDoc(inviteRef, {
    status: 'accepted',
  })
}

export async function rejectInvite(inviteId: string): Promise<void> {
  await updateDoc(doc(db, 'householdInvites', inviteId), {
    status: 'rejected',
  })
}

export async function leaveHousehold(
  userId: string,
  householdId: string
): Promise<void> {
  const householdRef = doc(db, 'households', householdId)
  const householdSnap = await getDoc(householdRef)

  if (!householdSnap.exists()) {
    throw new Error('Household not found')
  }

  const household = householdSnap.data() as Household

  // Remove user from household members
  await updateDoc(householdRef, {
    members: household.members.filter((id) => id !== userId),
  })

  // Update user's householdId
  await updateDoc(doc(db, 'users', userId), {
    householdId: null,
  })
}

// ============== Household Members ==============

export async function getHouseholdMembers(
  householdId: string
): Promise<{ id: string; displayName: string; photoURL: string }[]> {
  const household = await getHousehold(householdId)
  if (!household) {
    return []
  }

  const members = await Promise.all(
    household.members.map(async (memberId) => {
      const userDoc = await getDoc(doc(db, 'users', memberId))
      if (!userDoc.exists()) {
        return null
      }
      const userData = userDoc.data()
      return {
        id: memberId,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      }
    })
  )

  return members.filter((m) => m !== null) as {
    id: string
    displayName: string
    photoURL: string
  }[]
}

// ============== User Profile ==============

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt' | 'householdId'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', userId), updates)
}
