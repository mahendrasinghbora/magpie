import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PullToRefresh } from '@/components/PullToRefresh'
import { formatAmount, formatMonth, getMonthKey } from '@/config/constants'
import { getExpenses, getCategories, getMonthlyIncome, getHouseholdMonthlyIncome, getHousehold, getHouseholdMembers } from '@/lib/firestore'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { StatCard } from '@/components/dashboard/StatCard'
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
    monthlyIncome,
    setMonthlyIncome,
    household,
    setHousehold,
    householdMembers,
    setHouseholdMembers,
  } = useStore()

  const [stats, setStats] = useState<MonthlyStats | null>(null)
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

      // Load expenses
      const expensesData = await getExpenses(user.id, user.householdId, startDate, endDate)
      setExpenses(expensesData)

      // Load categories if not already loaded
      if (categories.length === 0) {
        const categoriesData = await getCategories(user.householdId)
        setCategories(categoriesData)
      }

      // Load monthly income
      const monthKey = getMonthKey(currentMonth)
      const incomeData = await getMonthlyIncome(user.id, monthKey)
      setMonthlyIncome(incomeData)

      // Load household and members if in household
      if (user.householdId) {
        let members = householdMembers
        if (!household) {
          const householdData = await getHousehold(user.householdId)
          setHousehold(householdData)
        }
        if (householdMembers.length === 0) {
          members = await getHouseholdMembers(user.householdId)
          setHouseholdMembers(members)
        }
        // Load total household income
        const memberIds = members.map((m) => m.id)
        const totalIncome = await getHouseholdMonthlyIncome(memberIds, monthKey)
        setHouseholdTotalIncome(totalIncome)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, currentMonth, categories.length, household, householdMembers.length, setExpenses, setCategories, setMonthlyIncome, setHousehold, setHouseholdMembers])

  // Initial load and on month change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await loadData(false)
  }, [loadData])

  // Calculate stats
  useEffect(() => {
    if (!expenses || categories.length === 0) return

    // Filter expenses based on view mode
    const filteredExpenses = viewMode === 'my' && user
      ? expenses.filter((e) => e.userId === user.id)
      : expenses

    // Separate expenses and transfers
    const actualExpenses = filteredExpenses.filter((e) => e.type === 'expense')
    const transfers = filteredExpenses.filter((e) => e.type === 'transfer')

    const totalExpenses = actualExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalTransfers = transfers.reduce((sum, e) => sum + e.amount, 0)

    // Calculate income based on view mode
    let totalIncome = 0
    if (viewMode === 'my') {
      totalIncome = monthlyIncome?.amount || 0
    } else {
      // For household view, sum all members' income
      totalIncome = householdTotalIncome
    }

    const saved = totalIncome - totalExpenses
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

    setStats({
      totalIncome,
      totalExpenses,
      totalTransfers,
      saved,
      savedPercentage,
      byCategory,
      byUser,
    })
  }, [expenses, categories, viewMode, monthlyIncome, householdTotalIncome, householdMembers, user])

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
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
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">{formatMonth(currentMonth)}</h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
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
              <span className="font-medium">{formatAmount(stats.totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spent</span>
              <span className="font-medium text-destructive">
                {formatAmount(stats.totalExpenses)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saved</span>
              <span className={`font-semibold ${stats.saved >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatAmount(stats.saved)}
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
            value={expenses.filter((e) => e.type === 'expense').length.toString()}
            subtitle="this month"
          />
          <StatCard
            title="Avg/Day"
            value={formatAmount(
              stats.totalExpenses / new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
            )}
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
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No expenses this month</p>
            <p className="text-sm text-muted-foreground">
              Tap the + button to add your first expense
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </PullToRefresh>
  )
}
