'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createGradingClient } from '@/lib/server/grading'
import { buildQuestionOrder, score } from '@/lib/domain/quiz-core'
import { answerComplete, answerSchema, validDraft } from '@/lib/domain/public-question'
import { publicFromRow, publicFromLocal } from '@/lib/server/question-catalog'
import { supabaseConfigured } from '@/lib/supabase/env'

const uuid = z.string().uuid()
const setupSchema = z.object({ assessmentId: uuid, mode: z.enum(['prep', 'exam']), modules: z.array(z.number().int().min(1).max(4)).min(1), length: z.union([z.literal('all'), z.literal(10), z.literal(25), z.literal(50)]), replace: z.boolean().default(false) })
const submitSchema = z.object({ attemptId: uuid, questionId: z.string().min(1), answer: answerSchema, skipped: z.boolean() })
const draftSchema = z.object({ attemptId: uuid, questionId: z.string().min(1), answer: answerSchema })
const idSchema = z.object({ attemptId: uuid })

type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string }
export type SubmitResult = { ok: true; kind: 'saved'; finished: boolean } | { ok: true; kind: 'prep-feedback'; correct: boolean; correctAnswer: string; explanation: string; citations: { label: string; href: string }[]; streak: number } | { ok: false; error: string }

async function signedIn() {
  if (!supabaseConfigured()) return null
  const client = await createClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return null
  const { data: profile } = await client.from('profiles').select('role').eq('user_id', user.id).maybeSingle()
  return profile ? { client, user } : null
}

async function publishedQuestions(client: Awaited<ReturnType<typeof createClient>>, assessmentId: string) {
  const { data: items, error: itemError } = await client.from('bank_items').select('question_id').eq('assessment_id', assessmentId)
  if (itemError) throw itemError
  const ids = items?.map((item) => item.question_id) ?? []
  if (!ids.length) return []
  const { data, error } = await client.from('questions').select('id,module,topic,prompt,qtype,payload,citations,exhibit_path,status').in('id', ids).eq('status', 'published')
  if (error) throw error
  return data ?? []
}

