import { notFound, redirect } from 'next/navigation'
import PlaySession, { type RemoteState } from '@/components/quiz/PlaySession'
import { localBank, publicFromRow } from '@/lib/server/question-catalog'
import { findCourse } from '@/lib/catalog/static'
import { createClient } from '@/lib/supabase/server'
import { createGradingClient } from '@/lib/server/grading'
import { supabaseConfigured } from '@/lib/supabase/env'

export default async function PlayPage({ params, searchParams }: { params: Promise<{ course: string; assessment: string }>; searchParams: Promise<{ attempt?: string }> }) {
  const { course: courseSlug, assessment: assessmentSlug } = await params
  const { attempt: attemptId } = await searchParams
  if (!supabaseConfigured()) {
    const found = findCourse(courseSlug)
    const assessment = found?.course.assessments.find((a) => a.slug === assessmentSlug)
    if (!assessment || assessment.locked) notFound()
    return <PlaySession course={courseSlug} assessment={assessmentSlug} localBank={localBank(assessmentSlug)} />
  }
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/c/${courseSlug}/${assessmentSlug}`)}`)
  if (!attemptId) redirect(`/c/${courseSlug}/${assessmentSlug}`)
  const { data: attempt } = await client.from('attempts').select('id,user_id,assessment_id,mode,status,question_ids,cursor,draft,score').eq('id', attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== user.id) notFound()
  const { data: assessment } = await client.from('assessments').select('id,slug,course_id').eq('id', attempt.assessment_id).maybeSingle()
  const { data: course } = assessment ? await client.from('courses').select('id,slug').eq('id', assessment.course_id).maybeSingle() : { data: null }
  if (!assessment || assessment.slug !== assessmentSlug || course?.slug !== courseSlug) notFound()
  if (attempt.status === 'finished') redirect(`/attempts/${attempt.id}`)
  if (attempt.status === 'abandoned') redirect(`/c/${courseSlug}/${assessmentSlug}`)
  const questionId = attempt.question_ids[attempt.cursor]
  if (!questionId) notFound()
  const { data: row } = await client.from('questions').select('id,module,topic,prompt,qtype,payload,citations,exhibit_path').eq('id', questionId).eq('status', 'published').maybeSingle()
  if (!row) notFound()
  const question = publicFromRow(row)
  let feedback: RemoteState['feedback'] = null
  let streak = 0
  if (attempt.mode === 'prep') {
    const { data: entries } = await client.from('attempt_entries').select('question_id,answer,skipped,correct').eq('attempt_id', attempt.id)
    const map = new Map((entries ?? []).map((entry) => [entry.question_id, entry]))
    for (const id of attempt.question_ids.slice(0, attempt.cursor + (attempt.status === 'feedback' ? 1 : 0))) streak = map.get(id)?.correct ? streak + 1 : 0
    if (attempt.status === 'feedback') {
      const entry = map.get(questionId)
      const { data: keyRow } = await createGradingClient().from('question_keys').select('correct,explanation').eq('question_id', questionId).maybeSingle()
      if (entry && keyRow && Array.isArray(keyRow.correct)) {
        const key = keyRow.correct as number[]
        const correctAnswer = question.type === 'matching' ? question.pairs.map((pair, i) => `${pair.term} → ${question.targets[key[i]]}`).join('; ') : key.map((index) => question.choices[index]).join('; ')
        feedback = { correct: entry.correct, correctAnswer, explanation: keyRow.explanation, citations: question.citations, streak }
      }
    }
  }
  const state: RemoteState = { id: attempt.id, mode: attempt.mode, status: attempt.status as 'asking' | 'feedback', cursor: attempt.cursor, total: attempt.question_ids.length, draft: Array.isArray(attempt.draft) ? attempt.draft as number[] : [], question, feedback, streak }
  return <PlaySession course={courseSlug} assessment={assessmentSlug} remote={state} />
}
