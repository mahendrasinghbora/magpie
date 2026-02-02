import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { UserStats } from '@/types'
import { formatAmount } from '@/config/constants'

interface UserComparisonProps {
  data: UserStats[]
}

export function UserComparison({ data }: UserComparisonProps) {
  const maxTotal = Math.max(...data.map((u) => u.total))

  return (
    <div className="space-y-4">
      {data.map((user) => (
        <div key={user.userId} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.userAvatar} />
                <AvatarFallback>{user.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.userName}</span>
            </div>
            <span className="font-semibold">{formatAmount(user.total)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(user.total / maxTotal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
