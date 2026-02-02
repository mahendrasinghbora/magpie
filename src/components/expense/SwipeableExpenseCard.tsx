import { useState, useRef, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface SwipeableExpenseCardProps {
  children: ReactNode
  onDelete: () => Promise<void>
  onClick: () => void
}

export function SwipeableExpenseCard({ children, onDelete, onClick }: SwipeableExpenseCardProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const isDragging = useRef(false)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  const deleteButtonWidth = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    isDragging.current = true
    isHorizontalSwipe.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - startX.current
    const diffY = currentY - startY.current

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY)
      }
    }

    // Only handle horizontal swipes
    if (!isHorizontalSwipe.current) return

    // Prevent vertical scroll during horizontal swipe
    e.preventDefault()

    let newOffset: number
    if (showDelete) {
      // Already showing delete, allow swiping back
      newOffset = Math.min(0, Math.max(-deleteButtonWidth, diffX - deleteButtonWidth))
    } else {
      // Only allow swiping left
      newOffset = Math.min(0, Math.max(-deleteButtonWidth - 20, diffX))
    }

    setOffsetX(newOffset)
  }

  const handleTouchEnd = () => {
    isDragging.current = false

    // Snap to show or hide delete button
    if (offsetX < -deleteButtonWidth / 2) {
      setOffsetX(-deleteButtonWidth)
      setShowDelete(true)
    } else {
      setOffsetX(0)
      setShowDelete(false)
    }

    isHorizontalSwipe.current = null
  }

  const handleClick = () => {
    if (showDelete) {
      // If delete is showing, close it on tap
      setOffsetX(0)
      setShowDelete(false)
    } else {
      onClick()
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-lg">
        {/* Delete button background */}
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive"
          style={{ width: deleteButtonWidth }}
        >
          <button
            onClick={handleDeleteClick}
            className="flex h-full w-full items-center justify-center text-destructive-foreground"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Card content */}
        <div
          className={cn(
            'relative bg-card transition-transform',
            !isDragging.current && 'duration-200'
          )}
          style={{ transform: `translateX(${offsetX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {children}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this expense.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
