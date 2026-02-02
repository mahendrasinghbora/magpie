import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  LogOut,
  CreditCard,
  Tags,
  FolderOpen,
  Users,
  Download,
  ChevronRight,
  Wallet,
  User,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { household, expenses, categories } = useStore()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleExportCSV = () => {
    if (expenses.length === 0) return

    const headers = ['Date', 'Category', 'Amount', 'Payee', 'Notes', 'Tags', 'Type']
    const rows = expenses.map((expense) => {
      const category = categories.find((c) => c.id === expense.categoryId)
      return [
        expense.date.toISOString().split('T')[0],
        category?.name || '',
        expense.amount.toString(),
        expense.payee,
        expense.notes,
        expense.tags.join(', '),
        expense.type,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `magpie-expenses-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const settingsItems = [
    {
      icon: User,
      label: 'Edit Profile',
      description: 'Change your name and avatar',
      onClick: () => navigate('/settings/profile'),
    },
    {
      icon: Wallet,
      label: 'Monthly Income',
      description: 'Set your monthly income',
      onClick: () => navigate('/settings/income'),
    },
    {
      icon: CreditCard,
      label: 'Payment Methods',
      description: 'Manage your payment methods',
      onClick: () => navigate('/settings/payment-methods'),
    },
    {
      icon: FolderOpen,
      label: 'Categories',
      description: 'Manage expense categories',
      onClick: () => navigate('/settings/categories'),
    },
    {
      icon: Tags,
      label: 'Tags',
      description: 'Manage expense tags',
      onClick: () => navigate('/settings/tags'),
    },
    {
      icon: Users,
      label: 'Household',
      description: household ? 'Manage your household' : 'Create or join a household',
      onClick: () => navigate('/settings/household'),
    },
    {
      icon: Download,
      label: 'Export Data',
      description: 'Download your expenses as CSV',
      onClick: handleExportCSV,
    },
  ]

  return (
    <div className="space-y-4 p-4">
      {/* User Profile */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="text-lg">
              {user?.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{user?.displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {household && (
              <p className="text-xs text-muted-foreground">
                Household: {household.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {settingsItems.map((item, index) => (
            <div key={item.label}>
              {index > 0 && <Separator />}
              <button
                onClick={item.onClick}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : theme === 'light' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? Your data will be synced when you sign back in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground">
        Magpie v0.1.0
      </p>
    </div>
  )
}
