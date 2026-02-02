import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMonthlyIncome, setMonthlyIncome } from '@/lib/firestore'
import { formatAmount, formatMonth, getMonthKey, CURRENCY } from '@/config/constants'

export function IncomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentMonth, setCurrentMonth } = useStore()

  const [income, setIncome] = useState<number | null>(null)
  const [incomeInput, setIncomeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }

  // Load income for current month
  useEffect(() => {
    async function loadIncome() {
      if (!user) return

      setLoading(true)
      try {
        const monthKey = getMonthKey(currentMonth)
        const data = await getMonthlyIncome(user.id, monthKey)
        setIncome(data?.amount || null)
        setIncomeInput(data?.amount?.toString() || '')
      } catch (error) {
        console.error('Error loading income:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIncome()
  }, [user, currentMonth])

  const handleIncomeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setIncomeInput(numericValue)
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const amount = parseInt(incomeInput) || 0
      const monthKey = getMonthKey(currentMonth)
      await setMonthlyIncome(user.id, monthKey, amount)
      setIncome(amount)
      toast.success('Income saved successfully')
    } catch (error) {
      console.error('Error saving income:', error)
      toast.error('Failed to save income')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Monthly Income</h1>
      </div>

      <div className="space-y-4 p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">{formatMonth(currentMonth)}</span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Income Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Set Income for {formatMonth(currentMonth)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                  {CURRENCY.symbol}
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={incomeInput}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                  className="h-14 pl-10 text-2xl font-bold"
                  disabled={loading}
                />
              </div>
            </div>

            {income !== null && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Saved: {formatAmount(income)}</span>
              </div>
            )}

            <Button
              onClick={handleSave}
              className="w-full"
              disabled={saving || loading}
            >
              {saving ? 'Saving...' : 'Save Income'}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Your monthly income is used to calculate how much you've saved.
              Set it at the beginning of each month to track your savings
              accurately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
