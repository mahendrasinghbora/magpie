import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatAmount } from '@/config/constants'
import { getIconComponent } from '@/lib/icons'
import type { Expense, Category, PaymentMethod } from '@/types'

interface ExpenseDetailSheetProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  paymentMethod?: PaymentMethod
  memberInfo?: { displayName: string; photoURL: string }
}

export function ExpenseDetailSheet({
  expense,
  open,
  onOpenChange,
  category,
  paymentMethod,
  memberInfo,
}: ExpenseDetailSheetProps) {
  const navigate = useNavigate()

  if (!expense) return null

  const Icon = category ? getIconComponent(category.icon) : null

  const handleEdit = () => {
    onOpenChange(false)
    navigate(`/expense/${expense.id}`)
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'expense':
        return 'Regular Expense'
      case 'transfer':
        return 'Transfer'
      case 'household_transfer':
        return 'Give to Family Member'
      default:
        return type
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh]">
        <SheetHeader className="text-left">
          <SheetTitle>Expense Details</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 pb-4">
          {/* Amount */}
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: '#e11d48' }}>
              {formatAmount(expense.amount, true)}
            </p>
          </div>

          {/* Category */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            {Icon && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `${category?.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: category?.color }} />
              </div>
            )}
            <div>
              <p className="font-medium">{category?.name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">Category</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex justify-between rounded-lg bg-muted/50 p-3">
            <div>
              <p className="font-medium">{format(expense.date, 'PPP')}</p>
              <p className="text-sm text-muted-foreground">Date</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{format(expense.date, 'h:mm a')}</p>
              <p className="text-sm text-muted-foreground">Time</p>
            </div>
          </div>

          {/* Payment Method */}
          {paymentMethod && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">
                {paymentMethod.name}
                {paymentMethod.lastFourDigits && ` (****${paymentMethod.lastFourDigits})`}
              </p>
              <p className="text-sm text-muted-foreground">Payment Method</p>
            </div>
          )}

          {/* Payee */}
          {expense.payee && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">{expense.payee}</p>
              <p className="text-sm text-muted-foreground">Payee</p>
            </div>
          )}

          {/* Notes */}
          {expense.notes && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="whitespace-pre-wrap">{expense.notes}</p>
              <p className="mt-1 text-sm text-muted-foreground">Notes</p>
            </div>
          )}

          {/* Tags */}
          {expense.tags && expense.tags.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex flex-wrap gap-1.5">
                {expense.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-muted-foreground/40 text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Tags</p>
            </div>
          )}

          {/* Transaction Type */}
          {expense.type !== 'expense' && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">{getTransactionTypeLabel(expense.type)}</p>
              <p className="text-sm text-muted-foreground">Transaction Type</p>
            </div>
          )}

          {/* Added by (household view) */}
          {memberInfo && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={memberInfo.photoURL} />
                <AvatarFallback>{memberInfo.displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{memberInfo.displayName}</p>
                <p className="text-sm text-muted-foreground">Added by</p>
              </div>
            </div>
          )}

          {/* Edit Button */}
          <Button onClick={handleEdit} className="w-full" size="lg">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Expense
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
