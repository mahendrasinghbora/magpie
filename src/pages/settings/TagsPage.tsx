import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { getTags, createTag, updateTag, deleteTag } from '@/lib/firestore'
import type { Tag } from '@/types'

export function TagsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tags, setTags } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagName, setTagName] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  useEffect(() => {
    async function loadTags() {
      if (!user) return
      const data = await getTags(user.householdId)
      setTags(data)
    }
    loadTags()
  }, [user])

  const openCreateDialog = () => {
    setEditingTag(null)
    setTagName('')
    setDialogOpen(true)
  }

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag)
    setTagName(tag.name)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!user || !tagName.trim()) return

    setLoading(true)
    try {
      if (editingTag) {
        // Update existing tag
        await updateTag(editingTag.id, { name: tagName.trim() })
        setTags(
          tags.map((t) =>
            t.id === editingTag.id ? { ...t, name: tagName.trim() } : t
          )
        )
        toast.success('Tag updated')
      } else {
        // Create new tag
        const id = await createTag({
          name: tagName.trim(),
          householdId: user.householdId,
          isCustom: true,
        })

        setTags([
          ...tags,
          {
            id,
            name: tagName.trim(),
            householdId: user.householdId,
            isCustom: true,
          },
        ])
        toast.success('Tag created')
      }

      setDialogOpen(false)
      setTagName('')
    } catch (error) {
      console.error('Error saving tag:', error)
      toast.error('Failed to save tag')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingTag) return

    setLoading(true)
    try {
      await deleteTag(editingTag.id)
      setTags(tags.filter((t) => t.id !== editingTag.id))
      setDeleteDialogOpen(false)
      setDialogOpen(false)
      toast.success('Tag deleted')
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
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
          <h1 className="text-lg font-semibold">Tags</h1>
        </div>
        <Button size="icon" onClick={openCreateDialog}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {[...tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="cursor-pointer px-3 py-1.5 text-sm hover:bg-secondary/80"
              onClick={() => openEditDialog(tag)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Add Tag'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagName.trim()) {
                    handleSubmit()
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              {editingTag && (
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
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={loading || !tagName.trim()}
              >
                {loading ? 'Saving...' : editingTag ? 'Save Changes' : 'Add Tag'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{editingTag?.name}". Expenses using this tag will no longer show it.
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
