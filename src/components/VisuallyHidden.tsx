import { type ReactNode } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
  /** Override the element tag. Defaults to 'span'. */
  as?: keyof JSX.IntrinsicElements
}

/**
 * VisuallyHidden — renders children visible only to screen readers.
 * Use for supplemental context that doesn't need to be visible on screen.
 *
 * @example
 * <button>
 *   <Icon />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({ children, as: Tag = 'span' }: VisuallyHiddenProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </Tag>
  )
}
