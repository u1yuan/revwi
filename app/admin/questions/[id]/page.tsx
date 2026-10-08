import { notFound } from 'next/navigation'
import { QuestionEditor } from '@/components/admin/QuestionEditor'
import { requireAdmin } from '@/lib/server/auth'

export default async function EditQuestionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { supabase } = await requireAdmin()
  const { id } = await params
  const [questionResult, keyResult, courseResult, assessmentResult, bankResult] = await Promise.all([
    supabase.from('questions').select('id, course_id, status, module, topic, qtype, prompt, payload, citations, exhibit_path').eq('id', id).maybeSingle(),
    supabase.from('question_keys').select('correct, explanation').eq('question_id', id).maybeSingle(),
    supabase.from('courses').select('id, code').order('code'),
    supabase.from('assessments').select('id, course_id, label, slug').order('ordinal'),
    supabase.from('bank_items').select('assessment_id, source_number').eq('question_id', id),
  ])
  if (!questionResult.data) notFound()
  const search = await searchParams
  return <QuestionEditor question={questionResult.data} keyData={keyResult.data} courses={courseResult.data ?? []} assessments={assessmentResult.data ?? []} memberships={bankResult.data ?? []} notice={search.notice} error={search.error ?? keyResult.error?.message ?? bankResult.error?.message} />
}
