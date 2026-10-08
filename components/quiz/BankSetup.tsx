'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { startAttempt } from '@/app/actions/attempts'

type Props = { course: string; assessment: string; label: string; assessmentId?: string; bank: { id: string; module: number }[]; activeId?: string }
const moduleNames = ['Developer environment', 'DevNet resources', 'Software development', 'Understanding APIs']

export default function BankSetup({ course, assessment, label, assessmentId, bank, activeId }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'prep' | 'exam'>('prep')
  const [modules, setModules] = useState([1, 2, 3, 4])
  const [length, setLength] = useState<10 | 25 | 50 | 'all'>(10)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const available = bank.filter((q) => modules.includes(q.module)).length
  const validLength = length !== 'all' && length > available ? 'all' : length

  async function start(replace = false) {
    if (!available) return
    setBusy(true); setError('')
    if (assessmentId) {
      const result = await startAttempt({ assessmentId, mode, modules, length: validLength, replace })
      setBusy(false)
      if (!result.ok) { setError(result.error); return }
      router.push(`/c/${course}/${assessment}/play?attempt=${result.value.id}`)
      return
    }
    if (mode === 'exam') { setBusy(false); setError('Exam requires sign-in and Supabase.'); return }
    const ids = bank.filter((q) => modules.includes(q.module)).map((q) => q.id)
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]] }
    localStorage.setItem(`revwi:local:${course}:${assessment}`, JSON.stringify({ ids: ids.slice(0, validLength === 'all' ? ids.length : validLength), cursor: 0, draft: [], entries: {}, phase: 'asking', mode: 'prep', modules }))
    router.push(`/c/${course}/${assessment}/play`)
  }

  return <div className="chronicle-surface"><main className="chronicle-main home-screen">
    <p><Link href={`/c/${course}`}>Back to course</Link></p>
    <section className="setup-panel">
      <h1>{label}</h1><p>{available} published questions in your selection. Sessions move forward only.</p>
      {activeId ? <div className="resume-panel"><div><h2>Unfinished session</h2><p>Your question order and saved answer are ready.</p></div><div className="resume-actions"><Link className="primary" href={`/c/${course}/${assessment}/play?attempt=${activeId}`}>Resume</Link><button className="secondary" type="button" onClick={() => { if (confirm('Replace your unfinished session?')) void start(true) }}>Start over</button></div></div> : null}
      <div className="section-heading"><span className="step">01</span><div><h2>Choose your mode</h2><p>Prep reveals answers after each question. Exam waits until results.</p></div></div>
      <div className="mode-grid">{(['prep', 'exam'] as const).map((option) => <button type="button" key={option} className={`mode-card ${mode === option ? 'is-active' : ''}`} disabled={!assessmentId && option === 'exam'} aria-pressed={mode === option} onClick={() => setMode(option)}><strong>{option === 'prep' ? 'Prep' : 'Exam'}</strong><span>{option === 'prep' ? 'Feedback, citations, and streaks after each answer.' : assessmentId ? 'Neutral progression, then full results.' : 'Requires Supabase and sign-in.'}</span></button>)}</div>
      <div className="section-heading"><span className="step">02</span><div><h2>Select modules</h2><p>Choose any combination.</p></div></div>
      <div className="module-grid">{moduleNames.map((name, index) => <label key={name} className={`module-chip ${modules.includes(index + 1) ? 'is-active' : ''}`}><input type="checkbox" checked={modules.includes(index + 1)} onChange={() => setModules((current) => current.includes(index + 1) ? current.filter((n) => n !== index + 1) : [...current, index + 1])} /><span><strong>Module {index + 1}</strong><small>{name}</small></span></label>)}</div>
      <div className="section-heading"><span className="step">03</span><div><h2>Session length</h2><p>Distinct questions, with unseen items first.</p></div></div>
      <div className="length-grid">{([10, 25, 50, 'all'] as const).map((option) => <label key={option} className={`length-option ${validLength === option ? 'is-active' : ''} ${option !== 'all' && option > available ? 'is-disabled' : ''}`}><input type="radio" name="length" checked={validLength === option} disabled={option !== 'all' && option > available} onChange={() => setLength(option)} /><strong>{option === 'all' ? `All ${available}` : option}</strong><span>{option !== 'all' && option > available ? `Needs ${option} available` : option === 'all' ? 'Full bank' : 'Questions'}</span></label>)}</div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="start-row"><span>Forward only. No timer.</span><button className="primary" type="button" disabled={busy || !available} onClick={() => void start()}>{busy ? 'Starting…' : `Start ${mode === 'prep' ? 'Prep' : 'Exam'}`}</button></div>
    </section>
  </main></div>
}
