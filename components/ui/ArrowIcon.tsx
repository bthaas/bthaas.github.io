import type { SVGProps } from 'react'

type ArrowDirection = 'left' | 'right' | 'up-right'

interface ArrowIconProps extends Omit<SVGProps<SVGSVGElement>, 'aria-hidden' | 'children'> {
  readonly direction: ArrowDirection
}

const arrowPaths: Record<ArrowDirection, string> = {
  left: 'M19 12H5m6-6-6 6 6 6',
  right: 'M5 12h14m-6-6 6 6-6 6',
  'up-right': 'M5 19 19 5M9 5h10v10',
}

export function ArrowIcon({ direction, ...props }: ArrowIconProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      data-arrow-direction={direction}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        d={arrowPaths[direction]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
