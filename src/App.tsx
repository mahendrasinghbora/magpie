import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Eager load login page (entry point)
import { LoginPage } from '@/pages/LoginPage'

// Lazy load all other pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })))
const ExpenseFormPage = lazy(() => import('@/pages/ExpenseFormPage').then(m => ({ default: m.ExpenseFormPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const PaymentMethodsPage = lazy(() => import('@/pages/settings/PaymentMethodsPage').then(m => ({ default: m.PaymentMethodsPage })))
const IncomePage = lazy(() => import('@/pages/settings/IncomePage').then(m => ({ default: m.IncomePage })))
const HouseholdPage = lazy(() => import('@/pages/settings/HouseholdPage').then(m => ({ default: m.HouseholdPage })))
const CategoriesPage = lazy(() => import('@/pages/settings/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const TagsPage = lazy(() => import('@/pages/settings/TagsPage').then(m => ({ default: m.TagsPage })))
const ProfilePage = lazy(() => import('@/pages/settings/ProfilePage').then(m => ({ default: m.ProfilePage })))
const PaymentBreakdownPage = lazy(() => import('@/pages/PaymentBreakdownPage').then(m => ({ default: m.PaymentBreakdownPage })))

// Loading spinner component
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

// Get base path for GitHub Pages deployment
const basename = import.meta.env.BASE_URL

function App() {
  return (
    <BrowserRouter basename={basename}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Full page routes (no bottom nav) */}
                <Route path="/expense/new" element={<ExpenseFormPage />} />
                <Route path="/expense/:id" element={<ExpenseFormPage />} />
                <Route path="/settings/payment-methods" element={<PaymentMethodsPage />} />
                <Route path="/settings/income" element={<IncomePage />} />
                <Route path="/settings/household" element={<HouseholdPage />} />
                <Route path="/settings/categories" element={<CategoriesPage />} />
                <Route path="/settings/tags" element={<TagsPage />} />
                <Route path="/settings/profile" element={<ProfilePage />} />
                <Route path="/payment-breakdown" element={<PaymentBreakdownPage />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
