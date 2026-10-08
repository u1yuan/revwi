import { questions, type Question } from '@/src/questions'

export type Mode = 'prep' | 'exam'
export type Response = number[]
export type Entry = { answer: Response; skipped: boolean; correct: boolean }
export type Session = {
  ids: string[]
  index: number
  mode: Mode
  modules: number[]
  draft: Response
  entries: Record<string, Entry>
  phase: 'asking' | 'feedback'
  retryOf?: string
}

export type QuestionRecency = { seenCount: number; lastSeenAt: string }
export type Attempt = {
  id: string
  completedAt: string
  mode: Mode
  modules: number[]
  questionIds: string[]
  entries: Record<string, Entry>
  score: number
  bestStreak: number
  retryOf?: string
}
export type Preferences = {
  master: number
  musicOn: boolean
  music: number
  sfxOn: boolean
  sfx: number
}
export type PersistedStateV3 = {
  version: 3
  activeSession: Session | null
  attempts: Attempt[]
  recency: Record<string, QuestionRecency>
  preferences: Preferences
}
export type PersistedStateV2 = PersistedStateV3

export const byId = new Map(questions.map((question) => [question.id, question]))
export const defaultPreferences: Preferences = { master: 0.85, musicOn: true, music: 0.4, sfxOn: true, sfx: 0.55 }

export const emptyDraft = (question: Question): Response =>
  question.type === 'matching' ? question.pairs.map(() => -1) : []

export function complete(question: Question, answer: Response): boolean {
  return question.type === 'matching'
    ? answer.length === question.pairs.length && answer.every((value) => value >= 0)
    : answer.length === (question.type === 'single' ? 1 : question.correct.length)
}

export function score(question: Question | { type: 'single' | 'multiple' | 'matching'; choices?: string[]; pairs?: { term: string }[]; requiredCount?: number }, answer: Response, privateKey?: number[]): boolean {
  const correct = privateKey ?? (question.type === 'matching'
    ? (question.pairs as { target: number }[]).map((pair) => pair.target)
    : (question as Question & { correct: number[] }).correct)
  if (!Array.isArray(correct)) return false
  const expectedLength = question.type === 'matching' ? question.pairs?.length : correct.length
  if (answer.length !== expectedLength || new Set(answer).size !== answer.length && question.type !== 'matching') return false
  if (question.type === 'matching') return correct.every((value, index) => answer[index] === value)
  return correct.every((value) => answer.includes(value))
}

export function answerText(question: Question, answer: Response): string {
  if (!complete(question, answer)) return 'Skipped'
  if (question.type === 'matching') {
    return question.pairs.map((pair, index) => `${pair.term} → ${question.targets[answer[index]]}`).join('; ')
  }
  return answer.map((index) => question.choices[index]).join('; ')
}

export function correctText(question: Question): string {
  if (question.type === 'matching') {
    return question.pairs.map((pair) => `${pair.term} → ${question.targets[pair.target]}`).join('; ')
  }
  return question.correct.map((index) => question.choices[index]).join('; ')
}

export function currentStreak(session: Session): number {
  let streak = 0
  for (const id of session.ids.slice(0, session.index + 1)) {
    const entry = session.entries[id]
    if (!entry) break
    streak = entry.correct ? streak + 1 : 0
  }
  return streak
}

export function bestStreakForEntries(ids: string[], entries: Record<string, Entry>): number {
  let best = 0
  let current = 0
  for (const id of ids) {
    current = entries[id]?.correct ? current + 1 : 0
    best = Math.max(best, current)
  }
  return best
}

export function bestStreak(session: Session): number {
  return bestStreakForEntries(session.ids, session.entries)
}

export function emptyState(): PersistedStateV3 {
  return { version: 3, activeSession: null, attempts: [], recency: {}, preferences: { ...defaultPreferences } }
}

export function markSeen(state: PersistedStateV3, questionId: string, at = new Date().toISOString()): PersistedStateV3 {
  const previous = state.recency[questionId]
  return {
    ...state,
    recency: {
      ...state.recency,
      [questionId]: { seenCount: (previous?.seenCount ?? 0) + 1, lastSeenAt: at },
    },
  }
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

export function buildQuestionOrder(
  candidateIds: string[],
  length: number,
  recency: Record<string, QuestionRecency>,
  random: () => number = Math.random,
): string[] {
  const distinct = [...new Set(candidateIds)]
  const unseen = shuffled(distinct.filter((id) => !recency[id]), random)
  const seen = distinct
    .filter((id) => recency[id])
    .map((id) => ({ id, lastSeenAt: recency[id].lastSeenAt, tie: random() }))
    .sort((a, b) => a.lastSeenAt.localeCompare(b.lastSeenAt) || a.tie - b.tie)
    .map(({ id }) => id)
  return [...unseen, ...seen].slice(0, Math.min(length, distinct.length))
}

export function createSession(ids: string[], mode: Mode, modules: number[], retryOf?: string): Session {
  const first = byId.get(ids[0])
  if (!first) throw new Error('Cannot start a session without a valid first question.')
  return {
    ids: [...ids],
    index: 0,
    mode,
    modules: [...modules],
    draft: emptyDraft(first),
    entries: {},
    phase: 'asking',
    ...(retryOf ? { retryOf } : {}),
  }
}

function makeAttemptId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function attemptFromSession(session: Session, completedAt = new Date().toISOString()): Attempt {
  return {
    id: makeAttemptId(),
    completedAt,
    mode: session.mode,
    modules: [...session.modules],
    questionIds: [...session.ids],
    entries: Object.fromEntries(
      Object.entries(session.entries).map(([id, entry]) => [id, { ...entry, answer: [...entry.answer] }]),
    ),
    score: session.ids.filter((id) => session.entries[id]?.correct).length,
    bestStreak: bestStreak(session),
    ...(session.retryOf ? { retryOf: session.retryOf } : {}),
  }
}
