import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getCategories, createCategory, deleteCategory } from '@/lib/firestore'
import { getIconComponent, availableIcons } from '@/lib/icons'
import type { CategoryIcon } from '@/types'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
})

type CategoryFormData = z.infer<typeof categorySchema>

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
]

export function CategoriesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { categories, setCategories } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      icon: 'MoreHorizontal',
      color: COLORS[0],
    },
  })

  const selectedIcon = watch('icon') as CategoryIcon
  const selectedColor = watch('color')

  useEffect(() => {
    async function loadCategories() {
      if (!user) return
      const data = await getCategories(user.householdId)
      setCategories(data)
    }
    loadCategories()
  }, [user])

  const onSubmit = async (data: CategoryFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const maxOrder = Math.max(...categories.map((c) => c.order), 0)
      const id = await createCategory({
        name: data.name,
        icon: data.icon as CategoryIcon,
        color: data.color,
        isCustom: true,
        isTransfer: false,
        order: maxOrder + 1,
        householdId: user.householdId,
      })

      setCategories([
        ...categories,
        {
          id,
          name: data.name,
          icon: data.icon as CategoryIcon,
          color: data.color,
          isCustom: true,
          isTransfer: false,
          order: maxOrder + 1,
          householdId: user.householdId,
        },
      ])

      setDialogOpen(false)
      reset()
    } catch (error) {
      console.error('Error creating category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id)
      setCategories(categories.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Categories</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input {...register('name')} placeholder="Category name" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <ScrollArea className="h-32">
                  <div className="flex flex-wrap gap-2">
                    {availableIcons.map((icon) => {
                      const Icon = getIconComponent(icon)
                      return (
                        <Button
                          key={icon}
                          type="button"
                          variant={selectedIcon === icon ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setValue('icon', icon)}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setValue('color', color)}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Adding...' : 'Add Category'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      <div className="space-y-2 p-4">
        {categories.map((category) => {
          const Icon = getIconComponent(category.icon)
          return (
            <Card key={category.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: category.color }} />
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.isCustom && (
                      <p className="text-xs text-muted-foreground">Custom</p>
                    )}
                  </div>
                </div>
                {category.isCustom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
