import Link from 'next/link'
import { createGradingClient } from '@/lib/server/grading'
import { supabaseConfigured } from '@/lib/supabase/env'
import { requireUser } from '@/lib/server/auth'
import '@/components/quiz/chronicle.css'

export default async function HistoryPage() {
  if (!supabaseConfigured()) return <div className="chronicle-surface"><main className="chronicle-main results-screen"><h1>History</h1><p>Sign in with Supabase to save attempts across devices.</p><Link href="/">Back to courses</Link></main></div>
  const { supabase: client } = await requireUser()
  const { data: attempts } = await client.from('attempts').select('id,mode,score,best_streak,question_ids,finished_at,assessment_id').eq('status', 'finished').order('finished_at', { ascending: false })
  const assessmentIds = [...new Set((attempts ?? []).map((attempt) => attempt.assessment_id))]
  const { data: assessments } = assessmentIds.length ? await client.from('assessments').select('id,label').in('id', assessmentIds) : { data: [] }
  const names = new Map((assessments ?? []).map((a) => [a.id, a.label]))
  const questionIds = [...new Set((attempts ?? []).flatMap((attempt) => attempt.question_ids as string[]))]
  const { data: questions } = questionIds.length ? await createGradingClient().from('questions').select('id,module').in('id', questionIds) : { data: [] }
  const moduleById = new Map((questions ?? []).map((q) => [q.id, q.module]))
  return <div className="chronicle-surface"><main className="chronicle-main results-screen"><p><Link href="/">Back to courses</Link></p><h1>History</h1>{attempts?.length ? <div className="review-list">{attempts.map((attempt) => { const modules = [...new Set((attempt.question_ids as string[]).map((id) => moduleById.get(id)).filter((n): n is number => typeof n === 'number'))].sort(); return <Link key={attempt.id} className="history-card" href={`/attempts/${attempt.id}`}><strong>{names.get(attempt.assessment_id) ?? 'Assessment'}</strong><span>{attempt.mode === 'prep' ? 'Prep' : 'Exam'} · {modules.map((n) => `Module ${n}`).join(', ')} · {new Date(attempt.finished_at ?? '').toLocaleString()}</span><span>{attempt.score ?? 0}/{attempt.question_ids.length} correct · best streak {attempt.best_streak ?? 0}</span></Link> })}</div> : <p>No finished attempts yet.</p>}</main></div>
}
