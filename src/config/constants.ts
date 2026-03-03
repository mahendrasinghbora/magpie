import type { Category, Tag, PaymentMethodType } from '@/types'

// Pre-defined categories
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'householdId'>[] = [
  { name: 'Dining Out', icon: 'UtensilsCrossed', color: '#ef4444', isCustom: false, isTransfer: false, order: 1 },
  { name: 'Food Delivery', icon: 'PackageOpen', color: '#f97316', isCustom: false, isTransfer: false, order: 2 },
  { name: 'Groceries', icon: 'ShoppingBasket', color: '#22c55e', isCustom: false, isTransfer: false, order: 3 },
  { name: 'Quick Commerce', icon: 'Zap', color: '#eab308', isCustom: false, isTransfer: false, order: 4 },
  { name: 'Bike Taxi', icon: 'Bike', color: '#18181b', isCustom: false, isTransfer: false, order: 5 },
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
]

// Pre-defined tags grouped by category
export const DEFAULT_TAGS: Omit<Tag, 'id' | 'householdId'>[] = [
  // Food & Delivery
  { name: 'Swiggy', isCustom: false },
  { name: 'Zomato', isCustom: false },
  { name: 'EatSure', isCustom: false },
  // Quick Commerce
  { name: 'Blinkit', isCustom: false },
  { name: 'Zepto', isCustom: false },
  { name: 'Instamart', isCustom: false },
  // Transport
  { name: 'Uber', isCustom: false },
  { name: 'Ola', isCustom: false },
  { name: 'Rapido', isCustom: false },
  { name: 'Metro', isCustom: false },
  // Shopping
  { name: 'Amazon', isCustom: false },
  { name: 'Flipkart', isCustom: false },
  { name: 'Myntra', isCustom: false },
  { name: 'Ajio', isCustom: false },
  // Payments
  { name: 'CRED', isCustom: false },
  { name: 'PhonePe', isCustom: false },
  { name: 'GPay', isCustom: false },
  { name: 'Paytm', isCustom: false },
  // Entertainment
  { name: 'Netflix', isCustom: false },
  { name: 'Prime', isCustom: false },
  { name: 'Hotstar', isCustom: false },
  { name: 'Spotify', isCustom: false },
  // General
  { name: 'Online', isCustom: false },
  { name: 'Offline', isCustom: false },
  { name: 'Work', isCustom: false },
  { name: 'Personal', isCustom: false },
  { name: 'Reimbursable', isCustom: false },
]

// Payment method types with labels
export const PAYMENT_METHOD_TYPES: { value: PaymentMethodType; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
]

// Currency configuration
export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
}

// Format amount in INR (with 2 decimal places)
export function formatAmount(amount: number, showNegative = false): string {
  const formatted = new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return showNegative ? `-${formatted}` : formatted
}

// Format date
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(CURRENCY.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

// Format time (e.g., "10:30 PM")
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(CURRENCY.locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

// Format month for display
export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat(CURRENCY.locale, {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// Get month key in YYYY-MM format
export function getMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
