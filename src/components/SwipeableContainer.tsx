import { useRef, type ReactNode } from 'react'

interface SwipeableContainerProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  className?: string
}

export function SwipeableContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  className,
}: SwipeableContainerProps) {
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isHorizontalSwipe.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isHorizontalSwipe.current === null) {
      const diffX = e.touches[0].clientX - startX.current
      const diffY = e.touches[0].clientY - startY.current

      // Determine swipe direction on first significant movement
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isHorizontalSwipe.current) return

    const endX = e.changedTouches[0].clientX
    const diffX = endX - startX.current

    if (diffX > threshold && onSwipeRight) {
      // Swiped right -> go to previous
      onSwipeRight()
    } else if (diffX < -threshold && onSwipeLeft) {
      // Swiped left -> go to next
      onSwipeLeft()
    }

    isHorizontalSwipe.current = null
  }

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}
