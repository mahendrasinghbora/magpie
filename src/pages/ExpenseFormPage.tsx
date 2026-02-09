import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar as CalendarIcon, Clock, Trash2, X, Search, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useRecentItems } from '@/hooks/useRecentItems'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { CURRENCY, PAYMENT_METHOD_TYPES } from '@/config/constants'
import {
  createExpense,
  updateExpense as updateExpenseInDB,
  deleteExpense as deleteExpenseFromDB,
  getExpenseById,
  getCategories,
  getPaymentMethods,
  getTags,
  createCategory,
  createTag,
  addHouseholdIncomeToRecipient,
} from '@/lib/firestore'
import { getMonthKey } from '@/config/constants'
import type { Expense } from '@/types'
import { getIconComponent } from '@/lib/icons'
import type { PaymentMethodType } from '@/types'

const expenseSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentMethodId: z.string().optional(),
  payee: z.string().optional(),
  notes: z.string().optional(),
  date: z.date(),
  type: z.enum(['expense', 'transfer', 'household_transfer']),
  toUserId: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

export function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    categories,
    setCategories,
    paymentMethods,
    setPaymentMethods,
    tags,
    setTags,
    expenses,
    addExpense,
    updateExpense,
    removeExpense,
    householdMembers,
  } = useStore()

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [amountInput, setAmountInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentMethodType | ''>('')
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('')
  const [existingExpense, setExistingExpense] = useState<Expense | null>(null)
  const [categorySearch, setCategorySearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const paymentMethodInitialized = useRef(false)

  const { recentIds: recentCategoryIds, addRecent: addRecentCategory } = useRecentItems('categories')
  const { recentIds: recentTagNames, addRecent: addRecentTag } = useRecentItems('tags')

  // Sort categories by frequency of use
  const sortedCategories = useMemo(() => {
    const frequencyMap = new Map<string, number>()
    expenses.forEach((expense) => {
      const count = frequencyMap.get(expense.categoryId) || 0
      frequencyMap.set(expense.categoryId, count + 1)
    })
    return [...categories].sort((a, b) => {
      const freqA = frequencyMap.get(a.id) || 0
      const freqB = frequencyMap.get(b.id) || 0
      return freqB - freqA // Most used first
    })
  }, [categories, expenses])

  // Sort tags by frequency of use
  const sortedTags = useMemo(() => {
    const frequencyMap = new Map<string, number>()
    expenses.forEach((expense) => {
      expense.tags?.forEach((tag) => {
        const count = frequencyMap.get(tag) || 0
        frequencyMap.set(tag, count + 1)
      })
    })
    return [...tags].sort((a, b) => {
      const freqA = frequencyMap.get(a.name) || 0
      const freqB = frequencyMap.get(b.name) || 0
      return freqB - freqA // Most used first
    })
  }, [tags, expenses])

  const isEditing = !!id

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      categoryId: '',
      paymentMethodId: '',
      payee: '',
      notes: '',
      date: new Date(),
      type: 'expense',
    },
  })

  const selectedCategoryId = watch('categoryId')
  const selectedDate = watch('date')

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) return

      setInitialLoading(true)
      try {
        // Load all required data in parallel
        const promises: Promise<void>[] = []

        if (categories.length === 0) {
          promises.push(
            getCategories(user.householdId).then((data) => setCategories(data))
          )
        }

        // Always load payment methods fresh to ensure we have the latest
        promises.push(
          getPaymentMethods(user.id).then((data) => setPaymentMethods(data))
        )

        if (tags.length === 0) {
          promises.push(
            getTags(user.householdId).then((data) => setTags(data))
          )
        }

        // Load the expense if editing
        if (isEditing && id) {
          promises.push(
            getExpenseById(id).then((expense) => {
              if (expense) {
                setExistingExpense(expense)
              }
            })
          )
        }

        await Promise.all(promises)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    loadData()
  }, [user, id, isEditing])

  // Set existing expense data and form values once expense is loaded
  useEffect(() => {
    if (existingExpense) {
      // Check if user owns this expense - redirect if not
      if (user && existingExpense.userId !== user.id) {
        toast.error('You can only edit your own expenses')
        navigate(-1)
        return
      }

      // Reset form with existing expense values
      reset({
        amount: existingExpense.amount,
        categoryId: existingExpense.categoryId,
        paymentMethodId: existingExpense.paymentMethodId || '',
        payee: existingExpense.payee,
        notes: existingExpense.notes,
        date: existingExpense.date,
        type: existingExpense.type,
      })

      // Set local state
      setAmountInput(existingExpense.amount.toString())
      setSelectedTags(existingExpense.tags || [])
      setTimeInput(format(existingExpense.date, 'HH:mm'))

      // Set payment method state (only once)
      if (existingExpense.paymentMethodId && paymentMethods.length > 0 && !paymentMethodInitialized.current) {
        const pm = paymentMethods.find((p) => p.id === existingExpense.paymentMethodId)
        if (pm) {
          paymentMethodInitialized.current = true
          setSelectedPaymentType(pm.type)
          setSelectedPaymentMethodId(existingExpense.paymentMethodId)
        }
      }
    } else if (!isEditing) {
      // Set current time for new expenses
      setTimeInput(format(new Date(), 'HH:mm'))
    }
  }, [existingExpense, paymentMethods, reset, isEditing, user, navigate])

  // Auto-select type based on category
  useEffect(() => {
    if (selectedCategoryId) {
      const category = categories.find((c) => c.id === selectedCategoryId)
      if (category?.isTransfer) {
        setValue('type', 'transfer')
      }
    }
  }, [selectedCategoryId, categories, setValue])

  const handleAmountChange = (value: string) => {
    // Allow numbers and one decimal point
    const numericValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setAmountInput(numericValue)
    setValue('amount', parseFloat(numericValue) || 0)
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
  }

  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creatingTag, setCreatingTag] = useState(false)

  const handleCreateCategory = async (name: string) => {
    if (!user || !name.trim()) return

    setCreatingCategory(true)
    try {
      const newCategory = {
        name: name.trim(),
        icon: 'MoreHorizontal' as const,
        color: '#71717a',
        isCustom: true,
        isTransfer: false,
        order: categories.length,
        householdId: user.householdId,
      }
      const newId = await createCategory(newCategory)
      const categoryWithId = { ...newCategory, id: newId }
      setCategories([...categories, categoryWithId])
      setValue('categoryId', newId)
      setCategorySearch('')
      toast.success(`Category "${name}" created`)
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleCreateTag = async (name: string) => {
    if (!user || !name.trim()) return

    setCreatingTag(true)
    try {
      const newTag = {
        name: name.trim(),
        householdId: user.householdId,
        isCustom: true,
      }
      const newId = await createTag(newTag)
      const tagWithId = { ...newTag, id: newId }
      setTags([...tags, tagWithId])
      setSelectedTags((prev) => [...prev, name.trim()])
      setTagSearch('')
      toast.success(`Tag "${name}" created`)
    } catch (error) {
      console.error('Error creating tag:', error)
      toast.error('Failed to create tag')
    } finally {
      setCreatingTag(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    setDeleting(true)
    try {
      await deleteExpenseFromDB(id)
      removeExpense(id)
      toast.success('Expense deleted')
      navigate(-1)
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    } finally {
      setDeleting(false)
    }
  }

  // Combine date and time
  const getDateTimeFromInputs = (date: Date, time: string): Date => {
    const [hours, minutes] = time.split(':').map(Number)
    const result = new Date(date)
    result.setHours(hours || 0, minutes || 0, 0, 0)
    return result
  }

  // Filter payment methods by selected type
  const filteredPaymentMethods = selectedPaymentType
    ? paymentMethods.filter((pm) => pm.type === selectedPaymentType)
    : []

  const handlePaymentTypeChange = (type: PaymentMethodType | '') => {
    // Ignore empty value if we've already initialized from existing expense
    // This prevents Radix Select from resetting the value during controlled updates
    if (type === '' && paymentMethodInitialized.current) {
      return
    }
    setSelectedPaymentType(type)
    setSelectedPaymentMethodId('') // Reset selected payment method
  }

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) return

    // Validate household transfer has recipient
    if (data.type === 'household_transfer' && !data.toUserId) {
      toast.error('Please select a family member')
      return
    }

    setLoading(true)
    try {
      // Combine date and time
      const dateWithTime = getDateTimeFromInputs(data.date, timeInput)

      const expenseData = {
        ...data,
        date: dateWithTime,
        userId: user.id,
        householdId: user.householdId,
        toUserId: data.type === 'household_transfer' ? (data.toUserId || null) : null,
        tags: selectedTags,
        payee: data.payee || '',
        notes: data.notes || '',
        paymentMethodId: selectedPaymentMethodId || null,
      }

      if (isEditing && id) {
        await updateExpenseInDB(id, expenseData)
        updateExpense(id, { ...expenseData, id, updatedAt: new Date() })
        toast.success('Expense updated')
      } else {
        const newId = await createExpense(expenseData)
        addExpense({
          ...expenseData,
          id: newId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        // If household transfer, add income to recipient
        if (data.type === 'household_transfer' && data.toUserId) {
          const monthKey = getMonthKey(dateWithTime)
          await addHouseholdIncomeToRecipient(data.toUserId, monthKey, data.amount)
        }

        toast.success('Expense added')
      }

      // Save to recent items
      addRecentCategory(data.categoryId)
      selectedTags.forEach((tag) => addRecentTag(tag))

      navigate(-1)
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error('Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditing ? 'Edit Expense' : 'Add Expense'}
          </h1>
        </div>
        {isEditing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this
                  expense.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
              {CURRENCY.symbol}
            </span>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="h-16 pl-10 text-3xl font-bold"
              autoFocus
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label>Category</Label>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-36">
            <div className="space-y-3">
              {/* Recent Categories */}
              {recentCategoryIds.length > 0 && !categorySearch && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Recent</p>
                  <div className="flex flex-wrap gap-2">
                    {recentCategoryIds
                      .map((id) => categories.find((c) => c.id === id))
                      .filter(Boolean)
                      .map((category) => {
                        if (!category) return null
                        const Icon = getIconComponent(category.icon)
                        const isSelected = selectedCategoryId === category.id
                        return (
                          <Button
                            key={`recent-${category.id}`}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setValue('categoryId', category.id)}
                            className={cn('gap-1.5', isSelected && 'ring-2 ring-primary')}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: isSelected ? undefined : category.color }}
                            />
                            {category.name}
                          </Button>
                        )
                      })}
                  </div>
                </div>
              )}
              {/* All Categories (sorted by frequency) */}
              <div className="space-y-1.5">
                {recentCategoryIds.length > 0 && !categorySearch && (
                  <p className="text-xs font-medium text-muted-foreground">All</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {sortedCategories
                    .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((category) => {
                      const Icon = getIconComponent(category.icon)
                      const isSelected = selectedCategoryId === category.id
                      return (
                        <Button
                          key={category.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setValue('categoryId', category.id)}
                          className={cn('gap-1.5', isSelected && 'ring-2 ring-primary')}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: isSelected ? undefined : category.color }}
                          />
                          {category.name}
                        </Button>
                      )
                    })}
                  {/* Create new category option */}
                  {categorySearch.trim() && !categories.some(
                    (c) => c.name.toLowerCase() === categorySearch.toLowerCase()
                  ) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateCategory(categorySearch)}
                      disabled={creatingCategory}
                      className="gap-1.5 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      {creatingCategory ? 'Creating...' : `Create "${categorySearch.trim()}"`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Date and Time Picker */}
        <div className="space-y-2">
          <Label>Date & Time</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue('date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="w-[150px] pl-10"
              />
            </div>
          </div>
        </div>

        {/* Payment Method - Two-step selection */}
        {paymentMethods.length > 0 && (
          <div className="space-y-2">
            <Label>Payment Method (Optional)</Label>
            <div className="flex gap-2">
              {/* Step 1: Select payment type */}
              <Select
                value={selectedPaymentType}
                onValueChange={(v) => handlePaymentTypeChange(v as PaymentMethodType | '')}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Step 2: Select specific method */}
              <Select
                value={selectedPaymentMethodId}
                onValueChange={(v) => {
                  // Ignore empty value if we've already initialized from existing expense
                  if (v === '' && paymentMethodInitialized.current) {
                    return
                  }
                  setSelectedPaymentMethodId(v)
                }}
                disabled={!selectedPaymentType || filteredPaymentMethods.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={selectedPaymentType ? 'Select' : 'Select type first'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredPaymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                      {pm.lastFourDigits && ` (${pm.lastFourDigits})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPaymentType && filteredPaymentMethods.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No {PAYMENT_METHOD_TYPES.find((t) => t.value === selectedPaymentType)?.label} payment methods added yet.
              </p>
            )}
          </div>
        )}

        {/* Payee */}
        <div className="space-y-2">
          <Label>Payee (Optional)</Label>
          <Input
            {...register('payee')}
            placeholder="Who did you pay?"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags (Optional)</Label>
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <span
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))}
            </div>
          )}
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-28">
            <div className="space-y-3">
              {/* Recent Tags */}
              {recentTagNames.length > 0 && !tagSearch && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Recent</p>
                  <div className="flex flex-wrap gap-2">
                    {recentTagNames
                      .filter((name) => !selectedTags.includes(name))
                      .filter((name) => tags.some((t) => t.name === name))
                      .map((tagName) => (
                        <Button
                          key={`recent-${tagName}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTag(tagName)}
                        >
                          {tagName}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
              {/* All Tags (sorted by frequency) */}
              <div className="space-y-1.5">
                {recentTagNames.length > 0 && !tagSearch && (
                  <p className="text-xs font-medium text-muted-foreground">All</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {sortedTags
                    .filter((t) => !selectedTags.includes(t.name))
                    .filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                    .map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTag(tag.name)}
                      >
                        {tag.name}
                      </Button>
                    ))}
                  {/* Create new tag option */}
                  {tagSearch.trim() && !tags.some(
                    (t) => t.name.toLowerCase() === tagSearch.toLowerCase()
                  ) && !selectedTags.some(
                    (t) => t.toLowerCase() === tagSearch.toLowerCase()
                  ) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateTag(tagSearch)}
                      disabled={creatingTag}
                      className="gap-1.5 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      {creatingTag ? 'Creating...' : `Create "${tagSearch.trim()}"`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Input
            {...register('notes')}
            placeholder="Add a note..."
          />
        </div>

        {/* Transaction Type */}
        {user?.householdId && (
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select
              value={watch('type')}
              onValueChange={(value) => setValue('type', value as 'expense' | 'transfer' | 'household_transfer')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Regular Expense</SelectItem>
                <SelectItem value="household_transfer">Give to Family Member</SelectItem>
                <SelectItem value="transfer">Transfer (e.g., Move to Savings)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Recipient selector for household transfer */}
        {watch('type') === 'household_transfer' && (
          <div className="space-y-2">
            <Label>Give to</Label>
            <Select
              value={watch('toUserId') || ''}
              onValueChange={(value) => setValue('toUserId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select family member" />
              </SelectTrigger>
              <SelectContent>
                {householdMembers
                  .filter((m) => m.id !== user?.id)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.displayName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This will automatically add to their income
            </p>
          </div>
        )}
        {!user?.householdId && <input type="hidden" {...register('type')} />}

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
        </Button>
      </form>
    </div>
  )
}
