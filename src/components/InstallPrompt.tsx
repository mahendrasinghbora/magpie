import { useState, useEffect } from 'react'
import { Download, X, Share, PlusSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Detect iOS device
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
}

// Check if running as standalone PWA
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already running as installed PWA
    if (isStandalone()) return

    // Check if already dismissed
    const wasDismissed = localStorage.getItem('install-prompt-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    // Handle iOS
    if (isIOS()) {
      setShowIOSPrompt(true)
      return
    }

    // Handle Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('install-prompt-dismissed', 'true')
  }

  // iOS Install Instructions
  if (showIOSPrompt && !dismissed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="rounded-lg border bg-card p-4 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Install Magpie</p>
                <p className="text-xs text-muted-foreground">
                  Add to your home screen
                </p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">1</span>
              <span>Tap the</span>
              <Share className="h-4 w-4" />
              <span>Share button</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">2</span>
              <span>Scroll and tap</span>
              <PlusSquare className="h-4 w-4" />
              <span className="font-medium text-foreground">Add to Home Screen</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome Install Prompt
  if (!installPrompt || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Install Magpie</p>
          <p className="text-xs text-muted-foreground truncate">
            Add to home screen for quick access
          </p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          Install
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
