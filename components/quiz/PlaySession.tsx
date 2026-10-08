'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { continueAttempt, gradeLocalPrep, saveDraft, submitAnswer, type SubmitResult } from '@/app/actions/attempts'
import { answerComplete, answerText, type PublicQuestion } from '@/lib/domain/public-question'
import { SeedlingDock, type SeedlingPose } from './SeedlingDock'
import { playCue } from '@/src/audio'
import './chronicle.css'

type Feedback = Extract<SubmitResult, { kind: 'prep-feedback' }>
export type RemoteState = { id: string; mode: 'prep' | 'exam'; status: 'asking' | 'feedback'; cursor: number; total: number; draft: number[]; question: PublicQuestion; feedback: Omit<Feedback, 'ok' | 'kind'> | null; streak: number }
type LocalEntry = { answer: number[]; skipped: boolean; correct: boolean; correctAnswer: string; explanation: string; citations: { label: string; href: string }[] }
type LocalSession = { ids: string[]; cursor: number; draft: number[]; entries: Record<string, LocalEntry>; phase: 'asking' | 'feedback'; mode: 'prep'; modules: number[] }
type Props = { course: string; assessment: string; remote?: RemoteState; localBank?: PublicQuestion[] }
const prefs = { master: 0.7, musicOn: false, music: 0, sfxOn: true, sfx: 0.55 }
const milestone = (n: number) => n === 3 || n === 5 || n >= 10 && n % 5 === 0

