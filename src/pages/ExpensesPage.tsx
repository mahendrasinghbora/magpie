import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { formatAmount, formatDate, formatMonth } from '@/config/constants'
import { getExpenses, getCategories } from '@/lib/firestore'
import { getIconComponent } from '@/lib/icons'
import { ExpenseFilters } from '@/components/expense/ExpenseFilters'
import type { Expense } from '@/types'

export function ExpensesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    currentMonth,
    setCurrentMonth,
    expenses,
    setExpenses,
    categories,
    setCategories,
    filters,
    viewMode,
    householdMembers,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

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
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)

        const expensesData = await getExpenses(user.id, user.householdId, startDate, endDate)
        setExpenses(expensesData)

        if (categories.length === 0) {
          const categoriesData = await getCategories(user.householdId)
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error('Error loading expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, currentMonth])

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    // View mode filter
    if (viewMode === 'my' && user && expense.userId !== user.id) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const category = categories.find((c) => c.id === expense.categoryId)
      const matchesPayee = expense.payee.toLowerCase().includes(query)
      const matchesNotes = expense.notes.toLowerCase().includes(query)
      const matchesCategory = category?.name.toLowerCase().includes(query)
      const matchesTags = expense.tags.some((t) => t.toLowerCase().includes(query))

      if (!matchesPayee && !matchesNotes && !matchesCategory && !matchesTags) {
        return false
      }
    }

    // Category filter
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(expense.categoryId)) {
      return false
    }

    // Type filter
    if (filters.type !== 'all' && expense.type !== filters.type) {
      return false
    }

    // User filter
    if (filters.userIds.length > 0 && !filters.userIds.includes(expense.userId)) {
      return false
    }

    return true
  })

  // Group expenses by date
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const dateKey = formatDate(expense.date)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(expense)
    return groups
  }, {} as Record<string, Expense[]>)

  const getMemberInfo = (userId: string) => {
    return householdMembers.find((m) => m.id === userId)
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 space-y-3 bg-background p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Expenses</h1>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <ExpenseFilters onClose={() => setFiltersOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-4 p-4 pt-0">
        {Object.entries(groupedExpenses).map(([date, dayExpenses]) => (
          <div key={date}>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{date}</p>
            <div className="space-y-2">
              {dayExpenses.map((expense) => {
                const category = categories.find((c) => c.id === expense.categoryId)
                const Icon = category ? getIconComponent(category.icon) : null
                const member = getMemberInfo(expense.userId)

                return (
                  <Card
                    key={expense.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/expense/${expense.id}`)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      {/* Category Icon */}
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        {Icon && <Icon className="h-5 w-5" style={{ color: category?.color }} />}
                      </div>

                      {/* Details */}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {expense.payee || category?.name || 'Unknown'}
                          </span>
                          {expense.type === 'transfer' && (
                            <Badge variant="secondary" className="text-xs">
                              Transfer
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{category?.name}</span>
                          {expense.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{expense.tags[0]}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount and User */}
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(expense.amount)}</p>
                        {user?.householdId && member && viewMode === 'all' && (
                          <Avatar className="ml-auto h-5 w-5">
                            <AvatarImage src={member.photoURL} />
                            <AvatarFallback className="text-[10px]">
                              {member.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No expenses found</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
