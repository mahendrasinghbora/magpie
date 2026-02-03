import {
  UtensilsCrossed,
  PackageOpen,
  ShoppingBasket,
  Zap,
  Bike,
  CarTaxiFront,
  Car,
  TrainFront,
  Fuel,
  ShoppingBag,
  Receipt,
  HandHelping,
  Film,
  Dumbbell,
  Heart,
  GraduationCap,
  Plane,
  Home,
  Landmark,
  RefreshCw,
  Scissors,
  Gift,
  Users,
  CreditCard,
  MoreHorizontal,
  Wallet,
  PiggyBank,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryIcon } from '@/types'

// Map icon names to Lucide components
export const iconMap: Record<CategoryIcon, LucideIcon> = {
  UtensilsCrossed,
  PackageOpen,
  ShoppingBasket,
  Zap,
  Bike,
  CarTaxiFront,
  Car,
  TrainFront,
  Fuel,
  ShoppingBag,
  Receipt,
  HandHelping,
  Film,
  Dumbbell,
  Heart,
  GraduationCap,
  Plane,
  Home,
  Landmark,
  RefreshCw,
  Scissors,
  Gift,
  Users,
  CreditCard,
  MoreHorizontal,
  Wallet,
  PiggyBank,
}

// Get icon component by name
export function getIconComponent(iconName: CategoryIcon): LucideIcon {
  return iconMap[iconName] || MoreHorizontal
}

// All available icons for category creation
export const availableIcons: CategoryIcon[] = Object.keys(iconMap) as CategoryIcon[]
