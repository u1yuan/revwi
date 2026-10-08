import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen } from '@phosphor-icons/react/dist/ssr'
import { SpaceShell } from '@/components/space/SpaceShell'
import { getYear } from '@/lib/catalog/server'

export default async function UniversePage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearParam } = await params
  const year = await getYear(Number(yearParam))
  if (!year) notFound()

  const links = year.courses.map((course) => ({ href: `/c/${course.slug}`, label: `${course.code} ${course.title}` }))
  return (
    <SpaceShell scene="courses" context={year.name} mirrorTitle={`${year.name} courses`} mirrorLinks={links}>
      <div className="grove-intro">
        <Link href="/" className="grove-back"><ArrowLeft size={16} aria-hidden /> All years</Link>
        <p className="grove-eyebrow">{year.name}</p>
        <h1>{year.courses.length ? 'A course is waiting.' : 'A quiet part of the grove.'}</h1>
        <p>{year.courses.length ? 'Step into a course to find its assessment banks.' : 'No courses in this year yet.'}</p>
      </div>
      <div className="grove-course-links" aria-label={`${year.name} courses`}>
        {year.courses.map((course) => (
          <Link href={`/c/${course.slug}`} key={course.slug} className="grove-course-card">
            <span className="grove-course-icon"><BookOpen size={24} aria-hidden /></span>
            <span className="grove-course-copy"><small>{course.code}</small><strong>{course.title}</strong><span>{course.alias}</span></span>
            <ArrowRight size={24} aria-hidden />
          </Link>
        ))}
        {!year.courses.length ? <div className="grove-empty-card">The path will open when a course is added.</div> : null}
      </div>
    </SpaceShell>
  )
}
