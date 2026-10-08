import { forwardRef, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { answerText, byId, correctText, type Attempt, type Entry, type Preferences } from './quiz'
import type { Question } from './questions'

const markers = ['◆', '●', '▲', '■']
const tap = { type: 'spring' as const, stiffness: 520, damping: 32, mass: 0.55 }

type ButtonProps = Omit<ComponentProps<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragOver' | 'onDragEnter' | 'onDragLeave' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>
type LabelProps = Omit<ComponentProps<'label'>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragOver' | 'onDragEnter' | 'onDragLeave' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>

export const TapButton = forwardRef<HTMLButtonElement, ButtonProps>(function TapButton({ className, ...props }, ref) {
  return <motion.button ref={ref} className={className} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} transition={tap} style={{ willChange: 'transform' }} {...props} />
})

export function TapLabel({ className, ...props }: LabelProps) {
  const frozen = className?.includes('is-disabled')
  return <motion.label className={className} whileHover={frozen ? undefined : { y: -2 }} whileTap={frozen ? undefined : { scale: 0.98 }} transition={tap} style={{ willChange: 'transform' }} {...props} />
}

export function References({ question }: { question: Question }) {
  return <div className="references">
    <span className="source-name">Source: {question.source.assessment}, Q{question.source.number}</span>
    <span className="reference-links">{question.citations.map((citation) => <a key={citation.href} href={citation.href} target="_blank" rel="noreferrer">{citation.label} ↗</a>)}</span>
    {question.edit ? <span className="edit-note">Edited: {question.edit}</span> : null}
  </div>
}

export function QuestionMedia({ question, onZoom }: { question: Question; onZoom?: () => void }) {
  return <>
    {question.code ? <div className="code-wrap"><span className="code-label">PYTHON SCRIPT · SCROLL TO READ</span><pre tabIndex={0}><code>{question.code}</code></pre></div> : null}
    {question.exhibit ? <figure className="exhibit"><img src={question.exhibit.src} alt={question.exhibit.alt} width="706" height="211" loading="lazy" decoding="async" /><figcaption><span>{question.exhibit.credit}</span>{onZoom ? <TapButton type="button" className="text-button" onClick={onZoom}>Zoom exhibit</TapButton> : <a href={question.exhibit.src} target="_blank" rel="noreferrer">Open full-size exhibit ↗</a>}</figcaption></figure> : null}
  </>
}

type AnswerControlsProps = {
  question: Question
  draft: number[]
  locked: boolean
  entry?: Entry
  reveal: boolean
  onChange: (next: number[], action: 'select' | 'deselect') => void
}

const enter = (index: number) => ({ delay: index * 0.045, type: 'spring' as const, bounce: 0.28, visualDuration: 0.32 })

