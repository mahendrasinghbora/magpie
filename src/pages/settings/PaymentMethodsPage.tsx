import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
} from '@/lib/firestore'
import { PAYMENT_METHOD_TYPES } from '@/config/constants'
import type { PaymentMethodType } from '@/types'

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['upi', 'cash', 'debit_card', 'credit_card']),
  lastFourDigits: z.string().optional(),
  bankName: z.string().optional(),
})

type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>

export function PaymentMethodsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { paymentMethods, setPaymentMethods } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'upi',
    },
  })

  const selectedType = watch('type')

  useEffect(() => {
    async function loadPaymentMethods() {
      if (!user) return
      const data = await getPaymentMethods(user.id)
      setPaymentMethods(data)
    }
    loadPaymentMethods()
  }, [user])

  const onSubmit = async (data: PaymentMethodFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const id = await createPaymentMethod({
        ...data,
        userId: user.id,
        isDefault: paymentMethods.length === 0,
      })

      setPaymentMethods([
        ...paymentMethods,
        {
          id,
          ...data,
          userId: user.id,
          isDefault: paymentMethods.length === 0,
          createdAt: new Date(),
        },
      ])

      setDialogOpen(false)
      reset()
      toast.success('Payment method added')
    } catch (error) {
      console.error('Error creating payment method:', error)
      toast.error('Failed to add payment method')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMethod(id)
      setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id))
      toast.success('Payment method deleted')
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast.error('Failed to delete payment method')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      // Unset previous default
      const previousDefault = paymentMethods.find((pm) => pm.isDefault)
      if (previousDefault) {
        await updatePaymentMethod(previousDefault.id, { isDefault: false })
      }

      // Set new default
      await updatePaymentMethod(id, { isDefault: true })

      setPaymentMethods(
        paymentMethods.map((pm) => ({
          ...pm,
          isDefault: pm.id === id,
        }))
      )
      toast.success('Default payment method updated')
    } catch (error) {
      console.error('Error setting default:', error)
      toast.error('Failed to set default payment method')
    }
  }

  const getTypeLabel = (type: PaymentMethodType) => {
    return PAYMENT_METHOD_TYPES.find((t) => t.value === type)?.label || type
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Payment Methods</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(v) => setValue('type', v as PaymentMethodType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  {...register('name')}
                  placeholder={
                    selectedType === 'upi'
                      ? 'e.g., GPay, PhonePe'
                      : selectedType === 'cash'
                      ? 'Cash'
                      : 'e.g., HDFC Regalia'
                  }
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {(selectedType === 'credit_card' || selectedType === 'debit_card') && (
                <>
                  <div className="space-y-2">
                    <Label>Bank Name (Optional)</Label>
                    <Input
                      {...register('bankName')}
                      placeholder="e.g., HDFC, ICICI"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last 4 Digits (Optional)</Label>
                    <Input
                      {...register('lastFourDigits')}
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding...' : 'Add Payment Method'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-2 p-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No payment methods added</p>
              <p className="text-sm text-muted-foreground">
                Tap the + button to add one
              </p>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((pm) => (
            <Card key={pm.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{pm.name}</p>
                    {pm.isDefault && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getTypeLabel(pm.type)}
                    {pm.lastFourDigits && ` • ${pm.lastFourDigits}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!pm.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetDefault(pm.id)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pm.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
