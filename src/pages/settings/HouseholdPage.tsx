import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, UserPlus, LogOut, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  createHousehold,
  getHousehold,
  inviteToHousehold,
  getPendingInvites,
  acceptInvite,
  rejectInvite,
  leaveHousehold,
  getHouseholdMembers,
} from '@/lib/firestore'
import type { HouseholdInvite } from '@/types'

export function HouseholdPage() {
  const navigate = useNavigate()
  const { user, setUserHouseholdId } = useAuth()
  const { household, setHousehold, householdMembers, setHouseholdMembers } = useStore()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [pendingInvites, setPendingInvites] = useState<HouseholdInvite[]>([])
  const [loading, setLoading] = useState(false)

  // Load household data
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        // Load pending invites
        const invites = await getPendingInvites(user.email)
        setPendingInvites(invites)

        // Load household if user has one
        if (user.householdId) {
          const householdData = await getHousehold(user.householdId)
          setHousehold(householdData)

          const members = await getHouseholdMembers(user.householdId)
          setHouseholdMembers(members)
        }
      } catch (error) {
        console.error('Error loading household data:', error)
      }
    }

    loadData()
  }, [user])

  const handleCreateHousehold = async () => {
    if (!user || !householdName.trim()) return

    setLoading(true)
    try {
      const id = await createHousehold(householdName.trim(), user.id)
      setUserHouseholdId(id)
      setHousehold({
        id,
        name: householdName.trim(),
        createdBy: user.id,
        members: [user.id],
        createdAt: new Date(),
      })
      setHouseholdMembers([
        {
          id: user.id,
          displayName: user.displayName,
          photoURL: user.photoURL || '',
        },
      ])
      setCreateDialogOpen(false)
      setHouseholdName('')
    } catch (error) {
      console.error('Error creating household:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!user || !household || !inviteEmail.trim()) return

    setLoading(true)
    try {
      await inviteToHousehold(
        household.id,
        household.name,
        user.id,
        user.displayName,
        inviteEmail.trim()
      )
      setInviteDialogOpen(false)
      setInviteEmail('')
    } catch (error) {
      console.error('Error sending invite:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async (invite: HouseholdInvite) => {
    if (!user) return

    setLoading(true)
    try {
      await acceptInvite(invite.id, user.id)
      setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id))

      // Update local user state with new householdId
      setUserHouseholdId(invite.householdId)

      // Reload household data
      const householdData = await getHousehold(invite.householdId)
      setHousehold(householdData)

      const members = await getHouseholdMembers(invite.householdId)
      setHouseholdMembers(members)
    } catch (error) {
      console.error('Error accepting invite:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectInvite = async (inviteId: string) => {
    setLoading(true)
    try {
      await rejectInvite(inviteId)
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId))
    } catch (error) {
      console.error('Error rejecting invite:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveHousehold = async () => {
    if (!user || !household) return

    setLoading(true)
    try {
      await leaveHousehold(user.id, household.id)
      setUserHouseholdId(null)
      setHousehold(null)
      setHouseholdMembers([])
      setLeaveDialogOpen(false)
    } catch (error) {
      console.error('Error leaving household:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Household</h1>
      </div>

      <div className="space-y-4 p-4">
        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Invites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{invite.householdName}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invite.invitedByName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleAcceptInvite(invite)}
                      disabled={loading}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRejectInvite(invite.id)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Current Household */}
        {household ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{household.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Members</p>
                  <div className="space-y-2">
                    {householdMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <Avatar>
                          <AvatarImage src={member.photoURL} />
                          <AvatarFallback>
                            {member.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.displayName}</p>
                          {member.id === household.createdBy && (
                            <p className="text-xs text-muted-foreground">
                              Creator
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Button */}
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <UserPlus className="h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite to Household</DialogTitle>
                      <DialogDescription>
                        Enter the email of the person you want to invite.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="partner@email.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleInvite}
                        disabled={loading || !inviteEmail.trim()}
                      >
                        {loading ? 'Sending...' : 'Send Invite'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Leave Button */}
                <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      Leave Household
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Leave Household</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to leave this household? Your
                        expenses will remain but won't be visible to other
                        members.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setLeaveDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleLeaveHousehold}
                        disabled={loading}
                      >
                        {loading ? 'Leaving...' : 'Leave Household'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* No Household */}
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  You're not part of a household
                </p>
                <p className="text-sm text-muted-foreground">
                  Create one or wait for an invite
                </p>
              </CardContent>
            </Card>

            {/* Create Household */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Create Household
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Household</DialogTitle>
                  <DialogDescription>
                    Give your household a name. You can invite others after
                    creating it.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Household Name</Label>
                  <Input
                    placeholder="e.g., Our Home"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateHousehold}
                    disabled={loading || !householdName.trim()}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
