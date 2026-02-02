import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { generateAvatar, getAvatarStyleOptions, type AvatarStyleKey } from '@/lib/avatar'
import { cn } from '@/lib/utils'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleKey>(user?.avatarStyle || 'thumbs')
  const [saving, setSaving] = useState(false)

  const avatarStyles = getAvatarStyleOptions()
  const seed = user?.email || user?.id || 'default'

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter a display name')
      return
    }

    setSaving(true)
    try {
      const newPhotoURL = generateAvatar(seed, selectedStyle)
      await updateUser({
        displayName: displayName.trim(),
        avatarStyle: selectedStyle,
        photoURL: newPhotoURL,
      })
      toast.success('Profile updated successfully')
      navigate('/settings')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-lg font-semibold">Edit Profile</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {/* Current Avatar Preview */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={generateAvatar(seed, selectedStyle)} />
            </Avatar>
            <div className="text-center">
              <p className="font-medium">{displayName || 'Your Name'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Display Name */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Display Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Avatar Style Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avatar Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
              {avatarStyles.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedStyle(value)}
                  className={cn(
                    'relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors hover:bg-muted/50',
                    selectedStyle === value && 'border-primary bg-primary/5'
                  )}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={generateAvatar(seed, value)} />
                  </Avatar>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {label}
                  </span>
                  {selectedStyle === value && (
                    <div className="absolute -right-1 -top-1 rounded-full bg-primary p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
