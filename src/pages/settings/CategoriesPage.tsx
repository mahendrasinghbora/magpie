import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/firestore'
import { getIconComponent, availableIcons } from '@/lib/icons'
import type { Category, CategoryIcon } from '@/types'

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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

  const openCreateDialog = () => {
    setEditingCategory(null)
    reset({
      name: '',
      icon: 'MoreHorizontal',
      color: COLORS[0],
    })
    setDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    reset({
      name: category.name,
      icon: category.icon,
      color: category.color,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: CategoryFormData) => {
    if (!user) return

    setLoading(true)
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, {
          name: data.name,
          icon: data.icon as CategoryIcon,
          color: data.color,
        })
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: data.name, icon: data.icon as CategoryIcon, color: data.color }
              : c
          )
        )
        toast.success('Category updated')
      } else {
        // Create new category
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
        toast.success('Category created')
      }

      setDialogOpen(false)
      reset()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingCategory) return

    setLoading(true)
    try {
      await deleteCategory(editingCategory.id)
      setCategories(categories.filter((c) => c.id !== editingCategory.id))
      setDeleteDialogOpen(false)
      setDialogOpen(false)
      toast.success('Category deleted')
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    } finally {
      setLoading(false)
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
        <Button size="icon" onClick={openCreateDialog}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-2 p-4">
        {categories.map((category) => {
          const Icon = getIconComponent(category.icon)
          return (
            <Card
              key={category.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => openEditDialog(category)}
            >
              <CardContent className="flex items-center gap-2 p-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: category.color }} />
                </div>
                <p className="truncate text-sm font-medium">{category.name}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
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

            <div className="flex gap-2">
              {editingCategory && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : editingCategory ? 'Save Changes' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{editingCategory?.name}". Expenses using this category won't be deleted but will show "Unknown" category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
