import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { FAB } from '@/components/expense/FAB'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md pb-20">
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
    </div>
  )
}