export default function PlaySession({ course, assessment, remote, localBank }: Props) {
  const router = useRouter()
  const storageKey = `revwi:local:${course}:${assessment}`
  const [local, setLocal] = useState<LocalSession | null>(null)
  const [loaded, setLoaded] = useState(Boolean(remote))
  const [draft, setDraft] = useState<number[]>(remote?.draft ?? [])
  const [feedback, setFeedback] = useState<RemoteState['feedback']>(remote?.feedback ?? null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [skipConfirm, setSkipConfirm] = useState(false)
  const [muted, setMuted] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [remoteSaved, setRemoteSaved] = useState(false)

  useEffect(() => {
    if (!remote) {
      try { const raw = localStorage.getItem(storageKey); if (raw) setLocal(JSON.parse(raw) as LocalSession) } catch { /* ignore damaged local session */ }
      setLoaded(true)
    }
    setMuted(localStorage.getItem('revwi:sfx-muted') === 'true')
  }, [remote, storageKey])
  useEffect(() => { if (remote) { setDraft(remote.draft); setFeedback(remote.feedback); setRemoteSaved(false) } }, [remote?.id, remote?.cursor, remote?.status])
  useEffect(() => { if (local) localStorage.setItem(storageKey, JSON.stringify(local)) }, [local, storageKey])
  useEffect(() => { if (!remote && local) setDraft(local.draft) }, [local?.cursor, local?.phase])

  const cursor = remote?.cursor ?? local?.cursor ?? 0
  const total = remote?.total ?? local?.ids.length ?? 0
  const question = remote?.question ?? localBank?.find((q) => q.id === local?.ids[cursor])
  const mode = remote?.mode ?? 'prep'
  const phase = remote?.status ?? local?.phase ?? 'asking'
  const localEntry = question ? local?.entries[question.id] : undefined
  const shownFeedback = remote ? feedback : localEntry ? { correct: localEntry.correct, correctAnswer: localEntry.correctAnswer, explanation: localEntry.explanation, citations: localEntry.citations, streak: 0 } : null
  const answeredIds = local?.ids.slice(0, cursor + (phase === 'feedback' ? 1 : 0)) ?? []
  let localStreak = 0
  for (const id of answeredIds) localStreak = local?.entries[id]?.correct ? localStreak + 1 : 0
  const streak = remote?.streak ?? localStreak
  const finishedLocal = Boolean(local && local.cursor >= local.ids.length)
  const pose: SeedlingPose = mode === 'exam' ? 'exam-neutral' : phase === 'feedback' ? shownFeedback?.correct ? 'celebrate' : 'support' : 'curious'

  function cue(name: Parameters<typeof playCue>[0]) { playCue(name, { ...prefs, sfxOn: !muted }) }
  function changeDraft(next: number[]) {
    setDraft(next); cue('select')
    if (remote && question) void saveDraft({ attemptId: remote.id, questionId: question.id, answer: next })
    else setLocal((previous) => previous ? { ...previous, draft: next } : previous)
  }
  function selectChoice(index: number) {
    if (!question || question.type === 'matching') return
    if (question.type === 'single') changeDraft([index])
    else changeDraft(draft.includes(index) ? draft.filter((n) => n !== index) : draft.length < question.requiredCount ? [...draft, index] : [...draft.slice(1), index])
  }
  function selectMatch(pairIndex: number, targetIndex: number) {
    if (!question || question.type !== 'matching') return
    const next = Array.from({ length: question.pairs.length }, (_, i) => draft[i] ?? -1)
    next[pairIndex] = targetIndex
    changeDraft(next)
  }
  async function submit(skipped: boolean) {
    if (!question || busy) return
    if (!skipped && !answerComplete(question, draft)) { setSkipConfirm(true); return }
    setBusy(true); setNotice(''); setSkipConfirm(false)
    const result = remote ? await submitAnswer({ attemptId: remote.id, questionId: question.id, answer: draft, skipped }) : await gradeLocalPrep({ questionId: question.id, answer: draft, skipped })
    setBusy(false)
    if (!result.ok) { setNotice(result.error); return }
    if (result.kind === 'saved') {
      cue('neutral'); setRemoteSaved(true)
      if (result.finished) router.push(`/attempts/${remote!.id}`)
      else router.refresh()
      return
    }
    cue(result.correct ? 'correct' : 'incorrect')
    if (remote) { setFeedback(result); router.refresh() }
    else setLocal((previous) => previous ? { ...previous, phase: 'feedback', entries: { ...previous.entries, [question.id]: { answer: skipped ? [] : draft, skipped, correct: result.correct, correctAnswer: result.correctAnswer, explanation: result.explanation, citations: result.citations } } } : previous)
  }
  async function continueNext() {
    if (busy) return
    setBusy(true); setNotice('')
    if (remote) {
      const result = await continueAttempt({ attemptId: remote.id })
      setBusy(false)
      if (!result.ok) { setNotice(result.error); return }
      cue('continue')
      if (result.value.finished) router.push(`/attempts/${remote.id}`)
      else router.refresh()
      return
    }
    setLocal((previous) => previous ? { ...previous, cursor: previous.cursor + 1, draft: [], phase: 'asking' } : previous)
    setDraft([]); setBusy(false); cue('continue')
  }

  if (!loaded) return <div className="chronicle-surface"><main className="chronicle-main"><p>Loading session…</p></main></div>
  if (finishedLocal && local) {
    const hits = local.ids.filter((id) => local.entries[id]?.correct).length
    const missed = local.ids.filter((id) => !local.entries[id]?.correct)
    return <div className="chronicle-surface"><main className="chronicle-main results-screen"><h1>Session complete</h1><div className="score-panel"><div><strong className="score-number">{hits}/{local.ids.length}</strong><span>correct</span></div><div><strong className="score-number">{Math.round(100 * hits / local.ids.length)}%</strong><span>score</span></div></div><div className="review-heading"><h2>Review</h2></div><div className="review-list">{local.ids.map((id, i) => { const q = localBank?.find((item) => item.id === id); const entry = local.entries[id]; return q && entry ? <details key={id} className="review-item"><summary><span className="review-number">{i + 1}</span><span className={`result-tag ${entry.skipped ? 'skipped' : entry.correct ? 'correct' : 'incorrect'}`}>{entry.skipped ? 'Skipped' : entry.correct ? 'Correct' : 'Incorrect'}</span>{q.prompt}</summary><div className="review-body"><p>Your answer: {answerText(q, entry.answer)}</p><p>Correct answer: {entry.correctAnswer}</p><p>{entry.explanation}</p><div className="references">{entry.citations.map((c) => <a key={c.href} href={c.href}>{c.label}</a>)}</div></div></details> : null })}</div><div className="result-actions"><button className="primary" type="button" disabled={!missed.length} onClick={() => { setLocal({ ids: missed, cursor: 0, draft: [], entries: {}, phase: 'asking', mode: 'prep', modules: local.modules }); setDraft([]) }}>Retry missed questions</button><Link className="secondary" href={`/c/${course}/${assessment}`}>New session</Link></div></main></div>
  }
  if (!question) return <div className="chronicle-surface"><main className="chronicle-main"><p>No active session.</p><Link href={`/c/${course}/${assessment}`}>Set up a session</Link></main></div>
  return <div className="chronicle-surface"><main className="chronicle-main quiz-screen">
    <div className="quiz-rail"><div className="rail-top"><Link href={`/c/${course}/${assessment}`}>Leave session</Link><span>Question {cursor + 1} of {total}</span><span>{mode === 'exam' ? 'Exam mode' : `Prep · ${streak} streak`}</span><button type="button" className="secondary" onClick={() => { localStorage.setItem('revwi:sfx-muted', String(!muted)); setMuted(!muted) }} aria-pressed={muted}>{muted ? 'Sound off' : 'Sound on'}</button></div><div className="progress-track"><span style={{ transform: `scaleX(${(cursor + 1) / total})` }} /></div></div>
    <div className="chronicle-study-layout"><div><section className="question-stage"><div className="question-meta"><span>Module {question.module}</span><span>{question.topic}</span></div><h1 tabIndex={-1}>{question.prompt}</h1>{question.code ? <div className="code-wrap"><span className="code-label">Code</span><pre tabIndex={0}><code>{question.code}</code></pre></div> : null}{question.exhibit ? <figure className="exhibit"><button type="button" onClick={() => setZoom(true)} aria-label="Zoom exhibit"><img src={question.exhibit.src} alt={question.exhibit.alt} /></button><figcaption>{question.exhibit.credit}</figcaption></figure> : null}</section>
      <section className="answer-section"><div className="answer-heading"><h2>{question.type === 'matching' ? 'Match each term' : 'Choose your answer'}</h2><span>{question.type === 'multiple' ? `Select ${question.requiredCount}` : question.type === 'matching' ? 'Complete every row' : 'Select one'}</span></div>{question.type === 'matching' ? <div className="matching-list">{question.pairs.map((pair, i) => <label className="matching-row" key={`${pair.term}-${i}`}><span className="matching-term">{pair.term}</span><select disabled={phase === 'feedback' || busy} value={draft[i] ?? -1} onChange={(e) => selectMatch(i, Number(e.target.value))}><option value={-1}>Choose a match</option>{question.targets.map((target, j) => <option key={`${target}-${j}`} value={j}>{target}</option>)}</select></label>)}</div> : <div className="answer-grid">{question.choices.map((choice, index) => <button key={`${choice}-${index}`} type="button" disabled={phase === 'feedback' || busy} className={`answer-tile tile-${index % 4} ${draft.includes(index) ? 'selected' : ''}`} aria-pressed={draft.includes(index)} onClick={() => selectChoice(index)}><span className="tile-symbol" aria-hidden="true">{['◆', '●', '▲', '■'][index % 4]}</span><span className="tile-copy"><span className="tile-letter">{String.fromCharCode(65 + index)}</span>{choice}</span></button>)}</div>}</section>
      {phase === 'feedback' && shownFeedback ? <section className={`feedback-card ${shownFeedback.correct ? '' : 'is-wrong'}`} aria-live="polite"><h2>{shownFeedback.correct ? 'Correct' : 'Not quite'}</h2><p><strong>Correct answer:</strong> {shownFeedback.correctAnswer}</p><p>{shownFeedback.explanation}</p><div className="references">{shownFeedback.citations.map((citation) => <a key={citation.href} href={citation.href}>{citation.label}</a>)}</div>{shownFeedback.correct && milestone(streak) ? <p>{streak === 3 ? 'Three in a row. Keep going!' : streak === 5 ? "Five straight. You're finding your rhythm." : `${streak} straight. Keep going!`}</p> : null}</section> : null}
      {remoteSaved && mode === 'exam' ? <p role="status">Answer saved.</p> : null}{notice ? <p role="alert">{notice}</p> : null}
      <div className="quiz-footer"><span>Answers lock after submission.</span>{phase === 'feedback' ? <button type="button" className="primary" disabled={busy} onClick={() => void continueNext()}>Continue</button> : <button type="button" className="primary" disabled={busy} onClick={() => void submit(false)}>{busy ? 'Saving…' : 'Next'}</button>}</div>
    </div><SeedlingDock pose={pose} /></div>
    {skipConfirm ? <div className="dialog-backdrop"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="skip-title"><h2 id="skip-title">Skip this question?</h2><p>Your answer is incomplete. A skip scores zero and cannot be changed.</p><div className="dialog-actions"><button type="button" className="secondary" onClick={() => setSkipConfirm(false)}>Keep answering</button><button type="button" className="primary" onClick={() => void submit(true)}>Confirm skip</button></div></section></div> : null}
    {zoom && question.exhibit ? <div className="zoom-backdrop" role="dialog" aria-modal="true" aria-label="Zoomed exhibit"><div className="zoom-dialog"><button className="zoom-close" type="button" onClick={() => setZoom(false)}>Close</button><img src={question.exhibit.src} alt={question.exhibit.alt} /></div></div> : null}
  </main></div>
}
