import { questions, type Question } from './questions'

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
export const STORAGE_KEY_V2 = 'devnet-reviewer:state-v2'
export const LEGACY_STORAGE_KEY = 'devnet-reviewer:mvp-session-v1'
export const defaultPreferences: Preferences = { master: 0.85, musicOn: true, music: 0.4, sfxOn: true, sfx: 0.55 }

export const emptyDraft = (question: Question): Response => question.type === 'matching' ? question.pairs.map(() => -1) : []

export function complete(question: Question, answer: Response): boolean {
  return question.type === 'matching'
    ? answer.length === question.pairs.length && answer.every((value) => value >= 0)
    : answer.length === (question.type === 'single' ? 1 : question.correct.length)
}

export function score(question: Question, answer: Response): boolean {
  if (!complete(question, answer)) return false
  if (question.type === 'matching') return question.pairs.every((pair, index) => answer[index] === pair.target)
  return answer.length === question.correct.length && question.correct.every((value) => answer.includes(value))
}

export function answerText(question: Question, answer: Response): string {
  if (!complete(question, answer)) return 'Skipped'
  if (question.type === 'matching') return question.pairs.map((pair, index) => `${pair.term} → ${question.targets[answer[index]]}`).join('; ')
  return answer.map((index) => question.choices[index]).join('; ')
}

export function correctText(question: Question): string {
  if (question.type === 'matching') return question.pairs.map((pair) => `${pair.term} → ${question.targets[pair.target]}`).join('; ')
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

function validSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false
  const session = value as Session
  return Array.isArray(session.ids)
    && session.ids.length > 0
    && session.ids.every((id) => typeof id === 'string' && byId.has(id))
    && Number.isInteger(session.index)
    && session.index >= 0
    && session.index < session.ids.length
    && (session.mode === 'prep' || session.mode === 'exam')
    && Array.isArray(session.modules)
    && Array.isArray(session.draft)
    && !!session.entries
    && (session.phase === 'asking' || session.phase === 'feedback')
}

function validAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false
  const attempt = value as Attempt
  return typeof attempt.id === 'string'
    && typeof attempt.completedAt === 'string'
    && (attempt.mode === 'prep' || attempt.mode === 'exam')
    && Array.isArray(attempt.modules)
    && Array.isArray(attempt.questionIds)
    && attempt.questionIds.length > 0
    && attempt.questionIds.every((id) => typeof id === 'string' && byId.has(id))
    && !!attempt.entries
    && Number.isFinite(attempt.score)
    && Number.isFinite(attempt.bestStreak)
}

function clampVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback
}

function normalizePreferences(value: unknown, version: number): Preferences {
  const prefs = value && typeof value === 'object' ? value as Partial<Preferences> & { muted?: boolean; volume?: number } : {}
  if (version >= 3) {
    return {
      master: clampVolume(prefs.master, defaultPreferences.master),
      musicOn: typeof prefs.musicOn === 'boolean' ? prefs.musicOn : defaultPreferences.musicOn,
      music: clampVolume(prefs.music, defaultPreferences.music),
      sfxOn: typeof prefs.sfxOn === 'boolean' ? prefs.sfxOn : defaultPreferences.sfxOn,
      sfx: clampVolume(prefs.sfx, defaultPreferences.sfx),
    }
  }
  const volume = clampVolume(prefs.volume, 0.55)
  const muted = prefs.muted === true || volume === 0
  return {
    master: defaultPreferences.master,
    musicOn: !muted,
    music: defaultPreferences.music,
    sfxOn: !muted,
    sfx: muted ? defaultPreferences.sfx : volume,
  }
}

function normalizeState(value: unknown): PersistedStateV3 | null {
  if (!value || typeof value !== 'object') return null
  const version = (value as { version?: unknown }).version
  if (version !== 2 && version !== 3) return null
  const state = value as Partial<PersistedStateV3>
  return {
    version: 3,
    activeSession: validSession(state.activeSession) ? state.activeSession : null,
    attempts: Array.isArray(state.attempts) ? state.attempts.filter(validAttempt) : [],
    recency: state.recency && typeof state.recency === 'object' ? state.recency : {},
    preferences: normalizePreferences(state.preferences, version),
  }
}

export function persistState(state: PersistedStateV3): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

function migrateLegacy(): PersistedStateV3 | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const legacy = JSON.parse(raw) as unknown
    const state = emptyState()
    if (validSession(legacy)) {
      state.activeSession = legacy
      const currentId = legacy.ids[legacy.index]
      state.recency[currentId] = { seenCount: 1, lastSeenAt: new Date().toISOString() }
    }
    if (!persistState(state)) return state
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return state
  } catch {
    return null
  }
}

export function readState(): PersistedStateV3 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (raw) {
      const parsed = normalizeState(JSON.parse(raw))
      if (parsed) return parsed
    }
  } catch { /* Fall through to migration/defaults. */ }
  return migrateLegacy() ?? emptyState()
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

export function buildQuestionOrder(candidateIds: string[], length: number, recency: Record<string, QuestionRecency>, random: () => number = Math.random): string[] {
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
    ids: [...ids], index: 0, mode, modules: [...modules], draft: emptyDraft(first), entries: {}, phase: 'asking',
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
    entries: Object.fromEntries(Object.entries(session.entries).map(([id, entry]) => [id, { ...entry, answer: [...entry.answer] }])),
    score: session.ids.filter((id) => session.entries[id]?.correct).length,
    bestStreak: bestStreak(session),
    ...(session.retryOf ? { retryOf: session.retryOf } : {}),
  }
}
