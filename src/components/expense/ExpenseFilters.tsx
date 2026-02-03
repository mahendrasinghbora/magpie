import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getIconComponent } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface ExpenseFiltersProps {
  onClose: () => void
}

export function ExpenseFilters({ onClose }: ExpenseFiltersProps) {
  const {
    categories,
    filters,
    setFilters,
    resetFilters,
    householdMembers,
    viewMode,
    setViewMode,
    household,
  } = useStore()

  const toggleCategory = (categoryId: string) => {
    const current = filters.categoryIds
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]
    setFilters({ categoryIds: updated })
  }

  const toggleUser = (userId: string) => {
    const current = filters.userIds
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    setFilters({ userIds: updated })
  }

  const handleReset = () => {
    resetFilters()
    onClose()
  }

  const handleApply = () => {
    onClose()
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Transaction Type */}
      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <Tabs value={filters.type} onValueChange={(v) => setFilters({ type: v as typeof filters.type })}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="expense">Expenses</TabsTrigger>
            <TabsTrigger value="transfer">Transfers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* View Mode (if in household) */}
      {household && (
        <div className="space-y-2">
          <Label>View</Label>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'my' | 'all')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Expenses</TabsTrigger>
              <TabsTrigger value="my">My Expenses</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Members Filter (if in household and viewing all) */}
      {household && viewMode === 'all' && householdMembers.length > 1 && (
        <div className="space-y-2">
          <Label>Filter by Member</Label>
          <div className="flex flex-wrap gap-2">
            {householdMembers.map((member) => (
              <Button
                key={member.id}
                variant={filters.userIds.includes(member.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleUser(member.id)}
                className="gap-2"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={member.photoURL} />
                  <AvatarFallback className="text-[10px]">
                    {member.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {member.displayName.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-2">
        <Label>Categories</Label>
        <ScrollArea className="h-48">
          <div className="flex flex-wrap gap-2 pr-4">
            {categories.map((category) => {
              const Icon = getIconComponent(category.icon)
              const isSelected = filters.categoryIds.includes(category.id)

              return (
                <Button
                  key={category.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  className={cn('gap-1.5', isSelected && 'border-primary')}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={handleReset} className="flex-1">
          Reset
        </Button>
        <Button onClick={handleApply} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
