import { createAvatar, type Style } from '@dicebear/core'
import { thumbs } from '@dicebear/collection'

// Avatar style keys - used for type safety
export type AvatarStyleKey =
  | 'adventurer' | 'adventurerNeutral'
  | 'avataaars' | 'avataaarsNeutral'
  | 'bigEars' | 'bigEarsNeutral'
  | 'bigSmile'
  | 'bottts' | 'botttsNeutral'
  | 'croodles' | 'croodlesNeutral'
  | 'funEmoji'
  | 'icons'
  | 'identicon'
  | 'initials'
  | 'lorelei' | 'loreleiNeutral'
  | 'micah'
  | 'miniavs'
  | 'notionists' | 'notionistsNeutral'
  | 'openPeeps'
  | 'personas'
  | 'pixelArt' | 'pixelArtNeutral'
  | 'rings'
  | 'shapes'
  | 'thumbs'

// Default style (thumbs) - loaded eagerly for auth
const defaultStyle = thumbs

// Generate avatar with default style (thumbs) - used by auth
export function generateAvatar(seed: string, _styleKey: AvatarStyleKey = 'thumbs'): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avatar = createAvatar(defaultStyle as Style<any>, {
    seed,
    size: 128,
  })
  return avatar.toDataUri()
}

// Lazy load all avatar styles - only used in ProfilePage
export async function loadAllAvatarStyles() {
  const {
    adventurer, adventurerNeutral,
    avataaars, avataaarsNeutral,
    bigEars, bigEarsNeutral,
    bigSmile,
    bottts, botttsNeutral,
    croodles, croodlesNeutral,
    funEmoji,
    icons,
    identicon,
    initials,
    lorelei, loreleiNeutral,
    micah,
    miniavs,
    notionists, notionistsNeutral,
    openPeeps,
    personas,
    pixelArt, pixelArtNeutral,
    rings,
    shapes,
    thumbs,
  } = await import('@dicebear/collection')

  return {
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
}

// Generate avatar with any style - requires loaded styles
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateAvatarWithStyle(seed: string, style: any): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avatar = createAvatar(style as Style<any>, {
    seed,
    size: 128,
  })
  return avatar.toDataUri()
}

// Get list of avatar style options (for select dropdown)
export function getAvatarStyleOptions(): { value: AvatarStyleKey; label: string }[] {
  const styles: { value: AvatarStyleKey; label: string }[] = [
    { value: 'adventurer', label: 'Adventurer' },
    { value: 'adventurerNeutral', label: 'Adventurer Neutral' },
    { value: 'avataaars', label: 'Avataaars' },
    { value: 'avataaarsNeutral', label: 'Avataaars Neutral' },
    { value: 'bigEars', label: 'Big Ears' },
    { value: 'bigEarsNeutral', label: 'Big Ears Neutral' },
    { value: 'bigSmile', label: 'Big Smile' },
    { value: 'bottts', label: 'Bottts' },
    { value: 'botttsNeutral', label: 'Bottts Neutral' },
    { value: 'croodles', label: 'Croodles' },
    { value: 'croodlesNeutral', label: 'Croodles Neutral' },
    { value: 'funEmoji', label: 'Fun Emoji' },
    { value: 'icons', label: 'Icons' },
    { value: 'identicon', label: 'Identicon' },
    { value: 'initials', label: 'Initials' },
    { value: 'lorelei', label: 'Lorelei' },
    { value: 'loreleiNeutral', label: 'Lorelei Neutral' },
    { value: 'micah', label: 'Micah' },
    { value: 'miniavs', label: 'Miniavs' },
    { value: 'notionists', label: 'Notionists' },
    { value: 'notionistsNeutral', label: 'Notionists Neutral' },
    { value: 'openPeeps', label: 'Open Peeps' },
    { value: 'personas', label: 'Personas' },
    { value: 'pixelArt', label: 'Pixel Art' },
    { value: 'pixelArtNeutral', label: 'Pixel Art Neutral' },
    { value: 'rings', label: 'Rings' },
    { value: 'shapes', label: 'Shapes' },
    { value: 'thumbs', label: 'Thumbs' },
  ]
  return styles
}
