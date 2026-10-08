import test from 'node:test'
import assert from 'node:assert/strict'
import { bestStreakForEntries, buildQuestionOrder, score } from '../lib/domain/quiz-core.ts'

const multiple = { type: 'multiple' as const, choices: ['A', 'B', 'C', 'D'] }
const matching = { type: 'matching' as const, pairs: [{ term: 'one' }, { term: 'two' }], targets: ['first', 'second'] }

test('multiple choice earns a point only for the exact set', () => {
  assert.equal(score(multiple, [2, 0], [0, 2]), true)
  assert.equal(score(multiple, [0], [0, 2]), false)
  assert.equal(score(multiple, [0, 1], [0, 2]), false)
  assert.equal(score(multiple, [0, 0], [0, 2]), false)
  assert.equal(score(multiple, [], [0, 2]), false)
})

test('matching requires every target in the proper pair', () => {
  assert.equal(score(matching, [1, 0], [1, 0]), true)
  assert.equal(score(matching, [0, 1], [1, 0]), false)
  assert.equal(score(matching, [1], [1, 0]), false)
})

test('a wrong answer or skip resets the best streak', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f']
  const entries = Object.fromEntries(ids.map((id, i) => [id, { answer: i === 3 ? [] : [0], skipped: i === 3, correct: i !== 3 && i !== 5 }]))
  assert.equal(bestStreakForEntries(ids, entries), 3)
})

test('unseen questions lead and seen questions follow oldest recency', () => {
  const order = buildQuestionOrder(['recent', 'new', 'old', 'new'], 4, {
    recent: { seenCount: 4, lastSeenAt: '2026-10-08T00:00:00Z' },
    old: { seenCount: 1, lastSeenAt: '2026-09-01T00:00:00Z' },
  }, () => 0.5)
  assert.deepEqual(order, ['new', 'old', 'recent'])
})
