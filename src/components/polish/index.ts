// Barrel export for polish components.
// Import from '@/components/polish' rather than individual files.

export { EmptyState, default as EmptyStateDefault } from './EmptyState'
export type { EmptyStateProps, EmptyStateAction } from './EmptyState'

export { LoadingShimmer, default as LoadingShimmerDefault } from './LoadingShimmer'
export type { LoadingShimmerProps, ShimmerVariant } from './LoadingShimmer'

export { ConfettiBurst, default as ConfettiBurstDefault } from './ConfettiBurst'
export type { ConfettiBurstProps } from './ConfettiBurst'

export {
  ToastProvider,
  ToastItem,
  useToast,
} from './Toast'
export type {
  Toast,
  ToastOptions,
  ToastSeverity,
  ToastPosition,
  ToastAction,
  ToastContextValue,
  ToastProviderProps,
} from './Toast'

export { ToastCenter, default as ToastCenterDefault } from './ToastCenter'
export type { ToastCenterProps } from './ToastCenter'

export { KeyboardShortcutsModal, default as KeyboardShortcutsModalDefault } from './KeyboardShortcutsModal'
export type {
  KeyboardShortcutsModalProps,
  ShortcutEntry,
  ShortcutGroup,
} from './KeyboardShortcutsModal'

export { OnboardingTour, default as OnboardingTourDefault } from './OnboardingTour'
export type { OnboardingTourProps, OnboardingStep } from './OnboardingTour'

export { Tooltip, default as TooltipDefault } from './Tooltip'
export type { TooltipProps, TooltipPlacement } from './Tooltip'

export { Avatar, default as AvatarDefault } from './Avatar'
export type { AvatarProps } from './Avatar'

export { Badge, default as BadgeDefault } from './Badge'
export type { BadgeProps, BadgeRarity } from './Badge'
