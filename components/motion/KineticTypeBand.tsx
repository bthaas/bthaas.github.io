import { ScrollVelocity } from '@/components/bits/ScrollVelocity'

interface KineticTypeBandProps {
  readonly direction?: 1 | -1
  readonly text: string
}

export function KineticTypeBand({ direction = 1, text }: KineticTypeBandProps) {
  return (
    <aside className="kinetic-type-band" aria-hidden="true">
      <ScrollVelocity direction={direction} text={`${text} — ${text} —`} />
    </aside>
  )
}
