'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { retryMissed } from '@/app/actions/attempts'
import { answerText, type PublicQuestion } from '@/lib/domain/public-question'
import './chronicle.css'

export type ReviewRow = { question: PublicQuestion; answer: number[]; skipped: boolean; correct: boolean; correctAnswer: string; explanation: string }
export default function ResultsView({ attemptId, mode, finishedAt, score, bestStreak, rows, setupHref }: { attemptId: string; mode: 'prep' | 'exam'; finishedAt: string; score: number; bestStreak: number; rows: ReviewRow[]; setupHref: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const modules = [...new Set(rows.map((row) => row.question.module))].sort()
  const missed = rows.filter((row) => !row.correct).length
  async function retry() {
    setBusy(true); setError('')
    const result = await retryMissed({ attemptId })
    setBusy(false)
    if (!result.ok) { setError(result.error); return }
    router.push(`${setupHref}/play?attempt=${result.value.id}`)
  }
  return <div className="chronicle-surface"><main className="chronicle-main results-screen"><p><Link href="/attempts">History</Link></p><h1>Session complete</h1><p>{mode === 'prep' ? 'Prep' : 'Exam'} · {new Date(finishedAt).toLocaleString()}</p>
    <div className="score-panel"><div><strong className="score-number">{score}/{rows.length}</strong><span>correct</span></div><div><strong className="score-number">{Math.round(score / rows.length * 100)}%</strong><span>score</span></div><div><strong className="score-number">{bestStreak}</strong><span>best streak</span></div></div>
    <section className="module-results"><h2>By module</h2><div>{modules.map((module) => { const group = rows.filter((row) => row.question.module === module); return <div key={module} className="module-result"><span>Module {module}</span><strong>{group.filter((row) => row.correct).length}/{group.length}</strong></div> })}</div></section>
    <div className="review-heading"><h2>Question review</h2><p>Read every answer and source.</p></div><div className="review-list">{rows.map((row, index) => <details key={`${row.question.id}-${index}`} className="review-item"><summary><span className="review-number">{index + 1}</span><span className={`result-tag ${row.skipped ? 'skipped' : row.correct ? 'correct' : 'incorrect'}`}>{row.skipped ? 'Skipped' : row.correct ? 'Correct' : 'Incorrect'}</span>{row.question.prompt}</summary><div className="review-body"><p><strong>Your answer:</strong> {answerText(row.question, row.answer)}</p><p><strong>Correct answer:</strong> {row.correctAnswer}</p><p>{row.explanation}</p><div className="references">{row.question.citations.map((citation) => <a key={citation.href} href={citation.href}>{citation.label}</a>)}</div></div></details>)}</div>
    {error ? <p role="alert">{error}</p> : null}<div className="result-actions"><button className="primary" type="button" disabled={!missed || busy} onClick={() => void retry()}>{busy ? 'Starting…' : `Retry ${missed} missed in Prep`}</button><Link className="secondary" href={setupHref}>New session</Link><Link className="secondary" href="/attempts">History</Link></div>
  </main></div>
}
