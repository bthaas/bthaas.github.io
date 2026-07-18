import { TiltedCard } from '@/components/bits/TiltedCard'

export function FlightTiltSurface({ children }: React.PropsWithChildren) {
  return (
    <TiltedCard className="flight-entry__tilt" maximumDegrees={6}>
      {children}
    </TiltedCard>
  )
}
