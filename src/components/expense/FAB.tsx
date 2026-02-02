import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function FAB() {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() => navigate('/expense/new')}
      size="lg"
      className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Add expense</span>
    </Button>
  )
}
