import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { ExpenseFormPage } from '@/pages/ExpenseFormPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PaymentMethodsPage } from '@/pages/settings/PaymentMethodsPage'
import { IncomePage } from '@/pages/settings/IncomePage'
import { HouseholdPage } from '@/pages/settings/HouseholdPage'
import { CategoriesPage } from '@/pages/settings/CategoriesPage'
import { TagsPage } from '@/pages/settings/TagsPage'
import { ProfilePage } from '@/pages/settings/ProfilePage'
import { PaymentBreakdownPage } from '@/pages/PaymentBreakdownPage'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
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
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
