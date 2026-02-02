import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Calendar as CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
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
import { cn } from '@/lib/utils'
import { CURRENCY } from '@/config/constants'
import {
  createExpense,
  updateExpense as updateExpenseInDB,
  getCategories,
  getPaymentMethods,
  getTags,
} from '@/lib/firestore'
import { getIconComponent } from '@/lib/icons'

const expenseSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentMethodId: z.string().optional(),
  payee: z.string().optional(),
  notes: z.string().optional(),
  date: z.date(),
  type: z.enum(['expense', 'transfer']),
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
  } = useStore()

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [amountInput, setAmountInput] = useState('')

  const isEditing = !!id
  const existingExpense = isEditing ? expenses.find((e) => e.id === id) : null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: existingExpense?.amount || 0,
      categoryId: existingExpense?.categoryId || '',
      paymentMethodId: existingExpense?.paymentMethodId || '',
      payee: existingExpense?.payee || '',
      notes: existingExpense?.notes || '',
      date: existingExpense?.date || new Date(),
      type: existingExpense?.type || 'expense',
    },
  })

  const selectedCategoryId = watch('categoryId')
  const selectedDate = watch('date')

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        if (categories.length === 0) {
          const categoriesData = await getCategories(user.householdId)
          setCategories(categoriesData)
        }

        if (paymentMethods.length === 0) {
          const paymentMethodsData = await getPaymentMethods(user.id)
          setPaymentMethods(paymentMethodsData)
        }

        if (tags.length === 0) {
          const tagsData = await getTags(user.householdId)
          setTags(tagsData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [user])

  // Set existing expense data
  useEffect(() => {
    if (existingExpense) {
      setAmountInput(existingExpense.amount.toString())
      setSelectedTags(existingExpense.tags)
    }
  }, [existingExpense])

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
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setAmountInput(numericValue)
    setValue('amount', parseInt(numericValue) || 0)
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
  }

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const expenseData = {
        ...data,
        userId: user.id,
        householdId: user.householdId,
        tags: selectedTags,
        payee: data.payee || '',
        notes: data.notes || '',
        paymentMethodId: data.paymentMethodId || null,
      }

      if (isEditing && id) {
        await updateExpenseInDB(id, expenseData)
        updateExpense(id, { ...expenseData, id, updatedAt: new Date() })
      } else {
        const newId = await createExpense(expenseData)
        addExpense({
          ...expenseData,
          id: newId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      navigate(-1)
    } catch (error) {
      console.error('Error saving expense:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </h1>
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
              inputMode="numeric"
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
          <ScrollArea className="h-32">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
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
            </div>
          </ScrollArea>
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
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
        </div>

        {/* Payment Method */}
        {paymentMethods.length > 0 && (
          <div className="space-y-2">
            <Label>Payment Method (Optional)</Label>
            <Select
              value={watch('paymentMethodId') || ''}
              onValueChange={(v) => setValue('paymentMethodId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>
                    {pm.name}
                    {pm.lastFourDigits && ` (${pm.lastFourDigits})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <ScrollArea className="h-24">
            <div className="flex flex-wrap gap-2">
              {tags
                .filter((t) => !selectedTags.includes(t.name))
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

        {/* Transaction Type (hidden, auto-set based on category) */}
        <input type="hidden" {...register('type')} />

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Saving...' : isEditing ? 'Update Expense' : 'Add Expense'}
        </Button>
      </form>
    </div>
  )
}
