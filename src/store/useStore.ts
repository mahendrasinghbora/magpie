import { create } from 'zustand'
import type {
  Category,
  PaymentMethod,
  Tag,
  Expense,
  MonthlyIncome,
  ExpenseFilters,
  Household,
} from '@/types'

interface AppState {
  // Categories
  categories: Category[]
  setCategories: (categories: Category[]) => void

  // Payment Methods
  paymentMethods: PaymentMethod[]
  setPaymentMethods: (paymentMethods: PaymentMethod[]) => void

  // Tags
  tags: Tag[]
  setTags: (tags: Tag[]) => void

  // Expenses
  expenses: Expense[]
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  removeExpense: (id: string) => void

  // Monthly Income
  monthlyIncome: MonthlyIncome | null
  setMonthlyIncome: (income: MonthlyIncome | null) => void

  // Household
  household: Household | null
  setHousehold: (household: Household | null) => void
  householdMembers: { id: string; displayName: string; photoURL: string }[]
  setHouseholdMembers: (members: { id: string; displayName: string; photoURL: string }[]) => void

  // Current month for filtering
  currentMonth: Date
  setCurrentMonth: (date: Date) => void

  // Filters
  filters: ExpenseFilters
  setFilters: (filters: Partial<ExpenseFilters>) => void
  resetFilters: () => void

  // View mode (my expenses vs all household)
  viewMode: 'my' | 'all'
  setViewMode: (mode: 'my' | 'all') => void

  // Loading states
  loading: {
    categories: boolean
    paymentMethods: boolean
    tags: boolean
    expenses: boolean
  }
  setLoading: (key: keyof AppState['loading'], value: boolean) => void
}

const defaultFilters: ExpenseFilters = {
  dateRange: {
    start: null,
    end: null,
  },
  amountRange: {
    min: null,
    max: null,
  },
  categoryIds: [],
  userIds: [],
  paymentMethodIds: [],
  tags: [],
  type: 'all',
  searchQuery: '',
}

export const useStore = create<AppState>((set) => ({
  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),

  // Payment Methods
  paymentMethods: [],
  setPaymentMethods: (paymentMethods) => set({ paymentMethods }),

  // Tags
  tags: [],
  setTags: (tags) => set({ tags }),

  // Expenses
  expenses: [],
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),
  updateExpense: (id, updates) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  removeExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),

  // Monthly Income
  monthlyIncome: null,
  setMonthlyIncome: (income) => set({ monthlyIncome: income }),

  // Household
  household: null,
  setHousehold: (household) => set({ household }),
  householdMembers: [],
  setHouseholdMembers: (members) => set({ householdMembers: members }),

  // Current month
  currentMonth: new Date(),
  setCurrentMonth: (date) => set({ currentMonth: date }),

  // Filters
  filters: defaultFilters,
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),

  // View mode
  viewMode: 'my',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Loading
  loading: {
    categories: false,
    paymentMethods: false,
    tags: false,
    expenses: false,
  },
  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),
}))
