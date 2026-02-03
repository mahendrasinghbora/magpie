import { useEffect, useRef, useState } from 'react'

interface UseAnimatedNumberOptions {
  duration?: number
  decimals?: number
}

export function useAnimatedNumber(
  targetValue: number,
  options: UseAnimatedNumberOptions = {}
): number {
  const { duration = 400, decimals = 2 } = options
  const [displayValue, setDisplayValue] = useState(targetValue)
  const previousValue = useRef(targetValue)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = targetValue
    const startTime = performance.now()

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // If values are the same, no animation needed
    if (startValue === endValue) {
      return
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out curve for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentValue = startValue + (endValue - startValue) * easeOut

      // Round to specified decimals to avoid floating point issues
      const rounded = Math.round(currentValue * Math.pow(10, decimals)) / Math.pow(10, decimals)
      setDisplayValue(rounded)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        previousValue.current = endValue
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetValue, duration, decimals])

  // Update previous value when target changes
  useEffect(() => {
    return () => {
      previousValue.current = targetValue
    }
  }, [targetValue])

  return displayValue
}
