'use client'

import {
  emptyState,
  type Attempt,
  type PersistedStateV3,
  type Preferences,
  type Session,
  defaultPreferences,
  byId,
} from '@/lib/domain/quiz-core'

export const STORAGE_KEY_V2 = 'revwi:study-state-v3'
export const LEGACY_STORAGE_KEY = 'devnet-reviewer:mvp-session-v1'
const LEGACY_V2 = 'devnet-reviewer:state-v2'

function validSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false
  const session = value as Session
  return (
    Array.isArray(session.ids)
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
  )
}

function validAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false
  const attempt = value as Attempt
  return (
    typeof attempt.id === 'string'
    && typeof attempt.completedAt === 'string'
    && (attempt.mode === 'prep' || attempt.mode === 'exam')
    && Array.isArray(attempt.modules)
    && Array.isArray(attempt.questionIds)
    && attempt.questionIds.length > 0
    && attempt.questionIds.every((id) => typeof id === 'string' && byId.has(id))
    && !!attempt.entries
    && Number.isFinite(attempt.score)
    && Number.isFinite(attempt.bestStreak)
  )
}

function clampVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback
}

function normalizePreferences(value: unknown, version: number): Preferences {
  const prefs = value && typeof value === 'object' ? (value as Partial<Preferences> & { muted?: boolean; volume?: number }) : {}
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

export function persistStudyState(state: PersistedStateV3): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

function migrateLegacy(): PersistedStateV3 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY) ?? localStorage.getItem(LEGACY_V2)
    if (!raw) return null
    const legacy = JSON.parse(raw) as unknown
    const parsed = normalizeState(legacy)
    if (parsed) {
      persistStudyState(parsed)
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return parsed
    }
    const state = emptyState()
    if (validSession(legacy)) {
      state.activeSession = legacy
      const currentId = legacy.ids[legacy.index]
      state.recency[currentId] = { seenCount: 1, lastSeenAt: new Date().toISOString() }
    }
    persistStudyState(state)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return state
  } catch {
    return null
  }
}

export function readStudyState(): PersistedStateV3 {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (raw) {
      const parsed = normalizeState(JSON.parse(raw))
      if (parsed) return parsed
    }
  } catch { /* fall through */ }
  return migrateLegacy() ?? emptyState()
}

/** Device-only audio preferences (attempts belong on the server when Supabase is configured). */
export function readPreferences(): Preferences {
  return readStudyState().preferences
}

export function persistPreferences(preferences: Preferences): void {
  const state = readStudyState()
  persistStudyState({ ...state, preferences })
}
