import { notFound } from 'next/navigation'
import { SpaceShell } from '@/components/space/SpaceShell'
import { findYear } from '@/lib/catalog/static'

export default async function UniversePage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearParam } = await params
  const ordinal = Number(yearParam)
  const year = findYear(ordinal)
  if (!year) notFound()

  const links =
    year.courses.length > 0
      ? year.courses.map((course) => ({
          href: `/c/${course.slug}`,
          label: `${course.code} ${course.title}`,
        }))
      : [{ href: '/', label: 'No courses in this year yet', disabled: true }]

  return (
    <SpaceShell
      scene="universe"
      planetColor={year.courses[0]?.planet.primary ?? '#08756B'}
      mirrorTitle={`${year.name} courses`}
      mirrorLinks={links}
    />
  )
}
