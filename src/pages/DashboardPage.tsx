import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PullToRefresh } from '@/components/PullToRefresh'
import { SwipeableContainer } from '@/components/SwipeableContainer'
import { formatAmount, formatMonth, getMonthKey } from '@/config/constants'
import { getExpenses, getCategories, getPaymentMethods, getMonthlyIncome, getHouseholdMonthlyIncome, getHousehold, getHouseholdMembers } from '@/lib/firestore'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { StatCard } from '@/components/dashboard/StatCard'
import { AnimatedAmount } from '@/components/AnimatedAmount'
import { UserComparison } from '@/components/dashboard/UserComparison'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import type { MonthlyStats, CategoryStats, UserStats } from '@/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentMonth,
    setCurrentMonth,
    viewMode,
    setViewMode,
    expenses,
    setExpenses,
    categories,
    setCategories,
    paymentMethods,
    setPaymentMethods,
    monthlyIncome,
    setMonthlyIncome,
    household,
    setHousehold,
    householdMembers,
    setHouseholdMembers,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [householdTotalIncome, setHouseholdTotalIncome] = useState(0)

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }

  // Load data function
  const loadData = useCallback(async (showLoader = true) => {
    if (!user) return

    if (showLoader) setLoading(true)
    try {
      // Get date range for current month
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)
      const monthKey = getMonthKey(currentMonth)

      // Fire all independent queries in parallel
      const [expensesData, categoriesData, paymentMethodsData, incomeData, householdData, membersData] = await Promise.all([
        getExpenses(user.id, user.householdId, startDate, endDate),
        categories.length === 0 ? getCategories(user.householdId) : Promise.resolve(null),
        paymentMethods.length === 0 ? getPaymentMethods(user.id) : Promise.resolve(null),
        getMonthlyIncome(user.id, monthKey),
        user.householdId && !household ? getHousehold(user.householdId) : Promise.resolve(null),
        user.householdId && householdMembers.length === 0 ? getHouseholdMembers(user.householdId) : Promise.resolve(null),
      ])

      setExpenses(expensesData)
      if (categoriesData) setCategories(categoriesData)
      if (paymentMethodsData) setPaymentMethods(paymentMethodsData)
      setMonthlyIncome(incomeData)
      if (householdData) setHousehold(householdData)

      const members = membersData ?? householdMembers
      if (membersData) setHouseholdMembers(membersData)

      // Household income depends on member IDs, so it runs after the first batch
      if (user.householdId) {
        const memberIds = members.map((m) => m.id)
        const totalIncome = await getHouseholdMonthlyIncome(memberIds, monthKey)
        setHouseholdTotalIncome(totalIncome)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user, currentMonth, categories.length, paymentMethods.length, household, householdMembers, setExpenses, setCategories, setPaymentMethods, setMonthlyIncome, setHousehold, setHouseholdMembers])

  // Initial load and on month change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await loadData(false)
  }, [loadData])

  // Calculate stats
  const stats = useMemo<MonthlyStats | null>(() => {
    if (!expenses || categories.length === 0) return null

    // Filter expenses based on view mode
    const filteredExpenses = viewMode === 'my' && user
      ? expenses.filter((e) => e.userId === user.id)
      : expenses

    // Separate expenses and transfers
    // In "my" view: household_transfer counts as expense (you spent your budget)
    // In "all" view: household_transfer is excluded (money stays in household)
    const actualExpenses = filteredExpenses.filter((e) => {
      if (e.type === 'expense') return true
      if (e.type === 'household_transfer' && viewMode === 'my') return true
      return false
    })
    const transfers = filteredExpenses.filter((e) => e.type === 'transfer')
    const totalExpenses = actualExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalTransfers = transfers.reduce((sum, e) => sum + e.amount, 0)

    // Calculate cash outflow (actual money leaving your account)
    // Credit card expenses don't reduce savings until bill is paid
    // Cash outflow = non-CC expenses + transfers (CC bill payments)
    const cashOutflow = actualExpenses.reduce((sum, e) => {
      const paymentMethod = paymentMethods.find((pm) => pm.id === e.paymentMethodId)
      // If paid with credit card, don't count towards cash outflow
      if (paymentMethod?.type === 'credit_card') return sum
      return sum + e.amount
    }, 0) + totalTransfers

    // Calculate income based on view mode
    let totalIncome = 0
    if (viewMode === 'my') {
      totalIncome = monthlyIncome?.amount || 0
    } else {
      // For household view, sum all members' income
      totalIncome = householdTotalIncome
    }

    // Savings based on actual cash outflow, not credit card expenses
    const saved = totalIncome - cashOutflow
    const savedPercentage = totalIncome > 0 ? (saved / totalIncome) * 100 : 0

    // Category breakdown
    const categoryMap = new Map<string, number>()
    actualExpenses.forEach((e) => {
      const current = categoryMap.get(e.categoryId) || 0
      categoryMap.set(e.categoryId, current + e.amount)
    })

    const byCategory: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([categoryId, total]) => {
        const category = categories.find((c) => c.id === categoryId)
        return {
          categoryId,
          categoryName: category?.name || 'Unknown',
          categoryIcon: category?.icon || 'MoreHorizontal',
          categoryColor: category?.color || '#71717a',
          total,
          percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
          count: actualExpenses.filter((e) => e.categoryId === categoryId).length,
        }
      })
      .sort((a, b) => b.total - a.total)

    // User breakdown (for household view)
    const userMap = new Map<string, number>()
    actualExpenses.forEach((e) => {
      const current = userMap.get(e.userId) || 0
      userMap.set(e.userId, current + e.amount)
    })

    const byUser: UserStats[] = Array.from(userMap.entries()).map(([userId, total]) => {
      const member = householdMembers.find((m) => m.id === userId)
      return {
        userId,
        userName: member?.displayName || 'Unknown',
        userAvatar: member?.photoURL || '',
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      }
    })

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      saved,
      savedPercentage,
      byCategory,
      byUser,
    }
  }, [expenses, categories, viewMode, monthlyIncome, householdTotalIncome, householdMembers, user, paymentMethods])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <SwipeableContainer onSwipeLeft={goToNextMonth} onSwipeRight={goToPreviousMonth}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>
              {user?.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <p className="font-medium">{user?.displayName?.split(' ')[0]}</p>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-11 w-11" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{formatMonth(currentMonth)}</h2>
        <Button variant="ghost" size="icon" className="h-11 w-11" onClick={goToNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* View Mode Toggle (only show if in household) */}
      {household && (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'my' | 'all')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Expenses</TabsTrigger>
            <TabsTrigger value="my">My Expenses</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Summary Card */}
      {stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Income</span>
              <AnimatedAmount value={stats.totalIncome} className="font-medium" />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spent</span>
              <AnimatedAmount value={stats.totalExpenses} className="font-medium text-destructive" />
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-semibold ${stats.saved >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                <AnimatedAmount value={stats.saved} />
                {stats.totalIncome > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({stats.savedPercentage.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Transactions"
            value={<AnimatedAmount value={expenses.filter((e) => e.type === 'expense' && (viewMode === 'all' || e.userId === user?.id)).length} format="number" />}
            subtitle="this month"
          />
          <StatCard
            title="Avg/Day"
            value={<AnimatedAmount value={stats.totalExpenses / new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()} />}
            subtitle="spending"
          />
        </div>
      )}

      {/* Payment Breakdown Link */}
      <Card
        className="cursor-pointer transition-colors hover:bg-accent"
        onClick={() => navigate('/payment-breakdown')}
      >
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">Payment Breakdown</p>
            <p className="text-sm text-muted-foreground">
              View spending by payment method
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Category Pie Chart */}
      {stats && stats.byCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={stats.byCategory} />
          </CardContent>
        </Card>
      )}

      {/* User Comparison (only show if in household and viewing all) */}
      {household && viewMode === 'all' && stats && stats.byUser.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Who Spent How Much</CardTitle>
          </CardHeader>
          <CardContent>
            <UserComparison data={stats.byUser} />
          </CardContent>
        </Card>
      )}

      {/* Top Categories */}
      {stats && stats.byCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byCategory.slice(0, 5).map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.categoryColor }}
                  />
                  <span className="text-sm">{cat.categoryName}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatAmount(cat.total)}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!stats || stats.byCategory.length === 0) && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No expenses this month</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the + button to add your first expense
            </p>
          </CardContent>
        </Card>
      )}
        </div>
      </PullToRefresh>
    </SwipeableContainer>
  )
}
