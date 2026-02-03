import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { formatAmount } from '@/config/constants'

interface AnimatedAmountProps {
  value: number
  showSign?: boolean
  className?: string
}

export function AnimatedAmount({ value, showSign = false, className }: AnimatedAmountProps) {
  const animatedValue = useAnimatedNumber(value, { duration: 400, decimals: 2 })

  return (
    <span className={className}>
      {formatAmount(animatedValue, showSign)}
    </span>
  )
}
