import { createAvatar } from '@dicebear/core'
import { thumbs } from '@dicebear/collection'

// Generate avatar URL from seed (email or user ID)
export function generateAvatar(seed: string): string {
  const avatar = createAvatar(thumbs, {
    seed,
    size: 128,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  })
  return avatar.toDataUri()
}
