import Link from 'next/link'
import { saveQuestion, setBankMembership, setQuestionStatus } from '@/app/actions/admin'

export type AdminQuestion = {
  id: string; course_id: string; status: string; module: number; topic: string; qtype: string;
  prompt: string; payload: unknown; citations: unknown; exhibit_path: string | null
}
export type AdminKey = { correct: unknown; explanation: string }
export type AdminAssessment = { id: string; course_id: string; label: string; slug: string }
export type AdminMembership = { assessment_id: string; source_number: number }

function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [] }
function numbers(value: unknown): number[] { return Array.isArray(value) ? value.filter((v): v is number => typeof v === 'number') : [] }
function terms(value: unknown): string[] { return Array.isArray(value) ? value.map((v) => String(record(v).term ?? '')).filter(Boolean) : [] }
function citations(value: unknown): string { return Array.isArray(value) ? value.map((v) => { const c = record(v); return `${c.label ?? ''} | ${c.href ?? ''}` }).join('\n') : '' }

export function QuestionEditor({ question, keyData, courses, assessments, memberships, notice, error }: {
  question?: AdminQuestion; keyData?: AdminKey | null; courses: { id: string; code: string }[];
  assessments: AdminAssessment[]; memberships: AdminMembership[]; notice?: string; error?: string
}) {
  const payload = record(question?.payload)
  const matching = question?.qtype === 'matching'
  const correct = numbers(keyData?.correct)
  const eligible = !!question && !!keyData?.explanation?.trim() && correct.length > 0 && citations(question.citations).trim().length > 0
  const bankAssessments = assessments.filter((a) => a.course_id === (question?.course_id ?? courses[0]?.id))
  return <main className="ledger"><div className="ledger-shell">
    <header className="ledger-header"><div><p className="ledger-brand">Revwi Ledger</p><h1>{question ? `Question ${question.id}` : 'New question'}</h1></div><nav><Link href="/admin">Back to Ledger</Link></nav></header>
    {error && <p className="ledger-message ledger-error" role="alert">{error}</p>}
    {notice && <p className="ledger-message" role="status">{notice}</p>}
    <section className="ledger-panel"><h2>Content and answer</h2><p>Use one line per choice, term, and target. Answer numbers start at 1. For matching, give one target number per term. Saving a published question returns it to verified until you publish again.</p>
      <form action={saveQuestion} className="ledger-form">
        {question && <input type="hidden" name="id" value={question.id} />}
        <div className="ledger-grid"><label>Course <select name="course_id" defaultValue={question?.course_id}>{courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label><label>Module <input name="module" type="number" min="1" max="4" required defaultValue={question?.module ?? 1} /></label><label>Topic <input name="topic" required defaultValue={question?.topic} /></label><label>Type <select name="qtype" defaultValue={question?.qtype ?? 'single'}><option value="single">Single choice</option><option value="multiple">Multiple choice</option><option value="matching">Matching</option></select></label></div>
        <label>Prompt <textarea name="prompt" rows={5} required defaultValue={question?.prompt} /></label>
        <div className="ledger-grid"><label>Choices, one per line <textarea name="choices" rows={6} defaultValue={matching ? '' : strings(payload.choices).join('\n')} /></label><label>Matching terms, one per line <textarea name="terms" rows={6} defaultValue={matching ? terms(payload.pairs).join('\n') : ''} /></label><label>Matching targets, one per line <textarea name="targets" rows={6} defaultValue={matching ? strings(payload.targets).join('\n') : ''} /></label><label>Answer numbers, comma separated <input name="correct" required defaultValue={correct.map((n) => n + 1).join(', ')} placeholder="2 or 1, 3" /></label></div>
        <label>Explanation <textarea name="explanation" rows={4} required defaultValue={keyData?.explanation} /></label>
        <label>Code example, optional <textarea name="code" rows={5} defaultValue={String(payload.code ?? '')} /></label>
        <label>Editorial change note, optional <input name="edit" defaultValue={String(payload.edit ?? '')} /></label>
        <label>Citations, one “Label | URL” per line <textarea name="citations" rows={4} required defaultValue={citations(question?.citations)} placeholder="Cisco documentation | https://example.com" /></label>
        <label>Exhibit path, optional <input name="exhibit_path" defaultValue={question?.exhibit_path ?? ''} /></label>
        <button type="submit">Save question</button>
      </form>
    </section>
    {question && <><section className="ledger-panel"><h2>Verification and publishing</h2><p>Current status: <strong>{question.status}</strong>. Publishing requires a key, explanation, and citation.</p><div className="ledger-inline">
      {question.status !== 'draft' && <StatusButton id={question.id} status="draft" label="Move to draft" />}
      {question.status !== 'verified' && <StatusButton id={question.id} status="verified" label="Mark verified" />}
      {question.status !== 'published' && <StatusButton id={question.id} status="published" label="Publish" disabled={!eligible || question.status !== 'verified'} />}
    </div></section>
    <section className="ledger-panel"><h2>Assessment banks</h2><p>A published question unlocks an assessment when it belongs to that bank.</p><div className="ledger-bank-grid">{bankAssessments.map((a) => { const item = memberships.find((m) => m.assessment_id === a.id); return <form key={a.id} action={setBankMembership} className="ledger-bank-item"><h3>{a.label}</h3><input type="hidden" name="question_id" value={question.id} /><input type="hidden" name="assessment_id" value={a.id} /><label>Membership <select name="included" defaultValue={item ? 'yes' : 'no'}><option value="yes">Included</option><option value="no">Not included</option></select></label><label>Source number <input name="source_number" type="number" min="0" defaultValue={item?.source_number ?? 0} required /></label><button type="submit">Save bank</button></form> })}</div></section></>}
  </div></main>
}

function StatusButton({ id, status, label, disabled }: { id: string; status: string; label: string; disabled?: boolean }) {
  return <form action={setQuestionStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><button type="submit" disabled={disabled}>{label}</button></form>
}
