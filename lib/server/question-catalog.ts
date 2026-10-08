import 'server-only'
import { questions, type Question } from '@/src/questions'
import { publicQuestionSchema, type PublicQuestion } from '@/lib/domain/public-question'

export function publicFromLocal(question: Question): PublicQuestion {
  const common = { id: question.id, module: question.module, topic: question.topic, prompt: question.prompt,
    citations: question.citations, ...(question.code ? { code: question.code } : {}),
    ...(question.exhibit ? { exhibit: question.exhibit } : {}), ...(question.edit ? { edit: question.edit } : {}) }
  return publicQuestionSchema.parse(question.type === 'matching'
    ? { ...common, type: 'matching', targets: question.targets, pairs: question.pairs.map(({ term }) => ({ term })) }
    : { ...common, type: question.type, choices: question.choices, requiredCount: question.correct.length })
}

export function publicFromRow(row: any): PublicQuestion {
  const payload = row.payload as Record<string, unknown>
  return publicQuestionSchema.parse({
    id: row.id, module: row.module, topic: row.topic, prompt: row.prompt, type: row.qtype,
    citations: row.citations, exhibit: row.exhibit_path ? { src: row.exhibit_path, alt: row.prompt, credit: '' } : undefined,
    code: payload.code, edit: payload.edit,
    choices: payload.choices, requiredCount: payload.requiredCount,
    targets: payload.targets, pairs: payload.pairs,
  })
}

export function localBank(assessment: string): PublicQuestion[] {
  const selected = assessment === 'sa2' ? questions.filter((q) => q.source.assessment === 'Summative Assessment 2') : questions.filter((q) => q.source.assessment === 'Midterm Exam')
  return selected.map(publicFromLocal)
}
