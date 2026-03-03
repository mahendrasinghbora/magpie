import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Search, X, Filter, ChevronLeft, ChevronRight, CalendarDays, Receipt, SearchX } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PullToRefresh } from '@/components/PullToRefresh'
import { SwipeableContainer } from '@/components/SwipeableContainer'
import { SwipeableExpenseCard } from '@/components/expense/SwipeableExpenseCard'
import { formatAmount, formatDate, formatMonth, formatTime } from '@/config/constants'
import { getExpenses, getCategories, deleteExpense } from '@/lib/firestore'
import { getIconComponent } from '@/lib/icons'
import { ExpenseFilters } from '@/components/expense/ExpenseFilters'
import { ExpenseDetailSheet } from '@/components/expense/ExpenseDetailSheet'
import { ExpensesSkeleton } from '@/components/skeletons/ExpensesSkeleton'
import type { Expense } from '@/types'

export function ExpensesPage() {
  const { user } = useAuth()
  const {
    currentMonth,
    setCurrentMonth,
    expenses,
    setExpenses,
    categories,
    setCategories,
    filters,
    viewMode,
    setViewMode,
    household,
    householdMembers,
    paymentMethods,
    removeExpense,
    addExpense,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [monthLoading, setMonthLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(50)

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.categoryIds.length > 0 ||
      filters.userIds.length > 0 ||
      filters.paymentMethodIds.length > 0 ||
      filters.tags.length > 0 ||
      filters.type !== 'all' ||
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null ||
      filters.amountRange.min !== null ||
      filters.amountRange.max !== null
    )
  }, [filters])

  // Generate months for picker (current year and previous year)
  const monthOptions = useMemo(() => {
    const months = []
    const currentYear = new Date().getFullYear()
    for (let year = currentYear; year >= currentYear - 1; year--) {
      for (let month = 11; month >= 0; month--) {
        months.push(new Date(year, month, 1))
      }
    }
    return months
  }, [])

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

    // Full skeleton only on initial load (no expenses yet), otherwise light spinner
    if (showLoader) {
      if (expenses.length === 0) {
        setLoading(true)
      } else {
        setMonthLoading(true)
      }
    }
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
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
      setMonthLoading(false)
    }
  }, [user, currentMonth, categories.length, expenses.length, setExpenses, setCategories])

  // Initial load and on month change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset visible count on month/filter/search change
  useEffect(() => {
    setVisibleCount(50)
  }, [currentMonth, filters, searchQuery])

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await loadData(false)
  }, [loadData])

  // Undo-on-delete: optimistic remove, delayed server delete, undo restores
  const pendingDeletes = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; expense: Expense }>())

  const handleDeleteExpense = useCallback((expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId)
    if (!expense) return

    // Optimistic remove from store
    removeExpense(expenseId)

    // Clear any existing pending delete for this expense
    const existing = pendingDeletes.current.get(expenseId)
    if (existing) clearTimeout(existing.timer)

    // Schedule server delete after 5s
    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(expenseId)
      try {
        await deleteExpense(expenseId)
      } catch (error) {
        console.error('Error deleting expense:', error)
        // Restore on server error
        addExpense(expense)
        toast.error('Failed to delete expense')
      }
    }, 5000)

    pendingDeletes.current.set(expenseId, { timer, expense })

    toast('Expense deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          const pending = pendingDeletes.current.get(expenseId)
          if (pending) {
            clearTimeout(pending.timer)
            pendingDeletes.current.delete(expenseId)
            addExpense(pending.expense)
          }
        },
      },
      duration: 5000,
    })
  }, [expenses, removeExpense, addExpense])

  // Flush pending deletes on unmount
  useEffect(() => {
    const ref = pendingDeletes.current
    return () => {
      ref.forEach(async ({ timer, expense }) => {
        clearTimeout(timer)
        try {
          await deleteExpense(expense.id)
        } catch {
          // best-effort cleanup
        }
      })
      ref.clear()
    }
  }, [])

  // Filter expenses
  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
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

    // Date range filter
    if (filters.dateRange.start && expense.date < filters.dateRange.start) {
      return false
    }
    if (filters.dateRange.end && expense.date > filters.dateRange.end) {
      return false
    }

    // Amount range filter
    if (filters.amountRange.min !== null && expense.amount < filters.amountRange.min) {
      return false
    }
    if (filters.amountRange.max !== null && expense.amount > filters.amountRange.max) {
      return false
    }

    return true
  }), [expenses, viewMode, user, searchQuery, categories, filters])

  // Group expenses by date
  const groupedExpenses = useMemo(() => filteredExpenses.reduce((groups, expense) => {
    const dateKey = formatDate(expense.date)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(expense)
    return groups
  }, {} as Record<string, Expense[]>), [filteredExpenses])

  // Paginate: slice grouped data to visibleCount
  const { visibleGroupedExpenses, hasMore, remainingCount } = useMemo(() => {
    const entries = Object.entries(groupedExpenses)
    let count = 0
    const visible: Record<string, Expense[]> = {}
    for (const [date, dayExpenses] of entries) {
      if (count >= visibleCount) break
      const remaining = visibleCount - count
      const slice = dayExpenses.slice(0, remaining)
      visible[date] = slice
      count += slice.length
    }
    const total = filteredExpenses.length
    return {
      visibleGroupedExpenses: visible,
      hasMore: count < total,
      remainingCount: total - count,
    }
  }, [groupedExpenses, visibleCount, filteredExpenses.length])

  // Monthly spending total (exclude transfers — they're not spending)
  const monthlyTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.type === 'expense' || (e.type === 'household_transfer' && viewMode === 'my'))
      .reduce((sum, e) => sum + e.amount, 0)
  }, [filteredExpenses, viewMode])

  // Show swipe hint on first card, once ever
  const swipeHintShown = useRef(() => {
    try { return localStorage.getItem('magpie:swipeHintShown') === '1' } catch { return false }
  })
  const [showSwipeHint, setShowSwipeHint] = useState(!swipeHintShown.current())
  const firstCardHinted = useRef(false)

  const getMemberInfo = (userId: string) => {
    return householdMembers.find((m) => m.id === userId)
  }

  if (loading) {
    return <ExpensesSkeleton />
  }

  return (
    <SwipeableContainer onSwipeLeft={goToNextMonth} onSwipeRight={goToPreviousMonth}>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 space-y-3 bg-background p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Expenses</h1>
          <div className="flex items-center gap-1">
            <Button
              variant={searchOpen ? 'default' : 'outline'}
              size="icon"
              onClick={() => {
                setSearchOpen((prev) => {
                  if (prev) setSearchQuery('')
                  return !prev
                })
                // Focus input after opening
                setTimeout(() => searchInputRef.current?.focus(), 50)
              }}
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                  )}
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
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="gap-2 font-medium">
                <CalendarDays className="h-4 w-4" />
                {formatMonth(currentMonth)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="center">
              <ScrollArea className="h-64">
                <div className="p-2">
                  {monthOptions.map((date) => {
                    const isSelected =
                      date.getMonth() === currentMonth.getMonth() &&
                      date.getFullYear() === currentMonth.getFullYear()
                    return (
                      <Button
                        key={date.toISOString()}
                        variant={isSelected ? 'default' : 'ghost'}
                        className="w-full justify-start mb-1"
                        onClick={() => {
                          setCurrentMonth(date)
                          setMonthPickerOpen(false)
                        }}
                      >
                        {formatMonth(date)}
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* View Mode Toggle (only show if in household) */}
        {household && (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'my' | 'all')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my">My Expenses</TabsTrigger>
              <TabsTrigger value="all">All Expenses</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Search (collapsible) */}
        {searchOpen && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Monthly total */}
      {filteredExpenses.length > 0 && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
          </span>
          <span className="text-sm font-semibold text-destructive">
            {formatAmount(monthlyTotal)}
          </span>
        </div>
      )}

      {/* Month loading spinner */}
      {monthLoading && (
        <div className="flex justify-center py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Expense List */}
      <div className="space-y-4 p-4 pt-0">
        {Object.entries(visibleGroupedExpenses).map(([date, dayExpenses]) => (
          <div key={date}>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{date}</p>
            <div className="space-y-2">
              {dayExpenses.map((expense) => {
                const category = categories.find((c) => c.id === expense.categoryId)
                const Icon = category ? getIconComponent(category.icon) : null
                const member = getMemberInfo(expense.userId)
                const expensePaymentMethod = paymentMethods.find((pm) => pm.id === expense.paymentMethodId)
                const isCreditCard = expensePaymentMethod?.type === 'credit_card'

                // Title: Payee if exists, otherwise category name
                const title = expense.payee || category?.name || 'Unknown'
                // Subtitle: Category (if payee shown) + Notes
                const showCategory = expense.payee && category?.name
                const maxNotesLength = 30
                const truncatedNotes = expense.notes.length > maxNotesLength
                  ? expense.notes.substring(0, maxNotesLength) + '...'
                  : expense.notes
                // Tags: max 3
                const displayTags = expense.tags.slice(0, 3)

                const isFirstHint = showSwipeHint && !firstCardHinted.current && expense.userId === user?.id
                if (isFirstHint) {
                  firstCardHinted.current = true
                  try { localStorage.setItem('magpie:swipeHintShown', '1') } catch { /* */ }
                  // Dismiss hint state after animation
                  setTimeout(() => setShowSwipeHint(false), 1500)
                }

                return (
                  <SwipeableExpenseCard
                    key={expense.id}
                    onDelete={() => handleDeleteExpense(expense.id)}
                    onClick={() => {
                      setSelectedExpense(expense)
                      setDetailSheetOpen(true)
                    }}
                    canDelete={expense.userId === user?.id}
                    showHint={isFirstHint}
                  >
                    <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                      <CardContent className="flex gap-3 p-3">
                        {/* Category Icon */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${category?.color}20` }}
                        >
                          {Icon && <Icon className="h-5 w-5" style={{ color: category?.color }} />}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{title}</span>
                            {expense.type === 'transfer' && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Transfer
                              </Badge>
                            )}
                            {expense.type === 'household_transfer' && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                To Family
                              </Badge>
                            )}
                          </div>

                          {/* Subtitle: Category • Notes */}
                          <div className="text-xs text-muted-foreground truncate">
                            {showCategory && <span className="font-medium">{category?.name}</span>}
                            {showCategory && truncatedNotes && <span> • </span>}
                            {truncatedNotes && <span className="italic">{truncatedNotes}</span>}
                            {!showCategory && !truncatedNotes && <span className="font-medium">{category?.name}</span>}
                          </div>

                          {/* Tags row */}
                          {displayTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {displayTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full font-normal border border-muted-foreground/40 text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Amount, Time, and Payment Method */}
                        <div className="text-right shrink-0">
                          <p className="font-semibold" style={{ color: isCreditCard ? '#f59e0b' : '#e11d48' }}>
                            {formatAmount(expense.amount, !isCreditCard)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(expense.date)}
                          </p>
                          {expensePaymentMethod && (
                            <span className={`inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded font-medium ${
                              expensePaymentMethod.type === 'credit_card'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : expensePaymentMethod.type === 'upi'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : expensePaymentMethod.type === 'cash'
                                ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                                : 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
                            }`}>
                              {expensePaymentMethod.name}
                            </span>
                          )}
                          {user?.householdId && member && viewMode === 'all' && (
                            <Avatar className="ml-auto mt-1 h-5 w-5">
                              <AvatarImage src={member.photoURL} />
                              <AvatarFallback className="text-[10px]">
                                {member.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </SwipeableExpenseCard>
                )
              })}
            </div>
          </div>
        ))}

        {/* Load More */}
        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setVisibleCount((prev) => prev + 50)}
          >
            Load more ({remainingCount} remaining)
          </Button>
        )}

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                {searchQuery || hasActiveFilters ? (
                  <SearchX className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <p className="font-medium text-foreground">
                {searchQuery || hasActiveFilters ? 'No expenses found' : 'No expenses this month'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Tap the + button to add your first expense'}
              </p>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      </PullToRefresh>

      {/* Expense Detail Sheet */}
      <ExpenseDetailSheet
        expense={selectedExpense}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        category={selectedExpense ? categories.find((c) => c.id === selectedExpense.categoryId) : undefined}
        paymentMethod={selectedExpense?.paymentMethodId ? paymentMethods.find((p) => p.id === selectedExpense.paymentMethodId) : undefined}
        memberInfo={selectedExpense ? householdMembers.find((m) => m.id === selectedExpense.userId) : undefined}
        currentUserId={user?.id}
      />
    </SwipeableContainer>
  )
}
