export type StaticAssessment = {
  slug: string
  label: string
  ordinal: number
  locked: boolean
  questionCount: number
}

export type StaticCourse = {
  slug: string
  code: string
  title: string
  alias: string
  planet: { primary: string; glow: string; seed: number }
  assessments: StaticAssessment[]
}

export type StaticYear = {
  ordinal: number
  name: string
  courses: StaticCourse[]
}

export const staticCatalog: StaticYear[] = [
  { ordinal: 1, name: '1st Year', courses: [] },
  { ordinal: 2, name: '2nd Year', courses: [] },
  {
    ordinal: 3,
    name: '3rd Year',
    courses: [
      {
        slug: 'it0123',
        code: 'IT0123',
        title: 'DEVELOPMENT NETWORK',
        alias: 'Networking and Communications 2',
        planet: { primary: '#08756B', glow: '#2457C5', seed: 42 },
        assessments: [
          { slug: 'sa1', label: 'SA1', ordinal: 1, locked: true, questionCount: 0 },
          { slug: 'sa2', label: 'SA2', ordinal: 2, locked: false, questionCount: 50 },
          { slug: 'midterm', label: 'Midterm Exam', ordinal: 3, locked: false, questionCount: 89 },
          { slug: 'sa3', label: 'SA3', ordinal: 4, locked: true, questionCount: 0 },
          { slug: 'final', label: 'Final Exam', ordinal: 5, locked: true, questionCount: 0 },
        ],
      },
    ],
  },
  { ordinal: 4, name: '4th Year', courses: [] },
]

export function findYear(ordinal: number) {
  return staticCatalog.find((y) => y.ordinal === ordinal)
}

export function findCourse(courseSlug: string) {
  for (const year of staticCatalog) {
    const course = year.courses.find((c) => c.slug === courseSlug)
    if (course) return { year, course }
  }
  return null
}
