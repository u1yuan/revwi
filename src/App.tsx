import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { playCue, preloadCues, stopAudio, syncAudioPreferences } from './audio'
import { setMusicMode, setMusicTier, startMusic, stopMusic } from './music'
import { questions } from './questions'
import {
  attemptFromSession,
  bestStreakForEntries,
  buildQuestionOrder,
  byId,
  complete,
  createSession,
  currentStreak,
  emptyDraft,
  markSeen,
  persistState,
  readState,
  score,
  type Attempt,
  type Mode,
  type PersistedStateV3,
  type Preferences,
  type Session,
} from './quiz'
import { Lobby, type LobbyStep, type SessionLength } from './lobby'
import { AnswerControls, Celebration, ConfirmDialog, CountUp, FlameMeter, ModuleResult, ModuleResults, MotivationLayer, QuestionMedia, References, Review, SettingsControl, TapButton, ZoomDialog, type DialogDetails, type Motivation } from './ui'

type Screen = 'home' | 'quiz' | 'results' | 'history'
type StartSpec = { ids?: string[]; retryOf?: string }

const moduleNames = ['Developer environment', 'DevNet resources', 'Software development', 'Understanding APIs']
const moduleLabel = (number: number) => `Module ${number} · ${moduleNames[number - 1]}`
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const screenMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}
const milestoneMessage = (streak: number) => streak === 3
  ? 'Three in a row. Keep going!'
  : streak === 5
    ? 'Five straight. You’re finding your rhythm.'
    : streak === 10
      ? 'Ten straight. The network is clicking.'
      : `${streak} straight. Keep the signal strong.`
const comebackPool = ['Back on the signal.', 'That’s the reset. Stay with it.', 'Miss cleared. Rhythm returning.']
const missPool = ['Close. Read the next one clean.', 'Shake it off. The next question is fresh.', 'One miss doesn’t drop the session.']
const skipPool = ['Skipped, and that’s a miss. The next one is still yours.', 'Parked for later. Stay with the next question.']
const isMilestone = (streak: number) => streak === 3 || streak === 5 || (streak >= 10 && streak % 5 === 0)
const tierFor = (streak: number) => streak >= 10 ? 4 : streak >= 5 ? 3 : streak >= 3 ? 2 : streak >= 1 ? 1 : 0

