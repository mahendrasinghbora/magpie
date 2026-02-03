import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { formatAmount } from '@/config/constants'

interface AnimatedAmountProps {
  value: number
  showSign?: boolean
  format?: 'currency' | 'number'
  decimals?: number
  className?: string
}

export function AnimatedAmount({
  value,
  showSign = false,
  format = 'currency',
  decimals = 2,
  className
}: AnimatedAmountProps) {
  const animatedValue = useAnimatedNumber(value, { duration: 400, decimals })

  const displayValue = format === 'currency'
    ? formatAmount(animatedValue, showSign)
    : Math.round(animatedValue).toString()

  return (
    <span className={className}>
      {displayValue}
    </span>
  )
}
