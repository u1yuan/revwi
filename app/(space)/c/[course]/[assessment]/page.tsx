import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findCourse } from '@/lib/catalog/static'

export default async function BankSetupPage({
  params,
}: {
  params: Promise<{ course: string; assessment: string }>
}) {
  const { course: courseSlug, assessment: assessmentSlug } = await params
  const found = findCourse(courseSlug)
  if (!found) notFound()
  const assessment = found.course.assessments.find((a) => a.slug === assessmentSlug)
  if (!assessment || assessment.locked) notFound()

  return (
    <div className="chronicle-surface" style={{ minHeight: '100dvh', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ marginBottom: 8 }}>
          <Link href={`/c/${courseSlug}`} style={{ color: '#2457C5' }}>
            Back to planet
          </Link>
        </p>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{assessment.label}</h1>
        <p style={{ marginBottom: 24, maxWidth: '65ch' }}>
          {found.course.title}. Forward only. Choose Prep or Exam on the next screen.
        </p>
        <Link
          href={`/c/${courseSlug}/${assessmentSlug}/play`}
          style={{
            display: 'inline-block',
            background: '#2457C5',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Open reviewer
        </Link>
      </div>
    </div>
  )
}
