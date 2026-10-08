import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, LockSimple } from '@phosphor-icons/react/dist/ssr'
import { SpaceShell } from '@/components/space/SpaceShell'
import { getCourse } from '@/lib/catalog/server'

export default async function PlanetPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = await params
  const found = await getCourse(courseSlug)
  if (!found) notFound()
  const { year, course } = found
  const links = course.assessments.map((assessment) => ({
    href: `/c/${course.slug}/${assessment.slug}`,
    label: assessment.label,
    disabled: assessment.locked,
  }))

  return (
    <SpaceShell scene="assessments" context={year.name} mirrorTitle="Assessment banks" mirrorLinks={links}>
      <div className="grove-intro">
        <Link href={`/u/${year.ordinal}`} className="grove-back"><ArrowLeft size={16} aria-hidden /> {year.name} courses</Link>
        <p className="grove-eyebrow">{course.code} · {year.name}</p>
        <h1>{course.title}</h1>
        <p>Choose a study destination. Open banks glow along the path.</p>
      </div>
      <div className="grove-landmarks" aria-label="Assessment banks">
        {course.assessments.map((assessment) => {
          const content = <>
            <span className="grove-landmark-icon">{assessment.locked ? <LockSimple size={24} aria-hidden /> : <BookOpen size={24} aria-hidden />}</span>
            <strong>{assessment.label}</strong>
            <small>{assessment.locked ? 'Bank empty' : `${assessment.questionCount} questions`}</small>
          </>
          return assessment.locked ? (
            <div key={assessment.slug} className="grove-landmark is-locked" aria-disabled="true">{content}</div>
          ) : (
            <Link key={assessment.slug} href={`/c/${course.slug}/${assessment.slug}`} className={`grove-landmark is-open${assessment.slug === 'midterm' ? ' is-amber' : ''}`}>{content}</Link>
          )
        })}
      </div>
    </SpaceShell>
  )
}
