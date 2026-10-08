import 'server-only'

import { requireUser } from '@/lib/server/auth'
import { supabaseConfigured } from '@/lib/supabase/env'
import { staticCatalog, type StaticYear } from './static'

/** Student-visible catalog. RLS and the explicit published filter govern bank counts. */
export async function getCatalog(): Promise<StaticYear[]> {
  if (!supabaseConfigured()) return staticCatalog

  const { supabase } = await requireUser()
  const [yearsResult, coursesResult, assessmentsResult, bankResult] = await Promise.all([
    supabase.from('year_levels').select('id,ordinal,name').order('ordinal'),
    supabase.from('courses').select('id,year_level_id,slug,code,title,alias,planet').order('code'),
    supabase.from('assessments').select('id,course_id,slug,label,ordinal').order('ordinal'),
    supabase.from('bank_items').select('assessment_id,questions!inner(id,status)').eq('questions.status', 'published'),
  ])
  for (const result of [yearsResult, coursesResult, assessmentsResult, bankResult]) {
    if (result.error) throw new Error(`Catalog query failed: ${result.error.message}`)
  }

  const counts = new Map<string, number>()
  for (const item of bankResult.data ?? []) {
    counts.set(item.assessment_id, (counts.get(item.assessment_id) ?? 0) + 1)
  }

  return (yearsResult.data ?? []).map((year) => ({
    ordinal: year.ordinal,
    name: year.name,
    courses: (coursesResult.data ?? [])
      .filter((course) => course.year_level_id === year.id)
      .map((course) => ({
        slug: course.slug,
        code: course.code,
        title: course.title,
        alias: course.alias ?? '',
        planet: { primary: '#08756B', glow: '#2457C5', seed: 42 },
        assessments: (assessmentsResult.data ?? [])
          .filter((assessment) => assessment.course_id === course.id)
          .map((assessment) => {
            const questionCount = counts.get(assessment.id) ?? 0
            return {
              slug: assessment.slug,
              label: assessment.label,
              ordinal: assessment.ordinal,
              locked: questionCount === 0,
              questionCount,
            }
          }),
      })),
  }))
}

export async function getYear(ordinal: number) {
  return (await getCatalog()).find((year) => year.ordinal === ordinal)
}

export async function getCourse(slug: string) {
  for (const year of await getCatalog()) {
    const course = year.courses.find((candidate) => candidate.slug === slug)
    if (course) return { year, course }
  }
  return null
}
