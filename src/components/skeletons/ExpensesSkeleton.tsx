import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ExpensesSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 space-y-3 bg-background p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-9" />
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>

        {/* Search */}
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Expense List */}
      <div className="space-y-4 p-4 pt-0">
        {/* Day Group 1 */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <ExpenseCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Day Group 2 */}
        <div>
          <Skeleton className="h-4 w-28 mb-2" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <ExpenseCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Day Group 3 */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <ExpenseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExpenseCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex gap-3 p-3">
        {/* Icon */}
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-1">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0 space-y-1">
          <Skeleton className="h-5 w-16 ml-auto" />
          <Skeleton className="h-3 w-12 ml-auto" />
        </div>
      </CardContent>
    </Card>
  )
}