export function AnswerControls({ question, draft, locked, entry, reveal, onChange }: AnswerControlsProps) {
  if (question.type === 'matching') {
    return <div className="matching-list">
      {question.pairs.map((pair, index) => <motion.label className="matching-row" key={pair.term} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={enter(index)} whileHover={locked ? undefined : { y: -2 }} whileTap={locked ? undefined : { scale: 0.99 }}>
        <span className="matching-term">{pair.term}</span>
        <select value={draft[index] ?? -1} disabled={locked} onChange={(event) => onChange(draft.map((value, itemIndex) => itemIndex === index ? Number(event.target.value) : value), 'select')} aria-label={`Match for ${pair.term}`}>
          <option value={-1}>Choose a function…</option>
          {question.targets.map((target, targetIndex) => <option key={target} value={targetIndex} disabled={draft.some((value, itemIndex) => itemIndex !== index && value === targetIndex)}>{target}</option>)}
        </select>
      </motion.label>)}
    </div>
  }

  const multiple = question.type === 'multiple'
  return <div className="answer-grid" role="group" aria-label="Answer choices">
    {question.choices.map((answerChoice, index) => {
      const selected = draft.includes(index)
      const isCorrect = reveal && question.correct.includes(index)
      const isUserAnswer = reveal && !!entry && !entry.skipped && entry.answer.includes(index)
      const wrongPick = reveal && isUserAnswer && !isCorrect
      return <motion.label key={`${question.id}-${index}`} className={`answer-tile tile-${index % 4} ${selected ? 'selected' : ''} ${locked ? 'locked' : ''} ${isCorrect ? 'answer-correct' : ''} ${isUserAnswer ? 'answer-user' : ''}`} initial={{ opacity: 0, y: 12 }} whileHover={locked ? undefined : { y: -3 }} whileTap={locked ? undefined : { scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: selected && !locked ? 1.02 : 1, boxShadow: isCorrect ? '0 0 0 3px rgba(255,255,255,.88), 0 10px 24px rgba(20,36,58,.16)' : '0 0 0 0 rgba(20,36,58,0)' }} transition={{ ...tap, opacity: { delay: index * 0.045 }, y: { delay: index * 0.045 } }}>
        <input type={multiple ? 'checkbox' : 'radio'} name={`answer-${question.id}`} checked={selected} disabled={locked} onChange={() => {
          if (multiple) onChange(selected ? draft.filter((item) => item !== index) : draft.length < question.correct.length ? [...draft, index] : draft, selected ? 'deselect' : 'select')
          else onChange([index], 'select')
        }} aria-label={`${String.fromCharCode(65 + index)}. ${answerChoice}`} />
        <motion.span className="tile-symbol" aria-hidden="true" animate={wrongPick ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }} transition={{ duration: 0.38 }}>{markers[index % 4]}</motion.span>
        <span className="tile-copy"><span className="tile-letter">{String.fromCharCode(65 + index)}</span><span>{answerChoice}</span>{reveal && (isUserAnswer || isCorrect) ? <span className="answer-labels">{isUserAnswer ? <span>Your answer</span> : null}{isCorrect ? <span>Correct answer</span> : null}</span> : null}</span>
        {selected ? <motion.svg className="tile-check" viewBox="0 0 24 24" aria-hidden="true"><motion.path d="M5 12.5 10 17.5 19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }} /></motion.svg> : null}
      </motion.label>
    })}
  </div>
}

export function Review({ attempt }: { attempt: Attempt }) {
  return <div className="review-list">{attempt.questionIds.map((id, index) => {
    const question = byId.get(id)
    if (!question) return null
    const entry = attempt.entries[id]
    const status = entry?.skipped ? 'Skipped' : entry?.correct ? 'Correct' : 'Incorrect'
    return <details className="review-item" key={id} open={index === 0}>
      <summary><span className={`result-tag ${status.toLowerCase()}`}>{status}</span><span className="review-number">{String(index + 1).padStart(2, '0')}</span><span>{question.prompt}</span></summary>
      <div className="review-body"><QuestionMedia question={question} /><p><strong>Your answer:</strong> {entry ? answerText(question, entry.answer) : 'Skipped'}</p><p><strong>Correct answer:</strong> {correctText(question)}</p><p>{question.explanation}</p><References question={question} /></div>
    </details>
  })}</div>
}

function Equalizer({ playing }: { playing: boolean }) {
  return <span className="eq" aria-hidden="true">{[0, 1, 2].map((index) => <motion.span key={index} animate={playing ? { scaleY: [0.35, 1, 0.5, 0.85, 0.35] } : { scaleY: 0.28 }} transition={playing ? { duration: 0.7 + index * 0.16, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }} style={{ originY: 1 }} />)}</span>
}

