import { notFound } from 'next/navigation'
import { findCourse } from '@/lib/catalog/static'
import BankSetup from '@/components/quiz/BankSetup'
import { localBank } from '@/lib/server/question-catalog'
import { supabaseConfigured } from '@/lib/supabase/env'
import { requireUser } from '@/lib/server/auth'

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
  const { supabase: client } = await requireUser()
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
