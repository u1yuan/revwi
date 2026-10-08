import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { curationRecords } from '../src/curation.ts'
import { questions } from '../src/questions.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(curationRecords.length === 149, `Expected 149 curation records, received ${curationRecords.length}`)

const sourceKeys = new Set<string>()
for (const record of curationRecords) {
  const sourceKey = `${record.assessment}:${record.sourceNumber}`
  assert(!sourceKeys.has(sourceKey), `Duplicate curation source ${sourceKey}`)
  sourceKeys.add(sourceKey)
}

const ids = new Set<string>()
for (const question of questions) {
  assert(!ids.has(question.id), `Duplicate playable ID ${question.id}`)
  ids.add(question.id)
  assert(question.module >= 1 && question.module <= 4, `${question.id} has an invalid module`)
  assert(question.prompt.trim().length > 0, `${question.id} has no prompt`)
  assert(question.explanation.trim().length > 0, `${question.id} has no explanation`)
  assert(question.citations.length > 0, `${question.id} has no citations`)
  assert(question.citations.every((citation) => citation.label && citation.href), `${question.id} has an invalid citation`)
  if (question.type === 'matching') {
    assert(question.targets.length > 0 && question.pairs.length > 0, `${question.id} has an incomplete matching key`)
    assert(question.pairs.every((pair) => pair.target >= 0 && pair.target < question.targets.length), `${question.id} has an invalid matching target`)
  } else {
    assert(question.choices.length >= 2, `${question.id} has fewer than two choices`)
    assert(question.correct.length > 0, `${question.id} has no answer key`)
    assert(new Set(question.correct).size === question.correct.length, `${question.id} repeats a correct choice`)
    assert(question.correct.every((index) => index >= 0 && index < question.choices.length), `${question.id} has an invalid correct index`)
  }
  if (question.exhibit) {
    assert(question.exhibit.src.startsWith('/exhibits/'), `${question.id} does not use a local exhibit`)
    const exhibitPath = fileURLToPath(new URL(`../public${question.exhibit.src}`, import.meta.url))
    assert(existsSync(exhibitPath), `${question.id} exhibit is missing at ${exhibitPath}`)
    assert(question.exhibit.alt.trim().length > 0, `${question.id} exhibit has no alt text`)
  }
}

const included = curationRecords.filter((record) => record.status === 'included')
assert(included.length === questions.length, `Included records (${included.length}) do not match questions (${questions.length})`)
for (const record of included) assert(record.canonicalQuestionId && ids.has(record.canonicalQuestionId), `Included source has no canonical question: ${record.assessment} ${record.sourceNumber}`)
for (const record of curationRecords.filter((item) => item.status === 'duplicate')) assert(record.duplicateOf && ids.has(record.duplicateOf), `Duplicate source has an invalid target: ${record.assessment} ${record.sourceNumber}`)
for (const record of curationRecords.filter((item) => item.status === 'excluded')) assert(record.exclusionReason, `Excluded source has no reason: ${record.assessment} ${record.sourceNumber}`)

const counts = curationRecords.reduce<Record<string, number>>((total, record) => {
  total[record.status] = (total[record.status] ?? 0) + 1
  return total
}, {})

console.log(`Bank validated: ${questions.length} playable, ${counts.duplicate} duplicates, ${counts.excluded} excluded, 149 source positions.`)
