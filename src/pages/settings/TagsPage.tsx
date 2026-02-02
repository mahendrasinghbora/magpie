import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getTags, createTag, deleteTag } from '@/lib/firestore'

export function TagsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tags, setTags } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadTags() {
      if (!user) return
      const data = await getTags(user.householdId)
      setTags(data)
    }
    loadTags()
  }, [user])

  const handleCreate = async () => {
    if (!user || !newTagName.trim()) return

    setLoading(true)
    try {
      const id = await createTag({
        name: newTagName.trim(),
        householdId: user.householdId,
        isCustom: true,
      })

      setTags([
        ...tags,
        {
          id,
          name: newTagName.trim(),
          householdId: user.householdId,
          isCustom: true,
        },
      ])

      setDialogOpen(false)
      setNewTagName('')
    } catch (error) {
      console.error('Error creating tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id)
      setTags(tags.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Error deleting tag:', error)
    }
  }

  // Group tags by custom vs default
  const defaultTags = tags.filter((t) => !t.isCustom)
  const customTags = tags.filter((t) => t.isCustom)

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={loading || !newTagName.trim()}
              >
                {loading ? 'Adding...' : 'Add Tag'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4 p-4">
        {/* Custom Tags */}
        {customTags.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Custom Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {customTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Default Tags */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Default Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {defaultTags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
