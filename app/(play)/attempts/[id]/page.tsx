import { notFound } from 'next/navigation'
import ResultsView, { type ReviewRow } from '@/components/quiz/ResultsView'
import { createGradingClient } from '@/lib/server/grading'
import { publicFromRow } from '@/lib/server/question-catalog'
import { supabaseConfigured } from '@/lib/supabase/env'
import { requireUser } from '@/lib/server/auth'

export default async function AttemptResultsPage({ params }: { params: Promise<{ id: string }> }) {
  if (!supabaseConfigured()) notFound()
  const { id } = await params
  const { supabase: client, user } = await requireUser()
  const { data: attempt } = await client.from('attempts').select('id,user_id,assessment_id,mode,status,question_ids,score,best_streak,finished_at').eq('id', id).maybeSingle()
  if (!attempt || attempt.user_id !== user.id || attempt.status !== 'finished') notFound()
  const { data: assessment } = await client.from('assessments').select('slug,course_id').eq('id', attempt.assessment_id).maybeSingle()
  const { data: course } = assessment ? await client.from('courses').select('slug').eq('id', assessment.course_id).maybeSingle() : { data: null }
  if (!assessment || !course) notFound()
  const { data: entries, error: entryError } = await client.from('attempt_entries').select('question_id,answer,skipped,correct').eq('attempt_id', attempt.id)
  if (entryError || !entries) notFound()
  const grading = createGradingClient()
  const { data: questions } = await grading.from('questions').select('id,module,topic,prompt,qtype,payload,citations,exhibit_path').in('id', attempt.question_ids)
  const { data: keys } = await grading.from('question_keys').select('question_id,correct,explanation').in('question_id', attempt.question_ids)
  const questionMap = new Map((questions ?? []).map((q) => [q.id, q]))
  const keyMap = new Map((keys ?? []).map((k) => [k.question_id, k]))
  const entryMap = new Map(entries.map((e) => [e.question_id, e]))
  const rows: ReviewRow[] = attempt.question_ids.map((questionId: string) => {
    const raw = questionMap.get(questionId), keyRow = keyMap.get(questionId), entry = entryMap.get(questionId)
    if (!raw || !keyRow || !entry || !Array.isArray(keyRow.correct)) return null
    const question = publicFromRow(raw)
    const key = keyRow.correct as number[]
    const correctAnswer = question.type === 'matching' ? question.pairs.map((pair, i) => `${pair.term} → ${question.targets[key[i]]}`).join('; ') : key.map((index) => question.choices[index]).join('; ')
    return { question, answer: Array.isArray(entry.answer) ? entry.answer as number[] : [], skipped: entry.skipped, correct: entry.correct, correctAnswer, explanation: keyRow.explanation }
  }).filter((row: ReviewRow | null): row is ReviewRow => row !== null)
  if (rows.length !== attempt.question_ids.length) notFound()
  return <ResultsView attemptId={attempt.id} mode={attempt.mode} finishedAt={attempt.finished_at ?? ''} score={attempt.score ?? 0} bestStreak={attempt.best_streak ?? 0} rows={rows} setupHref={`/c/${course.slug}/${assessment.slug}`} />
}
