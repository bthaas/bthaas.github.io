import { Portfolio } from '@/components/portfolio/Portfolio'
import { SiteGate } from '@/components/portfolio/SiteGate'

export default function HomePage() {
  return (
    <SiteGate>
      <Portfolio />
    </SiteGate>
  )
}
