import Link from 'next/link'
import { staticCatalog } from '@/lib/catalog/static'

export default function AdminHomePage() {
  const course = staticCatalog.find((y) => y.ordinal === 3)?.courses[0]
  return (
    <div className="chronicle-surface" style={{ minHeight: '100dvh', padding: 32 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Revwi admin</h1>
        <p style={{ marginBottom: 24, maxWidth: '65ch' }}>
          Manage courses, assessments, and question banks. Publishing requires a key, explanation, and citation.
        </p>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Courses</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #D8E0EA' }}>
                <th style={{ padding: 8 }}>Code</th>
                <th style={{ padding: 8 }}>Title</th>
                <th style={{ padding: 8 }}>Year</th>
              </tr>
            </thead>
            <tbody>
              {course ? (
                <tr style={{ borderBottom: '1px solid #EEF2F7' }}>
                  <td style={{ padding: 8 }}>{course.code}</td>
                  <td style={{ padding: 8 }}>{course.title}</td>
                  <td style={{ padding: 8 }}>3rd Year</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Assessments</h2>
          <ul style={{ paddingLeft: 20 }}>
            {course?.assessments.map((a) => (
              <li key={a.slug} style={{ marginBottom: 6 }}>
                {a.label} {a.locked ? '(empty)' : `(${a.questionCount} questions seeded locally)`}
              </li>
            ))}
          </ul>
        </section>
        <p style={{ marginTop: 32 }}>
          <Link href="/" style={{ color: '#2457C5' }}>
            Back to multiverse
          </Link>
        </p>
      </div>
    </div>
  )
}
