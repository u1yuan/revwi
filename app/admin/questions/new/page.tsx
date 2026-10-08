import { QuestionEditor } from '@/components/admin/QuestionEditor'
import { requireAdmin } from '@/lib/server/auth'

export default async function NewQuestionPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { supabase } = await requireAdmin()
  const [courseResult, assessmentResult] = await Promise.all([
    supabase.from('courses').select('id, code').order('code'),
    supabase.from('assessments').select('id, course_id, label, slug').order('ordinal'),
  ])
  const params = await searchParams
  return <QuestionEditor courses={courseResult.data ?? []} assessments={assessmentResult.data ?? []} memberships={[]} error={params.error ?? courseResult.error?.message ?? assessmentResult.error?.message} notice={params.notice} />
}
