import { notFound, redirect } from 'next/navigation'
import { findCourse } from '@/lib/catalog/static'
import BankSetup from '@/components/quiz/BankSetup'
import { localBank } from '@/lib/server/question-catalog'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/supabase/env'

export default async function BankSetupPage({
  params,
}: {
  params: Promise<{ course: string; assessment: string }>
}) {
  const { course: courseSlug, assessment: assessmentSlug } = await params
  if (!supabaseConfigured()) {
    const found = findCourse(courseSlug)
    const assessment = found?.course.assessments.find((a) => a.slug === assessmentSlug)
    if (!assessment || assessment.locked) notFound()
    return <BankSetup course={courseSlug} assessment={assessmentSlug} label={assessment.label} bank={localBank(assessmentSlug).map(({ id, module }) => ({ id, module }))} />
  }
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/c/${courseSlug}/${assessmentSlug}`)}`)
  const { data: course } = await client.from('courses').select('id').eq('slug', courseSlug).maybeSingle()
  if (!course) notFound()
  const { data: assessment } = await client.from('assessments').select('id,label').eq('course_id', course.id).eq('slug', assessmentSlug).maybeSingle()
  if (!assessment) notFound()
  const { data: items } = await client.from('bank_items').select('question_id').eq('assessment_id', assessment.id)
  const ids = items?.map((i) => i.question_id) ?? []
  const { data: questions } = ids.length ? await client.from('questions').select('id,module').in('id', ids).eq('status', 'published') : { data: [] }
  if (!questions?.length) notFound()
  const { data: active } = await client.from('attempts').select('id').eq('assessment_id', assessment.id).in('status', ['asking', 'feedback']).maybeSingle()
  return <BankSetup course={courseSlug} assessment={assessmentSlug} label={assessment.label} assessmentId={assessment.id} bank={questions} activeId={active?.id} />
}
