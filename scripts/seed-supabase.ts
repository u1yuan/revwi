import { createClient } from '@supabase/supabase-js'
import { questions } from '../src/questions.ts'
import { curationRecords } from '../src/curation.ts'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const { data: years } = await supabase.from('year_levels').select('id, ordinal')
  if (!years?.length) {
    await supabase.from('year_levels').insert([
      { ordinal: 1, name: '1st Year' },
      { ordinal: 2, name: '2nd Year' },
      { ordinal: 3, name: '3rd Year' },
      { ordinal: 4, name: '4th Year' },
    ])
  }

  const { data: year3 } = await supabase.from('year_levels').select('id').eq('ordinal', 3).single()
  if (!year3) throw new Error('Missing 3rd year row')

  let { data: course } = await supabase.from('courses').select('id').eq('slug', 'it0123').maybeSingle()
  if (!course) {
    const { data: inserted, error } = await supabase
      .from('courses')
      .insert({
        year_level_id: year3.id,
        code: 'IT0123',
        title: 'DEVELOPMENT NETWORK',
        alias: 'Networking and Communications 2',
        slug: 'it0123',
        planet: { primary: '#08756B', glow: '#2457C5', seed: 42 },
      })
      .select('id')
      .single()
    if (error) throw error
    course = inserted
  }

  const assessmentDefs = [
    { kind: 'summative', number: 1, exam: null, label: 'SA1', ordinal: 1, slug: 'sa1' },
    { kind: 'summative', number: 2, exam: null, label: 'SA2', ordinal: 2, slug: 'sa2' },
    { kind: 'major', number: null, exam: 'midterm', label: 'Midterm Exam', ordinal: 3, slug: 'midterm' },
    { kind: 'summative', number: 3, exam: null, label: 'SA3', ordinal: 4, slug: 'sa3' },
    { kind: 'major', number: null, exam: 'final', label: 'Final Exam', ordinal: 5, slug: 'final' },
  ] as const

  for (const def of assessmentDefs) {
    await supabase.from('assessments').upsert(
      { course_id: course.id, ...def, modules: [1, 2, 3, 4] },
      { onConflict: 'course_id,slug' },
    )
  }

  const { data: assessmentRows, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, slug')
    .eq('course_id', course.id)
  if (assessmentError) throw assessmentError

  const assessmentIdBySlug = new Map(assessmentRows?.map((row) => [row.slug, row.id]) ?? [])
  const assessmentSlugByLabel: Record<string, string> = {
    'Midterm Exam': 'midterm',
    'Summative Assessment 2': 'sa2',
  }

  for (const question of questions) {
    const payload =
      question.type === 'matching'
        ? { targets: question.targets, pairs: question.pairs }
        : { choices: question.choices, correct: question.correct }

    const { error: questionError } = await supabase.from('questions').upsert({
      id: question.id,
      course_id: course.id,
      status: 'published',
      module: question.module,
      topic: question.topic,
      qtype: question.type,
      prompt: question.prompt,
      payload,
      citations: question.citations,
      exhibit_path: question.exhibit?.src ?? null,
    })
    if (questionError) throw questionError

    const { error: keyError } = await supabase.from('question_keys').upsert({
      question_id: question.id,
      correct: question.type === 'matching' ? question.pairs.map((p) => p.target) : question.correct,
      explanation: question.explanation,
    })
    if (keyError) throw keyError
  }

  const included = curationRecords.filter((r) => r.status === 'included')
  for (const record of included) {
    const slug = assessmentSlugByLabel[record.assessment]
    const assessmentId = slug ? assessmentIdBySlug.get(slug) : undefined
    const questionId = record.canonicalQuestionId
    if (!slug || !assessmentId || !questionId) {
      throw new Error(`Cannot link bank item for ${record.assessment} #${record.sourceNumber}`)
    }
    const { error } = await supabase.from('bank_items').upsert(
      {
        assessment_id: assessmentId,
        question_id: questionId,
        source_number: record.sourceNumber,
      },
      { onConflict: 'assessment_id,question_id' },
    )
    if (error) throw error
  }

  console.log(`Seeded ${questions.length} questions and ${included.length} bank_items.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