export default function App() {
  const [stored, setStored] = useState<PersistedStateV3>(readState)
  const [screen, setScreen] = useState<Screen>('home')
  const [lobbyStep, setLobbyStep] = useState<LobbyStep>('hero')
  const [mode, setMode] = useState<Mode>('prep')
  const [modules, setModules] = useState<number[]>([1, 2, 3, 4])
  const [length, setLength] = useState<SessionLength>(10)
  const [result, setResult] = useState<Attempt | null>(null)
  const [resultOrigin, setResultOrigin] = useState<'completion' | 'history'>('completion')
  const [zoom, setZoom] = useState(false)
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<DialogDetails | null>(null)
  const [motivation, setMotivation] = useState<Motivation | null>(null)
  const [flameEvent, setFlameEvent] = useState<'pulse' | 'extinguish' | ''>('')
  const [playOutsideQuiz, setPlayOutsideQuiz] = useState(false)
  const [musicOnAir, setMusicOnAir] = useState(false)
  const questionHeading = useRef<HTMLHeadingElement>(null)
  const feedbackHeading = useRef<HTMLHeadingElement>(null)
  const motivationTimer = useRef<number | null>(null)
  const flameTimer = useRef<number | null>(null)
  const messageCursor = useRef(0)
  const motivationId = useRef(0)

  const active = stored.activeSession
  const available = questions.filter((question) => modules.includes(question.module))
  const current = active ? byId.get(active.ids[active.index]) ?? null : null
  const currentEntry = current && active ? active.entries[current.id] : undefined
  const streak = active?.mode === 'prep' ? currentStreak(active) : 0

  const commit = useCallback((update: (previous: PersistedStateV3) => PersistedStateV3) => {
    setStored((previous) => {
      const next = update(previous)
      persistState(next)
      return next
    })
  }, [])

  const closeDialog = useCallback(() => setDialog(null), [])
  const closeZoom = useCallback(() => setZoom(false), [])

  useEffect(() => {
    if (length !== 'all' && available.length < length) setLength('all')
  }, [available.length, length])

  useEffect(() => {
    if (screen !== 'home') setLobbyStep('hero')
  }, [screen])

  useEffect(() => {
    if (screen !== 'quiz') return
    if (active?.phase === 'feedback') feedbackHeading.current?.focus()
    else questionHeading.current?.focus()
  }, [screen, active?.index, active?.phase])

  useEffect(() => () => {
    if (motivationTimer.current) window.clearTimeout(motivationTimer.current)
    if (flameTimer.current) window.clearTimeout(flameTimer.current)
    stopAudio()
    stopMusic()
  }, [])

  useEffect(() => {
    syncAudioPreferences(stored.preferences)
    const allowed = stored.preferences.musicOn && stored.preferences.music > 0 && stored.preferences.master > 0
    const shouldPlay = allowed && (screen === 'quiz' || playOutsideQuiz)
    if (!shouldPlay) {
      stopMusic()
      setMusicOnAir(false)
      return
    }
    const playbackMode: Mode = screen === 'quiz' && active ? active.mode : 'prep'
    let cancel = false
    void startMusic(playbackMode).then((ok) => { if (!cancel) setMusicOnAir(ok) })
    return () => { cancel = true }
  }, [screen, stored.preferences, playOutsideQuiz, active?.mode])

  useEffect(() => {
    const playbackMode: Mode = screen === 'quiz' && active?.mode ? active.mode : 'prep'
    setMusicMode(playbackMode)
    setMusicTier(playbackMode === 'prep' && screen === 'quiz' ? streak : 0)
  }, [screen, active?.mode, streak])

  function animateFlame(event: 'pulse' | 'extinguish') {
    if (flameTimer.current) window.clearTimeout(flameTimer.current)
    setFlameEvent(event)
    flameTimer.current = window.setTimeout(() => setFlameEvent(''), 720)
  }

  function nextLine(pool: string[]) {
    const text = pool[messageCursor.current % pool.length]
    messageCursor.current += 1
    return text
  }

  function showMotivation(kind: Motivation['kind'], text: string, nextStreak = 0) {
    if (motivationTimer.current) window.clearTimeout(motivationTimer.current)
    const item: Motivation = { id: motivationId.current += 1, kind, text, tier: tierFor(nextStreak) }
    setMotivation(item)
    motivationTimer.current = window.setTimeout(() => setMotivation(null), kind === 'milestone' ? 1700 : 1500)
  }

  function updateSession(change: (session: Session) => Session) {
    commit((previous) => previous.activeSession ? { ...previous, activeSession: change(previous.activeSession) } : previous)
  }

  function cueMusic(playbackMode: Mode) {
    preloadCues()
    if (!stored.preferences.musicOn || stored.preferences.music <= 0 || stored.preferences.master <= 0) return
    void startMusic(playbackMode).then(setMusicOnAir)
  }

  function beginStart(spec: StartSpec = {}) {
    const playbackMode: Mode = spec.ids ? 'prep' : mode
    commit((previous) => {
      const candidates = spec.ids ?? available.map((question) => question.id)
      const requestedLength = spec.ids ? spec.ids.length : length === 'all' ? candidates.length : length
      const ordered = buildQuestionOrder(candidates, requestedLength, previous.recency)
      if (!ordered.length) return previous
      const selectedModules = spec.ids ? [...new Set(ordered.map((id) => byId.get(id)!.module))].sort() : [...modules]
      const session = createSession(ordered, playbackMode, selectedModules, spec.retryOf)
      return markSeen({ ...previous, activeSession: session }, ordered[0])
    })
    setResult(null)
    setNotice('')
    setDialog(null)
    setScreen('quiz')
    cueMusic(playbackMode)
  }

  function requestStart(spec: StartSpec = {}) {
    if (!active) { beginStart(spec); return }
    setDialog({
      title: 'Replace unfinished session?',
      body: 'Your current question order, selections, and locked answers will be discarded. Completed attempts stay in History.',
      confirmLabel: 'Replace session',
      tone: 'danger',
      onConfirm: () => beginStart(spec),
    })
  }

  function goHome() {
    setScreen('home')
    setLobbyStep('hero')
  }

  function chooseMode(next: Mode) {
    setMode(next)
    playCue('mode', stored.preferences)
    setLobbyStep('setup')
  }

  function requestNewRun() {
    if (!active) { setLobbyStep('mode'); return }
    setDialog({
      title: 'Replace unfinished session?',
      body: 'Your current question order, selections, and locked answers will be discarded. Completed attempts stay in History.',
      confirmLabel: 'Replace session',
      tone: 'danger',
      onConfirm: () => {
        commit((previous) => ({ ...previous, activeSession: null }))
        setDialog(null)
        setLobbyStep('mode')
      },
    })
  }

  function finish(session: Session) {
    const attempt = attemptFromSession(session)
    commit((previous) => ({ ...previous, activeSession: null, attempts: [...previous.attempts, attempt] }))
    setResult(attempt)
    setResultOrigin('completion')
    setMotivation(null)
    playCue('completion', stored.preferences)
    setScreen('results')
  }

  function advance(session: Session) {
    if (session.index === session.ids.length - 1) { finish(session); return }
    const nextIndex = session.index + 1
    const nextQuestion = byId.get(session.ids[nextIndex])!
    const next = { ...session, index: nextIndex, draft: emptyDraft(nextQuestion), phase: 'asking' as const }
    commit((previous) => markSeen({ ...previous, activeSession: next }, nextQuestion.id))
  }

  function commitAnswer(skipped: boolean) {
    if (!active || !current) return
    const entry = {
      answer: skipped ? emptyDraft(current) : [...active.draft],
      skipped,
      correct: !skipped && score(current, active.draft),
    }
    const next: Session = { ...active, entries: { ...active.entries, [current.id]: entry }, phase: active.mode === 'prep' ? 'feedback' : 'asking' }
    setDialog(null)

    if (active.mode === 'exam') {
      playCue('neutral', stored.preferences)
      setNotice(skipped ? 'Response saved as skipped.' : 'Response saved.')
      advance(next)
      return
    }

    const nextStreak = currentStreak(next)
    const priorId = active.ids[active.index - 1]
    const priorMiss = priorId ? active.entries[priorId] && !active.entries[priorId].correct : false
    if (entry.correct) {
      animateFlame('pulse')
      if (isMilestone(nextStreak)) {
        showMotivation('milestone', milestoneMessage(nextStreak), nextStreak)
        playCue('milestone', stored.preferences)
      } else {
        if (priorMiss) showMotivation('comeback', nextLine(comebackPool), nextStreak)
        playCue('correct', stored.preferences)
      }
    } else {
      animateFlame('extinguish')
      showMotivation('miss', nextLine(skipped ? skipPool : missPool))
      playCue(skipped ? 'skip' : 'incorrect', stored.preferences)
    }
    commit((previous) => ({ ...previous, activeSession: next }))
  }

  function submit() {
    if (!active || !current) return
    if (active.phase === 'feedback') {
      playCue('continue', stored.preferences)
      advance(active)
      return
    }
    if (!complete(current, active.draft)) {
      setDialog({
        title: 'Skip this question?',
        body: 'It will count as incorrect and cannot be revisited in this forward-only session.',
        confirmLabel: 'Skip question',
        tone: 'danger',
        onConfirm: () => commitAnswer(true),
      })
      return
    }
    commitAnswer(false)
  }

  function toggleModule(number: number) {
    setModules((previous) => previous.includes(number)
      ? previous.length === 1 ? previous : previous.filter((value) => value !== number)
      : [...previous, number].sort())
  }

  function updatePreferences(next: Preferences, cue?: 'mute' | 'unmute') {
    const wasMusic = stored.preferences.musicOn && stored.preferences.music > 0 && stored.preferences.master > 0
    const nowMusic = next.musicOn && next.music > 0 && next.master > 0
    if (cue === 'mute') playCue('mute', stored.preferences)
    if (!wasMusic && nowMusic) {
      setPlayOutsideQuiz(true)
      void startMusic(screen === 'quiz' && active ? active.mode : 'prep').then(setMusicOnAir)
    }
    if (wasMusic && !nowMusic) setPlayOutsideQuiz(false)
    syncAudioPreferences(next)
    commit((previous) => ({ ...previous, preferences: next }))
    if (cue === 'unmute') playCue('unmute', next)
  }

  function openAttempt(attempt: Attempt) {
    setResult(attempt)
    setResultOrigin('history')
    setScreen('results')
  }

  const correctCount = result?.score ?? 0
  const percent = result ? Math.round(correctCount / result.questionIds.length * 100) : 0
  const missedIds = result?.questionIds.filter((id) => !result.entries[id]?.correct) ?? []
  const sortedAttempts = [...stored.attempts].sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  const progress = active ? (active.index + (currentEntry ? 1 : 0)) / active.ids.length : 0

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <TapButton type="button" className="brand" onClick={goHome} aria-label="DevNet Reviewer home"><span className="brand-mark">D<span>↗</span></span><span>DevNet <strong>Reviewer</strong></span></TapButton>
      <div className="header-tools">
        <TapButton type="button" className={`history-link ${screen === 'history' ? 'is-active' : ''}`} onClick={() => setScreen('history')}>History <span>{stored.attempts.length}</span></TapButton>
        <SettingsControl preferences={stored.preferences} musicPlaying={musicOnAir} onChange={updatePreferences} />
      </div>
    </header>
    <main id="main-content">
      <AnimatePresence mode="wait">
        {screen === 'home' ? <motion.div key="home" {...screenMotion}>
          <Lobby step={lobbyStep} mode={mode} modules={modules} moduleNames={moduleNames} length={length} availableCount={available.length} questionCount={questions.length} active={active ? { index: active.index, total: active.ids.length, mode: active.mode, modules: active.modules } : null} preferences={stored.preferences} musicPlaying={musicOnAir} onStep={setLobbyStep} onMode={chooseMode} onToggleModule={toggleModule} onLength={setLength} onStart={() => requestStart()} onResume={() => { setScreen('quiz'); cueMusic(active!.mode) }} onNewRun={requestNewRun} onHistory={() => setScreen('history')} onPreferences={updatePreferences} />
        </motion.div> : null}

        {screen === 'quiz' && active && current ? <motion.div key="quiz" className="quiz-screen" {...screenMotion}>
          <div className="quiz-rail"><div className="rail-top"><span className="eyebrow">{active.mode === 'prep' ? 'PREP MODE' : 'EXAM MODE'}</span><span>Question {active.index + 1} of {active.ids.length}</span>{active.mode === 'prep' ? <FlameMeter streak={streak} event={flameEvent} /> : <span className="exam-shield">Results sealed until the end</span>}</div><div className="progress-track" role="progressbar" aria-label="Session progress" aria-valuenow={active.index + (currentEntry ? 1 : 0)} aria-valuemin={0} aria-valuemax={active.ids.length}><motion.span initial={false} animate={{ scaleX: progress }} style={{ originX: 0 }} /></div></div>
          <AnimatePresence mode="wait">
            <motion.div className="question-transition" key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <section className="question-stage"><div className="question-meta"><span>{moduleLabel(current.module)}</span><span>{current.topic}</span></div><h1 ref={questionHeading} tabIndex={-1}>{current.prompt}</h1><QuestionMedia question={current} onZoom={() => setZoom(true)} />{current.edit ? <p className="edit-badge">Edited for accuracy or readability</p> : null}</section>
              <section className="answer-section"><div className="answer-heading"><h2>Your answer</h2><span aria-live="polite">{current.type === 'multiple' ? `Choose ${current.correct.length} · ${active.draft.length} of ${current.correct.length} selected` : current.type === 'matching' ? `Match every pair · ${active.draft.filter((value) => value >= 0).length} of ${current.pairs.length} matched` : 'Choose one answer'}</span></div><AnswerControls question={current} draft={active.draft} locked={!!currentEntry} entry={currentEntry} reveal={active.mode === 'prep' && active.phase === 'feedback'} onChange={(draft, action) => { playCue(action, stored.preferences); updateSession((session) => ({ ...session, draft })) }} /></section>
              {active.phase === 'feedback' && currentEntry ? <motion.section className={`feedback-card ${currentEntry.correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}><span className="eyebrow">ANSWER REVEAL</span><h2 ref={feedbackHeading} tabIndex={-1}>{currentEntry.skipped ? 'Skipped' : currentEntry.correct ? 'Correct' : 'Incorrect'}</h2><p><strong>Your answer:</strong> {currentEntry.skipped ? 'Skipped' : current.type === 'matching' ? current.pairs.map((pair, index) => `${pair.term} → ${current.targets[currentEntry.answer[index]]}`).join('; ') : currentEntry.answer.map((index) => current.choices[index]).join('; ')}</p><p><strong>Correct answer:</strong> {current.type === 'matching' ? current.pairs.map((pair) => `${pair.term} → ${current.targets[pair.target]}`).join('; ') : current.correct.map((index) => current.choices[index]).join('; ')}</p><p>{current.explanation}</p><References question={current} /></motion.section> : null}
            </motion.div>
          </AnimatePresence>
          <div className="quiz-footer"><span aria-live="polite">{active.mode === 'exam' ? notice || 'Answers and streaks are revealed after the session.' : active.phase === 'feedback' ? 'Answer locked. Continue when ready.' : 'You may change your selection before submitting.'}</span><TapButton className="primary" type="button" onClick={submit}>{active.phase === 'feedback' ? active.index === active.ids.length - 1 ? 'See results' : 'Continue' : 'Next'} <span aria-hidden="true">→</span></TapButton></div>
        </motion.div> : null}

        {screen === 'history' ? <motion.div key="history" className="history-screen" {...screenMotion}><div className="page-heading"><span className="eyebrow">ON THIS DEVICE</span><h1>Attempt history</h1><p>Completed attempts are immutable. Retrying missed questions creates a separate Prep attempt.</p></div>{sortedAttempts.length ? <div className="history-list">{sortedAttempts.map((attempt) => <TapButton type="button" className="history-card" key={attempt.id} onClick={() => openAttempt(attempt)}><span><strong>{attempt.mode === 'prep' ? 'Prep' : 'Exam'}</strong><small>{dateFormatter.format(new Date(attempt.completedAt))}</small></span><span><small>{attempt.modules.map((number) => `M${number}`).join(' · ')}</small><strong>{attempt.score}/{attempt.questionIds.length} · {Math.round(attempt.score / attempt.questionIds.length * 100)}%</strong></span><span><small>Best streak</small><strong>{attempt.bestStreak}</strong></span><span aria-hidden="true">→</span></TapButton>)}</div> : <div className="empty-state"><span aria-hidden="true">◎</span><h2>No completed attempts yet</h2><p>Finish a Prep or Exam session and it will appear here.</p><TapButton type="button" className="primary" onClick={goHome}>Set up a session</TapButton></div>}</motion.div> : null}

        {screen === 'results' && result ? <motion.div key="results" className="results-screen" {...screenMotion}>
          {resultOrigin === 'completion' && percent >= 80 ? <Celebration /> : null}
          <span className="eyebrow">{resultOrigin === 'completion' ? 'SESSION COMPLETE' : 'SAVED ATTEMPT'}</span>
          <h1>{resultOrigin === 'completion' ? 'Review your run.' : 'Read-only review.'}</h1>
          <p className="result-date">{dateFormatter.format(new Date(result.completedAt))} · {result.mode === 'prep' ? 'Prep' : 'Exam'} · {result.modules.map((number) => `Module ${number}`).join(', ')}</p>
          <div className="score-panel">
            <div><span className="score-number"><CountUp value={correctCount} /><small>/{result.questionIds.length}</small></span><span>Correct answers</span></div>
            <div><span className="score-number"><CountUp value={percent} /><small>%</small></span><span>Exact score</span></div>
            <div><span className="score-number"><CountUp value={result.bestStreak ?? bestStreakForEntries(result.questionIds, result.entries)} /></span><span>Best streak</span></div>
          </div>
          <div className="module-results"><h2>By module</h2><ModuleResults>{[1, 2, 3, 4].filter((number) => result.questionIds.some((id) => byId.get(id)!.module === number)).map((number) => { const ids = result.questionIds.filter((id) => byId.get(id)!.module === number); return <ModuleResult key={number}><span>{moduleLabel(number)}</span><strong>{ids.filter((id) => result.entries[id]?.correct).length}/{ids.length}</strong></ModuleResult> })}</ModuleResults></div>
          <div className="review-heading"><div><h2>Question review</h2><p>Every answer is read-only. Open a question for its explanation and source.</p></div></div>
          <Review attempt={result} />
          <div className="result-actions">{missedIds.length > 0 ? <TapButton type="button" className="primary" onClick={() => requestStart({ ids: missedIds, retryOf: result.id })}>Retry {missedIds.length} missed in Prep</TapButton> : null}<TapButton type="button" className="secondary" onClick={() => { if (resultOrigin === 'history') setScreen('history'); else goHome() }}>{resultOrigin === 'history' ? 'Back to history' : 'Start another session'}</TapButton></div>
        </motion.div> : null}
      </AnimatePresence>
    </main>
    <footer className="site-footer"><span>DevNet Reviewer · Complete local bank</span><span>Attempts and preferences stay in this browser.</span></footer>
    <MotivationLayer item={motivation && active?.mode !== 'exam' ? motivation : null} />
    <div className="sr-only" aria-live="polite">{motivation?.text ?? ''}</div>
    <AnimatePresence>{dialog ? <ConfirmDialog key={dialog.title} details={dialog} onCancel={closeDialog} /> : null}</AnimatePresence>
    <AnimatePresence>{zoom && current?.exhibit ? <ZoomDialog key="zoom" src={current.exhibit.src} alt={current.exhibit.alt} onClose={closeZoom} /> : null}</AnimatePresence>
  </div>
}
