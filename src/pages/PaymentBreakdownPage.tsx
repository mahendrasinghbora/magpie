import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SwipeableContainer } from '@/components/SwipeableContainer'
import { formatAmount, formatMonth, PAYMENT_METHOD_TYPES } from '@/config/constants'
import { getExpenses, getPaymentMethods, getHouseholdPaymentMethods, getHouseholdMembers } from '@/lib/firestore'
import type { PaymentMethodType } from '@/types'

interface PaymentTypeStats {
  type: PaymentMethodType
  label: string
  total: number
  count: number
  percentage: number
}

interface PaymentMethodStats {
  id: string
  name: string
  type: PaymentMethodType
  lastFourDigits?: string
  bankName?: string
  total: number
  count: number
  percentage: number
}

const PAYMENT_TYPE_ICONS: Record<PaymentMethodType, React.ElementType> = {
  upi: Smartphone,
  cash: Banknote,
  debit_card: Building2,
  credit_card: CreditCard,
}

export function PaymentBreakdownPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentMonth,
    setCurrentMonth,
    expenses,
    setExpenses,
    paymentMethods,
    setPaymentMethods,
    viewMode,
    setViewMode,
    household,
    householdMembers,
    setHouseholdMembers,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [typeStats, setTypeStats] = useState<PaymentTypeStats[]>([])
  const [methodStats, setMethodStats] = useState<PaymentMethodStats[]>([])
  const [totalSpent, setTotalSpent] = useState(0)

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

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) return

      setLoading(true)
      try {
        // Get date range for current month
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)

        // Load expenses if not already loaded
        if (expenses.length === 0) {
          const expensesData = await getExpenses(user.id, user.householdId, startDate, endDate)
          setExpenses(expensesData)
        }

        // Load payment methods
        // For households, load all members' payment methods
        if (paymentMethods.length === 0) {
          if (user.householdId) {
            let members = householdMembers
            if (members.length === 0) {
              members = await getHouseholdMembers(user.householdId)
              setHouseholdMembers(members)
            }
            const memberIds = members.map((m) => m.id)
            const allPaymentMethods = await getHouseholdPaymentMethods(memberIds)
            setPaymentMethods(allPaymentMethods)
          } else {
            const paymentMethodsData = await getPaymentMethods(user.id)
            setPaymentMethods(paymentMethodsData)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, currentMonth, householdMembers.length])

  // Calculate stats
  useEffect(() => {
    if (!expenses) return

    // Filter expenses based on view mode
    const filteredExpenses = viewMode === 'my' && user
      ? expenses.filter((e) => e.userId === user.id)
      : expenses

    // Only consider actual expenses (not transfers) with payment methods
    // In "my" view: household_transfer counts as expense (you spent your budget)
    // In "all" view: household_transfer is excluded (money stays in household)
    const expensesWithPayment = filteredExpenses.filter((e) => {
      if (e.type === 'expense') return true
      if (e.type === 'household_transfer' && viewMode === 'my') return true
      return false
    })

    const total = expensesWithPayment.reduce((sum, e) => sum + e.amount, 0)
    setTotalSpent(total)

    // Calculate by payment type
    const typeMap = new Map<PaymentMethodType, { total: number; count: number }>()

    expensesWithPayment.forEach((expense) => {
      if (expense.paymentMethodId) {
        const pm = paymentMethods.find((p) => p.id === expense.paymentMethodId)
        if (pm) {
          const existing = typeMap.get(pm.type) || { total: 0, count: 0 }
          typeMap.set(pm.type, {
            total: existing.total + expense.amount,
            count: existing.count + 1,
          })
        }
      }
    })

    const typeStatsData: PaymentTypeStats[] = PAYMENT_METHOD_TYPES.map((type) => {
      const data = typeMap.get(type.value) || { total: 0, count: 0 }
      return {
        type: type.value,
        label: type.label,
        total: data.total,
        count: data.count,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
      }
    }).filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total)

    setTypeStats(typeStatsData)

    // Calculate by individual payment method
    const methodMap = new Map<string, { total: number; count: number }>()

    expensesWithPayment.forEach((expense) => {
      if (expense.paymentMethodId) {
        const existing = methodMap.get(expense.paymentMethodId) || { total: 0, count: 0 }
        methodMap.set(expense.paymentMethodId, {
          total: existing.total + expense.amount,
          count: existing.count + 1,
        })
      }
    })

    const methodStatsData: PaymentMethodStats[] = Array.from(methodMap.entries())
      .map(([pmId, data]) => {
        const pm = paymentMethods.find((p) => p.id === pmId)
        return {
          id: pmId,
          name: pm?.name || 'Unknown',
          type: pm?.type || 'cash',
          lastFourDigits: pm?.lastFourDigits,
          bankName: pm?.bankName,
          total: data.total,
          count: data.count,
          percentage: total > 0 ? (data.total / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.total - a.total)

    setMethodStats(methodStatsData)
  }, [expenses, paymentMethods, viewMode, user])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <SwipeableContainer onSwipeLeft={goToNextMonth} onSwipeRight={goToPreviousMonth}>
      <div className="min-h-screen bg-background">
        {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Payment Breakdown</h1>
      </div>

      <div className="space-y-4 p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">{formatMonth(currentMonth)}</span>
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

        {/* Total */}
        <Card>
          <CardContent className="py-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Tracked Spending</p>
              <p className="text-2xl font-bold">{formatAmount(totalSpent)}</p>
            </div>
          </CardContent>
        </Card>

        {/* By Payment Type */}
        {typeStats.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Payment Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {typeStats.map((stat) => {
                const Icon = PAYMENT_TYPE_ICONS[stat.type]
                return (
                  <div key={stat.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{stat.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({stat.count} txns)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatAmount(stat.total)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({stat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* By Individual Payment Method */}
        {methodStats.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">By Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {methodStats.map((stat) => {
                const Icon = PAYMENT_TYPE_ICONS[stat.type]
                return (
                  <div key={stat.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">{stat.name}</span>
                          {stat.lastFourDigits && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ****{stat.lastFourDigits}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{formatAmount(stat.total)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({stat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {typeStats.length === 0 && !loading && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No payment data this month</p>
              <p className="text-sm text-muted-foreground">
                Add payment methods and track expenses to see breakdown
              </p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </SwipeableContainer>
  )
}
