import { z } from 'zod'

export const answerSchema = z.array(z.number().int().min(-1).max(1000)).max(100)

const citationSchema = z.object({ label: z.string(), href: z.string() })
const base = z.object({
  id: z.string(), module: z.number().int().min(1).max(4), topic: z.string(),
  prompt: z.string(), citations: z.array(citationSchema),
  code: z.string().optional(), exhibit: z.object({ src: z.string(), alt: z.string(), credit: z.string() }).optional(),
  edit: z.string().optional(),
})
export const publicQuestionSchema = z.discriminatedUnion('type', [
  base.extend({ type: z.literal('single'), choices: z.array(z.string()).min(2), requiredCount: z.literal(1) }),
  base.extend({ type: z.literal('multiple'), choices: z.array(z.string()).min(2), requiredCount: z.number().int().min(2) }),
  base.extend({ type: z.literal('matching'), targets: z.array(z.string()).min(2), pairs: z.array(z.object({ term: z.string() })).min(1) }),
])
export type PublicQuestion = z.infer<typeof publicQuestionSchema>

export function answerComplete(question: PublicQuestion, answer: number[]): boolean {
  if (question.type === 'matching') return answer.length === question.pairs.length && answer.every((n) => Number.isInteger(n) && n >= 0 && n < question.targets.length)
  return answer.length === question.requiredCount && new Set(answer).size === answer.length && answer.every((n) => Number.isInteger(n) && n >= 0 && n < question.choices.length)
}

export function answerText(question: PublicQuestion, answer: number[]): string {
  if (!answerComplete(question, answer)) return 'Skipped'
  return question.type === 'matching'
    ? question.pairs.map((pair, i) => `${pair.term} → ${question.targets[answer[i]]}`).join('; ')
    : answer.map((index) => question.choices[index]).join('; ')
}