export async function startAttempt(raw: unknown): Promise<ActionResult<{ id: string; resumed: boolean }>> {
  const parsed = setupSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid session setup.' }
  const auth = await signedIn()
  if (!auth) return { ok: false, error: 'Sign in required.' }
  const { assessmentId, mode, modules, length, replace } = parsed.data
  const { data: existing, error: activeError } = await auth.client.from('attempts').select('id').eq('assessment_id', assessmentId).in('status', ['asking', 'feedback']).maybeSingle()
  if (activeError) return { ok: false, error: activeError.message }
  if (existing && !replace) return { ok: true, value: { id: existing.id, resumed: true } }
  try {
    const { data: assessment } = await auth.client.from('assessments').select('id').eq('id', assessmentId).maybeSingle()
    if (!assessment) return { ok: false, error: 'Assessment not found.' }
    const bank = (await publishedQuestions(auth.client, assessmentId)).filter((question) => modules.includes(question.module))
    if (!bank.length) return { ok: false, error: 'This bank has no published questions in those modules.' }
    if (length !== 'all' && length > bank.length) return { ok: false, error: `Only ${bank.length} questions are available.` }
    if (existing && replace) {
      const { error } = await createGradingClient().rpc('abandon_attempt', { p_user_id: auth.user.id, p_attempt_id: existing.id })
      if (error) return { ok: false, error: error.message }
    }
    const ids = bank.map((q) => q.id)
    const { data: recency } = await auth.client.from('question_recency').select('question_id,seen_count,last_seen_at').eq('user_id', auth.user.id).in('question_id', ids)
    const recencyMap = Object.fromEntries((recency ?? []).map((r) => [r.question_id, { seenCount: r.seen_count, lastSeenAt: r.last_seen_at }]))
    const ordered = buildQuestionOrder(ids, length === 'all' ? ids.length : length, recencyMap)
    const { data: attempt, error } = await createGradingClient().from('attempts').insert({ user_id: auth.user.id, assessment_id: assessmentId, mode, status: 'asking', question_ids: ordered, cursor: 0, draft: [] }).select('id').single()
    if (error || !attempt) return { ok: false, error: error?.message ?? 'Could not start attempt.' }
    return { ok: true, value: { id: attempt.id, resumed: false } }
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Could not start attempt.' } }
}

export async function saveDraft(raw: unknown): Promise<ActionResult<null>> {
  const parsed = draftSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid draft.' }
  const auth = await signedIn()
  if (!auth) return { ok: false, error: 'Sign in required.' }
  const { attemptId, questionId, answer } = parsed.data
  const { data: attempt } = await auth.client.from('attempts').select('user_id,status,cursor,question_ids').eq('id', attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== auth.user.id || attempt.status !== 'asking' || attempt.question_ids[attempt.cursor] !== questionId) return { ok: false, error: 'Question out of sync.' }
  const { data: questionRow } = await auth.client.from('questions').select('id,module,topic,prompt,qtype,payload,citations,exhibit_path').eq('id', questionId).eq('status', 'published').maybeSingle()
  if (!questionRow || !validDraft(publicFromRow(questionRow), answer)) return { ok: false, error: 'Invalid draft.' }
  const { error } = await createGradingClient().from('attempts').update({ draft: answer }).eq('id', attemptId).eq('user_id', auth.user.id).eq('status', 'asking').eq('cursor', attempt.cursor)
  return error ? { ok: false, error: error.message } : { ok: true, value: null }
}

export async function submitAnswer(raw: unknown): Promise<SubmitResult> {
  const parsed = submitSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid answer.' }
  const auth = await signedIn()
  if (!auth) return { ok: false, error: 'Sign in required.' }
  const { attemptId, questionId, answer, skipped } = parsed.data
  const { data: attempt } = await auth.client.from('attempts').select('id,user_id,mode,status,cursor,question_ids').eq('id', attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== auth.user.id) return { ok: false, error: 'Attempt not found.' }
  if (attempt.status !== 'asking' || attempt.question_ids[attempt.cursor] !== questionId) return { ok: false, error: 'Question out of sync.' }
  const { data: row } = await auth.client.from('questions').select('id,module,topic,prompt,qtype,payload,citations,exhibit_path').eq('id', questionId).eq('status', 'published').maybeSingle()
  if (!row) return { ok: false, error: 'Question is unavailable.' }
  const question = publicFromRow(row)
  if (!skipped && !answerComplete(question, answer)) return { ok: false, error: 'Complete the answer or confirm a skip.' }
  const grading = createGradingClient()
  const { data: keyRow } = await grading.from('question_keys').select('correct,explanation').eq('question_id', questionId).maybeSingle()
  const key = keyRow?.correct
  if (!keyRow || !Array.isArray(key) || !key.every((n) => Number.isInteger(n))) return { ok: false, error: 'Answer key missing.' }
  const correct = !skipped && score(question, answer, key as number[])
  const { data: previous, error: previousError } = await grading.from('attempt_entries').select('question_id,correct').eq('attempt_id', attemptId)
  if (previousError) return { ok: false, error: previousError.message }
  const prior = new Map((previous ?? []).map((e) => [e.question_id, e.correct]))
  if (prior.has(questionId)) return { ok: false, error: 'Answer already submitted.' }
  const answered = attempt.question_ids.slice(0, attempt.cursor).map((id: string) => prior.get(id) === true)
  const scoreCount = answered.filter(Boolean).length + Number(correct)
  let streak = 0, bestStreak = 0
  for (const hit of [...answered, correct]) { streak = hit ? streak + 1 : 0; bestStreak = Math.max(bestStreak, streak) }
  const last = attempt.cursor === attempt.question_ids.length - 1
  const nextStatus = attempt.mode === 'prep' ? 'feedback' : last ? 'finished' : 'asking'
  const { error } = await grading.rpc('commit_attempt_submission', { p_user_id: auth.user.id, p_attempt_id: attemptId, p_question_id: questionId, p_answer: skipped ? [] : answer, p_skipped: skipped, p_correct: correct, p_next_status: nextStatus, p_score: scoreCount, p_best_streak: bestStreak })
  if (error) return { ok: false, error: attempt.mode === 'exam' ? 'Could not save answer. Try again.' : error.message }
  if (attempt.mode === 'exam') return { ok: true, kind: 'saved', finished: last }
  const correctAnswer = question.type === 'matching'
    ? question.pairs.map((pair, i) => `${pair.term} → ${question.targets[(key as number[])[i]]}`).join('; ')
    : (key as number[]).map((index) => question.choices[index]).join('; ')
  return { ok: true, kind: 'prep-feedback', correct, correctAnswer, explanation: keyRow.explanation, citations: question.citations, streak }
}

export async function continueAttempt(raw: unknown): Promise<ActionResult<{ finished: boolean }>> {
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid attempt.' }
  const auth = await signedIn()
  if (!auth) return { ok: false, error: 'Sign in required.' }
  const { data: attempt } = await auth.client.from('attempts').select('id,user_id,status,cursor,question_ids').eq('id', parsed.data.attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== auth.user.id || attempt.status !== 'feedback') return { ok: false, error: 'Attempt is not awaiting feedback.' }
  const { error } = await createGradingClient().rpc('continue_attempt_feedback', { p_user_id: auth.user.id, p_attempt_id: attempt.id })
  return error ? { ok: false, error: error.message } : { ok: true, value: { finished: attempt.cursor === attempt.question_ids.length - 1 } }
}

export async function retryMissed(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid attempt.' }
  const auth = await signedIn()
  if (!auth) return { ok: false, error: 'Sign in required.' }
  const { data: previous } = await auth.client.from('attempts').select('id,user_id,assessment_id,status,question_ids').eq('id', parsed.data.attemptId).maybeSingle()
  if (!previous || previous.user_id !== auth.user.id || previous.status !== 'finished') return { ok: false, error: 'Finished attempt not found.' }
  const { data: entries } = await auth.client.from('attempt_entries').select('question_id,correct').eq('attempt_id', previous.id)
  const missed = previous.question_ids.filter((id: string) => entries?.find((e) => e.question_id === id)?.correct === false)
  if (!missed.length) return { ok: false, error: 'No missed questions to retry.' }
  const published = new Set((await publishedQuestions(auth.client, previous.assessment_id)).map((q) => q.id))
  const ids = missed.filter((id: string) => published.has(id))
  if (!ids.length) return { ok: false, error: 'Missed questions are no longer published.' }
  const { data: existing } = await auth.client.from('attempts').select('id').eq('assessment_id', previous.assessment_id).in('status', ['asking', 'feedback']).maybeSingle()
  if (existing) return { ok: false, error: 'Finish or replace your active attempt first.' }
  const { data: attempt, error } = await createGradingClient().from('attempts').insert({ user_id: auth.user.id, assessment_id: previous.assessment_id, mode: 'prep', status: 'asking', question_ids: ids, cursor: 0, draft: [], retry_of: previous.id }).select('id').single()
  return error || !attempt ? { ok: false, error: error?.message ?? 'Could not start retry.' } : { ok: true, value: { id: attempt.id } }
}

export async function gradeLocalPrep(raw: unknown): Promise<SubmitResult> {
  if (supabaseConfigured()) return { ok: false, error: 'Local Prep is unavailable.' }
  const parsed = z.object({ questionId: z.string(), answer: answerSchema, skipped: z.boolean() }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid answer.' }
  const { questions } = await import('@/src/questions')
  const question = questions.find((q) => q.id === parsed.data.questionId)
  if (!question) return { ok: false, error: 'Question not found.' }
  const publicQuestion = publicFromLocal(question)
  if (!parsed.data.skipped && !answerComplete(publicQuestion, parsed.data.answer)) return { ok: false, error: 'Complete the answer or confirm a skip.' }
  const correct = !parsed.data.skipped && score(question, parsed.data.answer)
  const key = question.type === 'matching' ? question.pairs.map((pair) => pair.target) : question.correct
  const correctAnswer = publicQuestion.type === 'matching'
    ? publicQuestion.pairs.map((pair, i) => `${pair.term} → ${publicQuestion.targets[key[i]]}`).join('; ')
    : key.map((index) => publicQuestion.choices[index]).join('; ')
  return { ok: true, kind: 'prep-feedback', correct, correctAnswer, explanation: question.explanation, citations: question.citations, streak: 0 }
}
