import { notFound } from 'next/navigation'
import { SpaceShell } from '@/components/space/SpaceShell'
import { findCourse } from '@/lib/catalog/static'

export default async function PlanetPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params
  const found = findCourse(courseSlug)
  if (!found) notFound()
  const { year, course } = found

  const links = course.assessments.map((a) => ({
    href: a.locked ? '#' : `/c/${course.slug}/${a.slug}`,
    label: a.locked ? `${a.label} (empty bank)` : a.label,
    disabled: a.locked,
  }))

  return (
    <SpaceShell
      scene="planet"
      planetColor={course.planet.primary}
      mirrorTitle="Assessments"
      mirrorLinks={links}
    >
      <div style={{ pointerEvents: 'auto', color: 'var(--void-ink)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>{course.title}</h1>
        <p style={{ color: 'var(--void-muted)', marginTop: 4 }}>
          {course.code} · {year.name}
        </p>
      </div>
    </SpaceShell>
  )
}
