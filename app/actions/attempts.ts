'use server'

import { createClient } from '@/lib/supabase/server'
import { createGradingClient } from '@/lib/server/grading'
import { byId, score, type Mode, type Response } from '@/lib/domain/quiz-core'
import { supabaseConfigured } from '@/lib/supabase/env'

export type SubmitResult =
  | { ok: true; kind: 'saved' }
  | {
      ok: true
      kind: 'prep-feedback'
      correct: boolean
      correctAnswer: string
      explanation: string
      citations: { label: string; href: string }[]
    }
  | { ok: false; error: string }

function correctTextFromPayload(questionId: string, correct: unknown): string {
  const question = byId.get(questionId)
  if (!question || !Array.isArray(correct)) return ''
  if (question.type === 'matching') {
    return question.pairs
      .map((pair, index) => `${pair.term} → ${question.targets[(correct as number[])[index] ?? pair.target]}`)
      .join('; ')
  }
  return (correct as number[]).map((index) => question.choices[index]).join('; ')
}

export async function submitAnswer(input: {
  attemptId: string
  questionId: string
  answer: Response
  skipped: boolean
}): Promise<SubmitResult> {
  if (!supabaseConfigured()) return { ok: false, error: 'Supabase is not configured.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in required.' }

  const { data: attempt } = await supabase
    .from('attempts')
    .select('id, user_id, mode, status, cursor, question_ids')
    .eq('id', input.attemptId)
    .maybeSingle()

  if (!attempt || attempt.user_id !== user.id) return { ok: false, error: 'Attempt not found.' }
  if (attempt.status === 'finished') return { ok: false, error: 'Attempt already finished.' }

  const questionIds = attempt.question_ids as string[]
  const currentId = questionIds[attempt.cursor]
  if (currentId !== input.questionId) return { ok: false, error: 'Question out of sync.' }

  const question = byId.get(input.questionId)
  if (!question) return { ok: false, error: 'Unknown question.' }

  const grading = createGradingClient()
  const { data: keyRow } = await grading.from('question_keys').select('correct, explanation').eq('question_id', input.questionId).maybeSingle()
  if (!keyRow) return { ok: false, error: 'Answer key missing.' }

  const isCorrect = !input.skipped && score(question, input.answer)
  await grading.from('attempt_entries').upsert({
    attempt_id: input.attemptId,
    question_id: input.questionId,
    answer: input.answer,
    skipped: input.skipped,
    correct: isCorrect,
  })

  const mode = attempt.mode as Mode
  const nextCursor = attempt.cursor + 1
  const nextStatus = mode === 'prep' && !input.skipped ? 'feedback' : 'asking'
  await grading.from('attempts').update({ cursor: nextCursor, status: nextStatus, draft: [] }).eq('id', input.attemptId)

  if (mode === 'exam') return { ok: true, kind: 'saved' }

  return {
    ok: true,
    kind: 'prep-feedback',
    correct: isCorrect,
    correctAnswer: correctTextFromPayload(input.questionId, keyRow.correct),
    explanation: keyRow.explanation,
    citations: question.citations,
  }
}

export async function finishAttempt(attemptId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured()) return { ok: false, error: 'Supabase is not configured.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in required.' }

  const grading = createGradingClient()
  const { data: attempt } = await grading.from('attempts').select('*').eq('id', attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== user.id) return { ok: false, error: 'Attempt not found.' }

  const { data: entries } = await grading.from('attempt_entries').select('correct').eq('attempt_id', attemptId)
  const scoreCount = entries?.filter((e) => e.correct).length ?? 0

  await grading
    .from('attempts')
    .update({ status: 'finished', finished_at: new Date().toISOString(), score: scoreCount })
    .eq('id', attemptId)

  return { ok: true }
}
