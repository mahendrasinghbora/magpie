import { createAvatar, type Style } from '@dicebear/core'
import {
  adventurer,
  adventurerNeutral,
  avataaars,
  avataaarsNeutral,
  bigEars,
  bigEarsNeutral,
  bigSmile,
  bottts,
  botttsNeutral,
  croodles,
  croodlesNeutral,
  funEmoji,
  icons,
  identicon,
  initials,
  lorelei,
  loreleiNeutral,
  micah,
  miniavs,
  notionists,
  notionistsNeutral,
  openPeeps,
  personas,
  pixelArt,
  pixelArtNeutral,
  rings,
  shapes,
  thumbs,
} from '@dicebear/collection'

// Available avatar styles
export const AVATAR_STYLES = {
  adventurer: { name: 'Adventurer', style: adventurer },
  adventurerNeutral: { name: 'Adventurer Neutral', style: adventurerNeutral },
  avataaars: { name: 'Avataaars', style: avataaars },
  avataaarsNeutral: { name: 'Avataaars Neutral', style: avataaarsNeutral },
  bigEars: { name: 'Big Ears', style: bigEars },
  bigEarsNeutral: { name: 'Big Ears Neutral', style: bigEarsNeutral },
  bigSmile: { name: 'Big Smile', style: bigSmile },
  bottts: { name: 'Bottts', style: bottts },
  botttsNeutral: { name: 'Bottts Neutral', style: botttsNeutral },
  croodles: { name: 'Croodles', style: croodles },
  croodlesNeutral: { name: 'Croodles Neutral', style: croodlesNeutral },
  funEmoji: { name: 'Fun Emoji', style: funEmoji },
  icons: { name: 'Icons', style: icons },
  identicon: { name: 'Identicon', style: identicon },
  initials: { name: 'Initials', style: initials },
  lorelei: { name: 'Lorelei', style: lorelei },
  loreleiNeutral: { name: 'Lorelei Neutral', style: loreleiNeutral },
  micah: { name: 'Micah', style: micah },
  miniavs: { name: 'Miniavs', style: miniavs },
  notionists: { name: 'Notionists', style: notionists },
  notionistsNeutral: { name: 'Notionists Neutral', style: notionistsNeutral },
  openPeeps: { name: 'Open Peeps', style: openPeeps },
  personas: { name: 'Personas', style: personas },
  pixelArt: { name: 'Pixel Art', style: pixelArt },
  pixelArtNeutral: { name: 'Pixel Art Neutral', style: pixelArtNeutral },
  rings: { name: 'Rings', style: rings },
  shapes: { name: 'Shapes', style: shapes },
  thumbs: { name: 'Thumbs', style: thumbs },
}

export type AvatarStyleKey = keyof typeof AVATAR_STYLES

// Generate avatar URL from seed and style
export function generateAvatar(seed: string, styleKey: AvatarStyleKey = 'thumbs'): string {
  const styleConfig = AVATAR_STYLES[styleKey]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avatar = createAvatar(styleConfig.style as Style<any>, {
    seed,
    size: 128,
  })
  return avatar.toDataUri()
}

// Get list of avatar style options
export function getAvatarStyleOptions(): { value: AvatarStyleKey; label: string }[] {
  return Object.entries(AVATAR_STYLES).map(([key, config]) => ({
    value: key as AvatarStyleKey,
    label: config.name,
  }))
}
