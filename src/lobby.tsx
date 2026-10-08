import { AnimatePresence, motion } from 'motion/react'
import { SettingsControl, TapButton, TapLabel } from './ui'
import type { Mode, Preferences } from './quiz'

export type LobbyStep = 'hero' | 'mode' | 'setup'
export type SessionLength = 10 | 25 | 50 | 'all'

export type ActiveLobby = {
  index: number
  total: number
  mode: Mode
  modules: number[]
}

type LobbyProps = {
  step: LobbyStep
  mode: Mode
  modules: number[]
  moduleNames: string[]
  length: SessionLength
  availableCount: number
  questionCount: number
  active: ActiveLobby | null
  preferences: Preferences
  musicPlaying: boolean
  onStep: (step: LobbyStep) => void
  onMode: (mode: Mode) => void
  onToggleModule: (number: number) => void
  onLength: (length: SessionLength) => void
  onStart: () => void
  onResume: () => void
  onNewRun: () => void
  onHistory: () => void
  onPreferences: (next: Preferences, cue?: 'mute' | 'unmute') => void
}

const screenMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function Lobby({
  step,
  mode,
  modules,
  moduleNames,
  length,
  availableCount,
  questionCount,
  active,
  preferences,
  musicPlaying,
  onStep,
  onMode,
  onToggleModule,
  onLength,
  onStart,
  onResume,
  onNewRun,
  onHistory,
  onPreferences,
}: LobbyProps) {
  return <div className="home-screen">
    <AnimatePresence mode="wait">
      {step === 'hero' ? <motion.section key="hero" className="hero-stage" {...screenMotion}>
        <div className="intro">
          <span className="eyebrow">DEVNET REVIEWER</span>
          <h1>Know the network.<br /><em>Trust the answer.</em></h1>
          <p>Practice {questionCount} verified, deduplicated questions from the DevNet midterm and Module 3–4 summative exports.</p>
          {active ? <p className="hero-status">Unfinished {active.mode === 'prep' ? 'Prep' : 'Exam'} · question {active.index + 1} of {active.total} · {active.modules.map((number) => `Module ${number}`).join(', ')}</p> : null}
        </div>
        <div className="hero-actions">
          {active
            ? <TapButton type="button" className="primary hero-cta" onClick={onResume}>Resume session</TapButton>
            : <TapButton type="button" className="primary hero-cta" onClick={() => onStep('mode')}>Start</TapButton>}
          {active ? <TapButton type="button" className="secondary hero-cta" onClick={onNewRun}>New run</TapButton> : null}
          <SettingsControl variant="hero" preferences={preferences} musicPlaying={musicPlaying} onChange={onPreferences} />
          <TapButton type="button" className="secondary hero-cta" onClick={onHistory}>History</TapButton>
        </div>
      </motion.section> : null}

      {step === 'mode' ? <motion.section key="mode" className="setup-panel" {...screenMotion}>
        <TapButton type="button" className="secondary lobby-back" onClick={() => onStep('hero')}>Back</TapButton>
        <div className="section-heading"><span className="step">01</span><div><h2>Choose your mode</h2><p>Both modes move forward only. Answers cannot be revisited.</p></div></div>
        <div className="mode-grid">
          <TapButton type="button" className={`mode-card ${mode === 'prep' ? 'is-active' : ''}`} aria-pressed={mode === 'prep'} onClick={() => onMode('prep')}><span className="mode-icon" aria-hidden="true">◉</span><strong>Prep</strong><span>Feedback, citations, and streaks after each question.</span></TapButton>
          <TapButton type="button" className={`mode-card ${mode === 'exam' ? 'is-active' : ''}`} aria-pressed={mode === 'exam'} onClick={() => onMode('exam')}><span className="mode-icon" aria-hidden="true">◎</span><strong>Exam</strong><span>Neutral progression. Results appear only at the end.</span></TapButton>
        </div>
      </motion.section> : null}

      {step === 'setup' ? <motion.section key="setup" className="setup-panel" {...screenMotion}>
        <TapButton type="button" className="secondary lobby-back" onClick={() => onStep('mode')}>Back</TapButton>
        <div className="section-heading"><span className="step">02</span><div><h2>Select modules</h2><p>{availableCount} reviewed questions available in your selection.</p></div></div>
        <div className="module-grid">{moduleNames.map((name, index) => <TapLabel className={`module-chip ${modules.includes(index + 1) ? 'is-active' : ''}`} key={name}><input type="checkbox" name="modules" value={index + 1} checked={modules.includes(index + 1)} onChange={() => onToggleModule(index + 1)} /><span className="module-index">0{index + 1}</span><span><strong>Module {index + 1}</strong><small>{name}</small></span><span className="chip-check" aria-hidden="true">{modules.includes(index + 1) ? '✓' : ''}</span></TapLabel>)}</div>
        <div className="section-heading"><span className="step">03</span><div><h2>Session length</h2><p>Unseen questions come first, followed by the least recently seen.</p></div></div>
        <div className="length-grid">{([10, 25, 50] as const).map((option) => <TapLabel key={option} className={`length-option ${length === option ? 'is-active' : ''} ${availableCount < option ? 'is-disabled' : ''}`}><input type="radio" name="length" checked={length === option} disabled={availableCount < option} onChange={() => onLength(option)} /><strong>{option}</strong><span>{availableCount < option ? `Needs ${option} available` : option === 10 ? 'Quick drill' : option === 25 ? 'Focused run' : 'Mock exam'}</span></TapLabel>)}<TapLabel className={`length-option ${length === 'all' ? 'is-active' : ''}`}><input type="radio" name="length" checked={length === 'all'} onChange={() => onLength('all')} /><strong>All {availableCount}</strong><span>Full reviewed set</span></TapLabel></div>
        <div className="start-row"><div><strong>Ready when you are.</strong><span>Forward only · No timer · Exact answers</span></div><TapButton type="button" className="primary start-button" onClick={onStart}>Start {mode === 'prep' ? 'Prep' : 'Exam'} <span aria-hidden="true">↗</span></TapButton></div>
      </motion.section> : null}
    </AnimatePresence>
  </div>
}