export function SettingsControl({ preferences, musicPlaying, onChange, variant = 'gear' }: { preferences: Preferences; musicPlaying: boolean; onChange: (next: Preferences, cue?: 'mute' | 'unmute') => void; variant?: 'gear' | 'hero' }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const focusable = () => [...(panel?.querySelectorAll<HTMLElement>('button, input') ?? [])]
    panel?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus() }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (!panel?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onPointer) }
  }, [open])

  return <div className={`settings-control${variant === 'hero' ? ' is-hero' : ''}`}>
    {musicPlaying && variant === 'gear' ? <Equalizer playing /> : null}
    <motion.button ref={buttonRef} type="button" className={variant === 'hero' ? 'hero-settings' : 'gear-button'} aria-expanded={open} aria-haspopup="dialog" whileHover={variant === 'hero' ? { y: -2 } : { rotate: 25 }} whileTap={{ scale: variant === 'hero' ? 0.98 : 0.94 }} onClick={() => setOpen((value) => !value)}>{variant === 'hero' ? <>{musicPlaying ? <Equalizer playing /> : null}Settings</> : <><span className="sr-only">Audio settings</span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13.5a7.7 7.7 0 0 0 .1-1.5 7.7 7.7 0 0 0-.1-1.5l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.4 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.6a7.7 7.7 0 0 0-.1 1.5 7.7 7.7 0 0 0 .1 1.5l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5L10 22h4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6ZM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Z" /></svg></>}</motion.button>
    <AnimatePresence>
      {open ? <motion.div ref={panelRef} key="audio-settings" className="settings-popover" role="dialog" aria-modal="false" aria-labelledby={titleId} tabIndex={-1} initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.28 }}>
        <strong id={titleId}>Audio</strong>
        <label className="settings-slider">Master <input type="range" min="0" max="1" step="0.05" value={preferences.master} aria-label={`Master volume ${Math.round(preferences.master * 100)} percent`} onChange={(event) => onChange({ ...preferences, master: Number(event.target.value) })} /></label>
        <div className="settings-row"><button type="button" aria-pressed={preferences.musicOn} onClick={() => onChange({ ...preferences, musicOn: !preferences.musicOn })}>{preferences.musicOn ? 'Music on' : 'Music off'}</button><input type="range" min="0" max="1" step="0.05" value={preferences.music} disabled={!preferences.musicOn} aria-label={`Music volume ${Math.round(preferences.music * 100)} percent`} onChange={(event) => onChange({ ...preferences, music: Number(event.target.value) })} /></div>
        <div className="settings-row"><button type="button" aria-pressed={preferences.sfxOn} onClick={() => onChange({ ...preferences, sfxOn: !preferences.sfxOn }, preferences.sfxOn ? 'mute' : 'unmute')}>{preferences.sfxOn ? 'Sound effects on' : 'Sound effects off'}</button><input type="range" min="0" max="1" step="0.05" value={preferences.sfx} disabled={!preferences.sfxOn} aria-label={`Sound effects volume ${Math.round(preferences.sfx * 100)} percent`} onChange={(event) => onChange({ ...preferences, sfx: Number(event.target.value) })} /></div>
      </motion.div> : null}
    </AnimatePresence>
  </div>
}

export function FlameMeter({ streak, event }: { streak: number; event: 'pulse' | 'extinguish' | '' }) {
  const reduced = useReducedMotion()
  const tier = streak >= 10 ? 4 : streak >= 5 ? 3 : streak >= 3 ? 2 : streak >= 1 ? 1 : 0
  const flicker = !reduced && tier > 0 && event !== 'extinguish'
    ? { rotate: tier >= 3 ? [-7, 6, -4, 7, -7] : [-3, 3, -2, 3, -3], scale: tier >= 4 ? [1, 1.14, 0.96, 1.08, 1] : [1, 1.06, 0.98, 1.04, 1] }
    : { rotate: 0, scale: 1 }
  return <div className={`flame-meter tier-${tier} ${event ? `flame-${event}` : ''}`} aria-label={`Current streak ${streak}`}>
    <motion.span className="flame-icon" aria-hidden="true" animate={event === 'extinguish' ? { scale: 0.7, filter: 'grayscale(1)' } : event === 'pulse' ? { scale: [1, 1.38, 1], filter: 'grayscale(0)' } : { scale: 1, filter: tier === 0 ? 'grayscale(.8)' : 'grayscale(0)' }}>
      <motion.span className="flame-glyph" animate={flicker} transition={flicker.rotate === 0 ? { duration: 0.2 } : { duration: Math.max(0.42, 0.85 - tier * 0.1), repeat: Infinity, ease: 'easeInOut' }}>🔥</motion.span>
      <AnimatePresence>
        {event === 'pulse' ? [0, 1, 2, 3].map((index) => <motion.span key={index} className="spark" initial={{ opacity: 0.9, x: 0, y: 0 }} animate={{ opacity: 0, x: (index - 1.5) * 8, y: -18 }} transition={{ duration: 0.45 }} />) : null}
        {event === 'extinguish' ? <motion.span key="smoke" className="smoke" initial={{ opacity: 0.55, y: 2, scale: 0.5 }} animate={{ opacity: 0, y: -14, scale: 1.4 }} transition={{ duration: 0.55 }} /> : null}
      </AnimatePresence>
    </motion.span>
    <span><span className="streak-roll"><AnimatePresence mode="popLayout" initial={false}><motion.strong key={streak} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ type: 'spring', bounce: 0.28, visualDuration: 0.28 }}>{streak}</motion.strong></AnimatePresence></span><small>streak</small></span>
  </div>
}

