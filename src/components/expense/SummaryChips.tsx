import { Calendar, CreditCard, Tag, User, FileText } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SummaryChipsProps {
  date: Date
  paymentMethodName?: string
  selectedTags: string[]
  payee?: string
  notes?: string
  isOpen: boolean
  onChipClick: (fieldId: string) => void
}

function formatRelativeDate(date: Date): string | null {
  if (isToday(date)) return null // Don't show chip for today
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '...'
}

function ChipButton({
  children,
  iconColorClass,
  onClick,
}: {
  children: React.ReactNode
  iconColorClass?: string
  onClick: () => void
}) {
  return (
    <Badge
      variant="outline"
      role="button"
      tabIndex={0}
      className={cn(
        'cursor-pointer gap-1.5 px-2.5 py-1 text-sm hover:bg-accent',
        iconColorClass && `[&>svg]:${iconColorClass}`
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {children}
    </Badge>
  )
}

export function SummaryChips({
  date,
  paymentMethodName,
  selectedTags,
  payee,
  notes,
  isOpen,
  onChipClick,
}: SummaryChipsProps) {
  const dateLabel = formatRelativeDate(date)
  const hasChips = dateLabel || paymentMethodName || selectedTags.length > 0 || payee || notes

  if (!hasChips) return null

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 transition-all duration-200',
        isOpen ? 'pointer-events-none h-0 opacity-0 overflow-hidden' : 'opacity-100'
      )}
    >
      {dateLabel && (
        <ChipButton onClick={() => onChipClick('field-date-time')}>
          <Calendar className="h-3.5 w-3.5 text-blue-500" />
          {dateLabel}
        </ChipButton>
      )}
      {paymentMethodName && (
        <ChipButton onClick={() => onChipClick('field-payment-method')}>
          <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
          {paymentMethodName}
        </ChipButton>
      )}
      {payee && (
        <ChipButton onClick={() => onChipClick('field-payee')}>
          <User className="h-3.5 w-3.5 text-orange-500" />
          {payee}
        </ChipButton>
      )}
      {selectedTags.map((tag) => (
        <ChipButton key={tag} onClick={() => onChipClick('field-tags')}>
          <Tag className="h-3.5 w-3.5 text-violet-500" />
          {tag}
        </ChipButton>
      ))}
      {notes && (
        <ChipButton onClick={() => onChipClick('field-notes')}>
          <FileText className="h-3.5 w-3.5 text-amber-500" />
          {truncate(notes, 28)}
        </ChipButton>
      )}
    </div>
  )
}
