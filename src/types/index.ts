import type { AvatarStyleKey } from '@/lib/avatar'

// User types
export interface User {
  id: string
  email: string
  displayName: string
  photoURL: string | null
  avatarStyle: AvatarStyleKey
  createdAt: Date
  householdId: string | null
}

export interface Household {
  id: string
  name: string
  createdBy: string
  members: string[] // User IDs
  createdAt: Date
}

export interface HouseholdInvite {
  id: string
  householdId: string
  householdName: string
  invitedBy: string
  invitedByName: string
  invitedEmail: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Date
}

// Category types
export type CategoryIcon =
  | 'UtensilsCrossed'
  | 'PackageOpen'
  | 'ShoppingBasket'
  | 'Zap'
  | 'Bike'
  | 'CarTaxiFront'
  | 'Car'
  | 'TrainFront'
  | 'Fuel'
  | 'ShoppingBag'
  | 'Receipt'
  | 'HandHelping'
  | 'Film'
  | 'Dumbbell'
  | 'Heart'
  | 'GraduationCap'
  | 'Plane'
  | 'Home'
  | 'Landmark'
  | 'RefreshCw'
  | 'Scissors'
  | 'Gift'
  | 'Users'
  | 'CreditCard'
  | 'MoreHorizontal'
  | 'Wallet'
  | 'PiggyBank'

export interface Category {
  id: string
  name: string
  icon: CategoryIcon
  color: string
  isCustom: boolean
  isTransfer: boolean // true for "Credit Card Payment" type
  order: number
  householdId: string | null // null for default categories
}

// Payment method types
export type PaymentMethodType = 'upi' | 'cash' | 'debit_card' | 'credit_card'

export interface PaymentMethod {
  id: string
  userId: string
  name: string
  type: PaymentMethodType
  lastFourDigits?: string
  bankName?: string
  isDefault: boolean
  createdAt: Date
}

// Expense types
export type TransactionType = 'expense' | 'transfer' | 'household_transfer'

export interface Expense {
  id: string
  userId: string
  householdId: string | null
  toUserId: string | null // Recipient for household_transfer type
  amount: number
  categoryId: string
  paymentMethodId: string | null
  payee: string
  notes: string
  tags: string[]
  type: TransactionType
  date: Date
  createdAt: Date
  updatedAt: Date
}

// Tag types
export interface Tag {
  id: string
  name: string
  householdId: string | null // null for default tags
  isCustom: boolean
}

// Monthly income types
export interface MonthlyIncome {
  id: string
  userId: string
  month: string // YYYY-MM format
  amount: number
  fromHouseholdAmount: number // Income received from household members (excluded from household totals)
  createdAt: Date
  updatedAt: Date
}

// Dashboard/Stats types
export interface MonthlyStats {
  totalIncome: number
  totalExpenses: number
  totalTransfers: number
  saved: number
  savedPercentage: number
  byCategory: CategoryStats[]
  byUser: UserStats[]
}

export interface CategoryStats {
  categoryId: string
  categoryName: string
  categoryIcon: CategoryIcon
  categoryColor: string
  total: number
  percentage: number
  count: number
}

export interface UserStats {
  userId: string
  userName: string
  userAvatar: string
  total: number
  percentage: number
}

// Filter types
export interface ExpenseFilters {
  dateRange: {
    start: Date
    end: Date
  }
  categoryIds: string[]
  userIds: string[]
  paymentMethodIds: string[]
  tags: string[]
  type: TransactionType | 'all'
  searchQuery: string
}