export type Motivation = { id: number; kind: 'milestone' | 'comeback' | 'miss'; text: string; tier: number }

export function MotivationLayer({ item }: { item: Motivation | null }) {
  return <AnimatePresence>
    {item?.kind === 'milestone' ? <motion.div key={item.id} className={`milestone-overlay tier-${item.tier}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', bounce: 0.34, visualDuration: 0.4 }} aria-hidden="true"><span>🔥</span><strong>{item.text}</strong></motion.div> : null}
    {item && item.kind !== 'milestone' ? <motion.div key={item.id} className={`motivation-toast is-${item.kind}`} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ type: 'spring', bounce: 0.22, visualDuration: 0.32 }} aria-hidden="true"><strong>{item.text}</strong></motion.div> : null}
  </AnimatePresence>
}

export function CountUp({ value }: { value: number }) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(0)
  const motionValue = useMotionValue(0)
  useEffect(() => {
    if (reduced) { setDisplay(value); return }
    motionValue.set(0)
    const controls = animate(motionValue, value, { duration: 0.7, ease: 'easeOut', onUpdate: (latest) => setDisplay(Math.round(latest)) })
    return () => controls.stop()
  }, [motionValue, reduced, value])
  return <>{display}</>
}

export function Celebration() {
  const reduced = useReducedMotion()
  if (reduced) return null
  return <div className="celebration" aria-hidden="true">{Array.from({ length: 48 }, (_, index) => {
    const left = (index * 17) % 100
    const drift = ((index % 7) - 3) * 28
    const spin = (index % 2 === 0 ? 1 : -1) * (160 + (index % 5) * 50)
    return <motion.span key={index} className={`confetti-piece tone-${index % 6}`} style={{ left: `${left}%` }} initial={{ opacity: 0, y: -28, x: 0, rotate: 0 }} animate={{ opacity: [0, 1, 1, 0], y: 640, x: drift, rotate: spin }} transition={{ duration: 1.7 + (index % 5) * 0.16, delay: (index % 12) * 0.035, ease: 'easeIn' }} />
  })}</div>
}

export function ModuleResults({ children }: { children: ReactNode }) {
  return <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>{children}</motion.div>
}

export function ModuleResult({ children }: { children: ReactNode }) {
  return <motion.div className="module-result" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>{children}</motion.div>
}

export type DialogDetails = { title: string; body: string; confirmLabel: string; tone?: 'danger' | 'neutral'; onConfirm: () => void }

export function ConfirmDialog({ details, onCancel }: { details: DialogDetails; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
      if (event.key === 'Tab') {
        const target = event.shiftKey ? cancelRef.current : confirmRef.current
        if (document.activeElement === target) {
          event.preventDefault()
          ;(event.shiftKey ? confirmRef.current : cancelRef.current)?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])
  return <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <motion.section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-body" initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 6 }}>
      <span className="eyebrow">CONFIRM ACTION</span><h2 id="dialog-title">{details.title}</h2><p id="dialog-body">{details.body}</p>
      <div className="dialog-actions"><TapButton ref={cancelRef} type="button" className="secondary" onClick={onCancel}>Cancel</TapButton><TapButton ref={confirmRef} type="button" className={details.tone === 'danger' ? 'danger' : 'primary'} onClick={details.onConfirm}>{details.confirmLabel}</TapButton></div>
    </motion.section>
  </motion.div>
}

export function ZoomDialog({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])
  return <motion.div className="zoom-backdrop" role="dialog" aria-modal="true" aria-label="Zoomed exhibit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.div className="zoom-dialog" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
      <TapButton ref={closeRef} type="button" className="zoom-close" onClick={onClose}>Close ×</TapButton>
      <img src={src} alt={alt} width="706" height="211" />
    </motion.div>
  </motion.div>
}
