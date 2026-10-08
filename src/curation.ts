import { questions } from './questions.ts'

export type CurationStatus = 'included' | 'duplicate' | 'excluded'

export type CurationRecord = {
  assessment: 'Midterm Exam' | 'Summative Assessment 2'
  sourceNumber: number
  status: CurationStatus
  module: 1 | 2 | 3 | 4
  canonicalQuestionId?: string
  duplicateOf?: string
  edits?: string
  exclusionReason?: string
}

const key = (assessment: CurationRecord['assessment'], number: number) => `${assessment}:${number}`

const duplicates: Record<string, { duplicateOf: string; edits?: string }> = {
  [key('Midterm Exam', 36)]: { duplicateOf: 'midterm-027', edits: 'Same Code Exchange purpose and sample-code repository fact.' },
  [key('Midterm Exam', 39)]: { duplicateOf: 'midterm-038', edits: 'Same Code Exchange and GitHub-source fact.' },
  [key('Midterm Exam', 45)]: { duplicateOf: 'midterm-034', edits: 'Same preconfigured DevNet Sandbox environment fact.' },
  [key('Midterm Exam', 50)]: { duplicateOf: 'midterm-027', edits: 'Same Code Exchange sample-code repository fact.' },
  [key('Midterm Exam', 90)]: { duplicateOf: 'midterm-083', edits: 'Same always-running HTTP POST webhook requirement.' },
  [key('Midterm Exam', 99)]: { duplicateOf: 'midterm-085', edits: 'GET-as-read repeats the canonical GET retrieval item.' },
  [key('Summative Assessment 2', 1)]: { duplicateOf: 'midterm-052' },
  [key('Summative Assessment 2', 4)]: { duplicateOf: 'midterm-051' },
  [key('Summative Assessment 2', 13)]: { duplicateOf: 'midterm-058' },
  [key('Summative Assessment 2', 15)]: { duplicateOf: 'midterm-056' },
  [key('Summative Assessment 2', 17)]: { duplicateOf: 'midterm-061' },
  [key('Summative Assessment 2', 18)]: { duplicateOf: 'midterm-057' },
  [key('Summative Assessment 2', 20)]: { duplicateOf: 'midterm-063' },
  [key('Summative Assessment 2', 24)]: { duplicateOf: 'midterm-004', edits: 'Choice order differs; the question and answer are otherwise equivalent.' },
  [key('Summative Assessment 2', 25)]: { duplicateOf: 'midterm-053' },
  [key('Summative Assessment 2', 26)]: { duplicateOf: 'midterm-088' },
  [key('Summative Assessment 2', 28)]: { duplicateOf: 'midterm-083' },
  [key('Summative Assessment 2', 31)]: { duplicateOf: 'midterm-087' },
  [key('Summative Assessment 2', 38)]: { duplicateOf: 'midterm-089' },
  [key('Summative Assessment 2', 46)]: { duplicateOf: 'midterm-076' },
  [key('Summative Assessment 2', 47)]: { duplicateOf: 'midterm-078' },
  [key('Summative Assessment 2', 48)]: { duplicateOf: 'midterm-079' },
  [key('Summative Assessment 2', 50)]: { duplicateOf: 'midterm-085' },
}

const exclusions: Record<string, string> = {
  [key('Midterm Exam', 29)]: 'The phrase “mimics the overall DevNet site for training” is not defined by a current official source and leaves the intended resource ambiguous.',
  [key('Midterm Exam', 30)]: 'The “over 1,500 solutions” statistic is time-sensitive and no longer identifies one exchange reliably.',
  [key('Midterm Exam', 33)]: 'Both the historical Automation Exchange and Code Exchange descriptions can fit “sharing automation scripts,” so there is no unique verified key.',
  [key('Midterm Exam', 43)]: 'Case-based ticket sales ended in 2022, so the exported contracted-response-time question is obsolete.',
}

function moduleFor(assessment: CurationRecord['assessment'], number: number): CurationRecord['module'] {
  if (assessment === 'Summative Assessment 2') return number <= 25 ? 3 : 4
  if (number <= 25) return 1
  if (number <= 50) return 2
  if (number <= 74) return 3
  return 4
}

const includedBySource = new Map(questions.map((question) => [key(question.source.assessment, question.source.number), question]))

function makeRecord(assessment: CurationRecord['assessment'], sourceNumber: number): CurationRecord {
  const sourceKey = key(assessment, sourceNumber)
  const module = moduleFor(assessment, sourceNumber)
  const duplicate = duplicates[sourceKey]
  if (duplicate) return { assessment, sourceNumber, status: 'duplicate', module, ...duplicate }

  const exclusionReason = exclusions[sourceKey]
  if (exclusionReason) return { assessment, sourceNumber, status: 'excluded', module, exclusionReason }

  const question = includedBySource.get(sourceKey)
  if (!question) throw new Error(`Missing curation decision for ${sourceKey}`)
  return {
    assessment,
    sourceNumber,
    status: 'included',
    module,
    canonicalQuestionId: question.id,
    ...(question.edit ? { edits: question.edit } : {}),
  }
}

export const curationRecords: CurationRecord[] = [
  ...Array.from({ length: 99 }, (_, index) => makeRecord('Midterm Exam', index + 1)),
  ...Array.from({ length: 50 }, (_, index) => makeRecord('Summative Assessment 2', index + 1)),
]
