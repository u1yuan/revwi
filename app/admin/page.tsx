import Link from 'next/link'
import { inviteStudent, saveAssessment, saveCourse } from '@/app/actions/admin'
import { requireAdmin } from '@/lib/server/auth'

type Search = Promise<{ error?: string; notice?: string; q?: string }>

export default async function AdminHomePage({ searchParams }: { searchParams: Search }) {
  const { supabase } = await requireAdmin()
  const params = await searchParams
  const [yearResult, courseResult, assessmentResult, questionResult, bankResult] = await Promise.all([
    supabase.from('year_levels').select('id, ordinal, name').order('ordinal'),
    supabase.from('courses').select('id, year_level_id, code, title, alias, slug').order('code'),
    supabase.from('assessments').select('id, course_id, kind, number, exam, label, slug, ordinal, modules').order('ordinal'),
    supabase.from('questions').select('id, course_id, topic, status, qtype').order('id'),
    supabase.from('bank_items').select('assessment_id, question_id'),
  ])
  const years = yearResult.data ?? []
  const courses = courseResult.data ?? []
  const assessments = assessmentResult.data ?? []
  const questions = questionResult.data ?? []
  const banks = bankResult.data ?? []
  const dbError = [yearResult.error, courseResult.error, assessmentResult.error, questionResult.error, bankResult.error].find(Boolean)
  const published = new Set(questions.filter((q) => q.status === 'published').map((q) => q.id))
  const count = (id: string) => banks.filter((item) => item.assessment_id === id && published.has(item.question_id)).length
  const visible = params.q ? questions.filter((q) => `${q.id} ${q.topic}`.toLowerCase().includes(params.q!.toLowerCase())) : questions

  return <main className="ledger"><div className="ledger-shell">
    <header className="ledger-header"><div><p className="ledger-brand">Revwi Ledger</p><h1>Course and bank management</h1></div><nav><Link href="/">Student view</Link><Link href="/admin/questions/new">New question</Link></nav></header>
    {params.error && <p className="ledger-message ledger-error" role="alert">{params.error}</p>}
    {params.notice && <p className="ledger-message" role="status">{params.notice}</p>}
    {dbError && <p className="ledger-message ledger-error" role="alert">{dbError.message}</p>}
    <section className="ledger-panel"><h2>Invite students</h2><p>Invited students receive a link to set a password or connect Google.</p><form action={inviteStudent} className="ledger-inline"><label>Email <input name="email" type="email" required placeholder="student@example.edu" /></label><button type="submit">Send invitation</button></form></section>
    <section className="ledger-panel"><h2>Courses</h2><div className="ledger-table-scroll"><table><thead><tr><th>Code</th><th>Title</th><th>Year</th><th>Assessments</th></tr></thead><tbody>{courses.map((c) => <tr key={c.id}><td>{c.code}</td><td>{c.title}</td><td>{years.find((y) => y.id === c.year_level_id)?.name}</td><td>{assessments.filter((a) => a.course_id === c.id).length}</td></tr>)}</tbody></table></div>
      <details className="ledger-details"><summary>Add course</summary><CourseForm years={years} /></details>
      {courses.map((c) => <details className="ledger-details" key={c.id}><summary>Edit {c.code}</summary><CourseForm years={years} course={c} /></details>)}
    </section>
    <section className="ledger-panel"><h2>Assessments</h2><div className="ledger-table-scroll"><table><thead><tr><th>Course</th><th>Assessment</th><th>Published items</th><th>Availability</th></tr></thead><tbody>{assessments.map((a) => <tr key={a.id}><td>{courses.find((c) => c.id === a.course_id)?.code}</td><td>{a.label}</td><td>{count(a.id)}</td><td>{count(a.id) ? 'Open' : 'Locked'}</td></tr>)}</tbody></table></div>
      <details className="ledger-details"><summary>Add assessment</summary><AssessmentForm courses={courses} /></details>
      {assessments.map((a) => <details className="ledger-details" key={a.id}><summary>Edit {a.label} · {courses.find((c) => c.id === a.course_id)?.code}</summary><AssessmentForm courses={courses} assessment={a} /></details>)}
    </section>
    <section className="ledger-panel"><div className="ledger-section-head"><h2>Questions</h2><Link className="ledger-button" href="/admin/questions/new">New question</Link></div><form action="/admin" method="get" className="ledger-inline"><label>Find question <input type="search" name="q" defaultValue={params.q ?? ''} placeholder="ID or topic" /></label><button type="submit">Search</button></form><div className="ledger-table-scroll"><table><thead><tr><th>ID</th><th>Course</th><th>Topic</th><th>Type</th><th>Status</th><th>Bank count</th></tr></thead><tbody>{visible.map((q) => <tr key={q.id}><td><Link href={`/admin/questions/${encodeURIComponent(q.id)}`}>{q.id}</Link></td><td>{courses.find((c) => c.id === q.course_id)?.code}</td><td>{q.topic}</td><td>{q.qtype}</td><td><span className={`ledger-status ledger-${q.status}`}>{q.status}</span></td><td>{banks.filter((item) => item.question_id === q.id).length}</td></tr>)}</tbody></table></div></section>
  </div></main>
}

type Year = { id: string; name: string }
type Course = { id: string; year_level_id: string; code: string; title: string; alias: string | null; slug: string }
type Assessment = { id: string; course_id: string; kind: string; number: number | null; exam: string | null; label: string; slug: string; ordinal: number; modules: number[] }

function CourseForm({ years, course }: { years: Year[]; course?: Course }) {
  return <form action={saveCourse} className="ledger-form ledger-grid">{course && <input type="hidden" name="id" value={course.id} />}<label>Year <select name="year_level_id" defaultValue={course?.year_level_id}>{years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></label><label>Code <input name="code" required defaultValue={course?.code} placeholder="IT0123" /></label><label>Title <input name="title" required defaultValue={course?.title} /></label><label>Alias <input name="alias" defaultValue={course?.alias ?? ''} /></label><label>URL slug <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={course?.slug} /></label><button type="submit">{course ? 'Save course' : 'Add course'}</button></form>
}

function AssessmentForm({ courses, assessment }: { courses: Course[]; assessment?: Assessment }) {
  return <form action={saveAssessment} className="ledger-form ledger-grid">{assessment && <input type="hidden" name="id" value={assessment.id} />}<label>Course <select name="course_id" defaultValue={assessment?.course_id}>{courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label><label>Type <select name="kind" defaultValue={assessment?.kind ?? 'summative'}><option value="summative">Summative</option><option value="major">Major exam</option></select></label><label>SA number <input name="number" type="number" min="1" defaultValue={assessment?.number ?? ''} /></label><label>Exam <select name="exam" defaultValue={assessment?.exam ?? ''}><option value="">None</option><option value="midterm">Midterm</option><option value="final">Final</option></select></label><label>Label <input name="label" required defaultValue={assessment?.label} /></label><label>URL slug <input name="slug" required defaultValue={assessment?.slug} /></label><label>Order <input name="ordinal" required type="number" min="1" defaultValue={assessment?.ordinal ?? 1} /></label><label>Modules, comma separated <input name="modules" required defaultValue={assessment?.modules?.join(',') ?? '1,2,3,4'} /></label><button type="submit">{assessment ? 'Save assessment' : 'Add assessment'}</button></form>
}
