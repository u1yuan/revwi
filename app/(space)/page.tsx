import { SpaceShell } from '@/components/space/SpaceShell'
import { staticCatalog } from '@/lib/catalog/static'

export default function MultiversePage() {
  const links = staticCatalog.map((year) => ({
    href: `/u/${year.ordinal}`,
    label: year.name,
    disabled: year.courses.length === 0,
  }))

  return (
    <SpaceShell scene="multiverse" mirrorTitle="Year levels" mirrorLinks={links}>
      <p style={{ color: 'var(--void-muted)', fontSize: 14, maxWidth: 420 }}>
        Choose a year level. 3rd Year holds DEVELOPMENT NETWORK today.
      </p>
    </SpaceShell>
  )
}
