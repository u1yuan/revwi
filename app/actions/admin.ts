'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/server/auth'
import { createGradingClient } from '@/lib/server/grading'

const text = z.string().trim().min(1)
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

function field(form: FormData, name: string) {
  return String(form.get(name) ?? '')
}

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`)
}

function done(path: string, message: string): never {
  revalidatePath('/admin')
  revalidatePath('/')
  redirect(`${path}${path.includes('?') ? '&' : '?'}notice=${encodeURIComponent(message)}`)
}

const courseSchema = z.object({
  id: z.string().uuid().optional(),
  year_level_id: z.string().uuid(),
  code: text.max(24),
  title: text.max(160),
  alias: z.string().trim().max(160),
  slug,
})

export async function saveCourse(form: FormData) {
  const parsed = courseSchema.safeParse({
    id: field(form, 'id') || undefined,
    year_level_id: field(form, 'year_level_id'),
    code: field(form, 'code'),
    title: field(form, 'title'),
    alias: field(form, 'alias'),
    slug: field(form, 'slug'),
  })
  if (!parsed.success) fail('/admin', parsed.error.issues[0]?.message ?? 'Invalid course')
  const { supabase } = await requireAdmin()
  const { id, ...values } = parsed.data
  const result = id
    ? await supabase.from('courses').update(values).eq('id', id)
    : await supabase.from('courses').insert(values)
  if (result.error) fail('/admin', result.error.message)
  done('/admin', id ? 'Course updated' : 'Course created')
}

const assessmentSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  kind: z.enum(['summative', 'major']),
  number: z.coerce.number().int().positive().optional(),
  exam: z.enum(['midterm', 'final']).optional(),
  label: text.max(100),
  slug,
  ordinal: z.coerce.number().int().positive(),
  modules: z.array(z.number().int().min(1).max(4)).min(1),
}).superRefine((value, ctx) => {
  if (value.kind === 'summative' && (!value.number || value.exam)) ctx.addIssue({ code: 'custom', message: 'Summative assessments need a number only' })
  if (value.kind === 'major' && (!value.exam || value.number)) ctx.addIssue({ code: 'custom', message: 'Major exams need an exam type only' })
})

export async function saveAssessment(form: FormData) {
  const modules = field(form, 'modules').split(',').map((part) => Number(part.trim())).filter(Boolean)
  const parsed = assessmentSchema.safeParse({
    id: field(form, 'id') || undefined,
    course_id: field(form, 'course_id'),
    kind: field(form, 'kind'),
    number: field(form, 'number') || undefined,
    exam: field(form, 'exam') || undefined,
    label: field(form, 'label'),
    slug: field(form, 'slug'),
    ordinal: field(form, 'ordinal'),
    modules,
  })
  if (!parsed.success) fail('/admin', parsed.error.issues[0]?.message ?? 'Invalid assessment')
  const { supabase } = await requireAdmin()
  const { id, ...data } = parsed.data
  const values = { ...data, number: data.kind === 'summative' ? data.number : null, exam: data.kind === 'major' ? data.exam : null }
  const result = id
    ? await supabase.from('assessments').update(values).eq('id', id)
    : await supabase.from('assessments').insert(values)
  if (result.error) fail('/admin', result.error.message)
  done('/admin', id ? 'Assessment updated' : 'Assessment created')
}

const citationSchema = z.object({ label: text, href: text })
const questionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  course_id: z.string().uuid(),
  module: z.coerce.number().int().min(1).max(4),
  topic: text.max(160),
  qtype: z.enum(['single', 'multiple', 'matching']),
  prompt: text,
  choices: z.array(text).optional(),
  terms: z.array(text).optional(),
  targets: z.array(text).optional(),
  correct: z.array(z.number().int().nonnegative()).min(1),
  explanation: text,
  citations: z.array(citationSchema).min(1),
  exhibit_path: z.string().trim().optional(),
  code: z.string().optional(),
  edit: z.string().optional(),
}).superRefine((value, ctx) => {
  const options = value.qtype === 'matching' ? value.targets : value.choices
  if (!options || options.length < 2) ctx.addIssue({ code: 'custom', message: 'At least two choices or targets are required' })
  if (value.qtype === 'matching' && (!value.terms?.length || value.correct.length !== value.terms.length)) ctx.addIssue({ code: 'custom', message: 'Each matching term needs a target index' })
  if (value.qtype === 'single' && value.correct.length !== 1) ctx.addIssue({ code: 'custom', message: 'Single choice needs one answer index' })
  if (value.qtype === 'multiple' && value.correct.length < 2) ctx.addIssue({ code: 'custom', message: 'Multiple choice needs at least two answer indices' })
  if (value.qtype !== 'matching' && new Set(value.correct).size !== value.correct.length) ctx.addIssue({ code: 'custom', message: 'Choice answers must be distinct' })
  if (options && value.correct.some((index) => index >= options.length)) ctx.addIssue({ code: 'custom', message: 'Answer index exceeds the available options' })
})

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

export async function saveQuestion(form: FormData) {
  const id = field(form, 'id') || `admin-${randomUUID()}`
  const path = field(form, 'id') ? `/admin/questions/${encodeURIComponent(id)}` : '/admin/questions/new'
  const citations = lines(field(form, 'citations')).map((line) => {
    const separator = line.indexOf(' | ')
    return separator === -1 ? { label: '', href: '' } : { label: line.slice(0, separator), href: line.slice(separator + 3) }
  })
  const parsed = questionSchema.safeParse({
    id,
    course_id: field(form, 'course_id'),
    module: field(form, 'module'),
    topic: field(form, 'topic'),
    qtype: field(form, 'qtype'),
    prompt: field(form, 'prompt'),
    choices: lines(field(form, 'choices')),
    terms: lines(field(form, 'terms')),
    targets: lines(field(form, 'targets')),
    correct: field(form, 'correct').split(',').map((part) => Number(part.trim()) - 1),
    explanation: field(form, 'explanation'),
    citations,
    exhibit_path: field(form, 'exhibit_path'),
    code: field(form, 'code'),
    edit: field(form, 'edit'),
  })
  if (!parsed.success) fail(path, parsed.error.issues[0]?.message ?? 'Invalid question')
  const { supabase } = await requireAdmin()
  const question = parsed.data
  const payload = question.qtype === 'matching'
    ? { targets: question.targets, pairs: question.terms?.map((term) => ({ term })), edit: question.edit || undefined }
    : { choices: question.choices, requiredCount: question.correct.length, code: question.code || undefined, edit: question.edit || undefined }
  const { data: existing, error: readError } = await supabase.from('questions').select('status').eq('id', question.id).maybeSingle()
  if (readError) fail(path, readError.message)
  // Demote before changing content or keys, then require an explicit publish action.
  if (existing?.status === 'published') {
    const { error } = await supabase.from('questions').update({ status: 'verified' }).eq('id', question.id)
    if (error) fail(path, error.message)
  }
  const { error: questionError } = await supabase.from('questions').upsert({
    id: question.id,
    course_id: question.course_id,
    status: !existing || existing.status === 'draft' ? 'draft' : 'verified',
    module: question.module,
    topic: question.topic,
    qtype: question.qtype,
    prompt: question.prompt,
    payload,
    citations: question.citations,
    exhibit_path: question.exhibit_path || null,
  })
  if (questionError) fail(path, questionError.message)
  const { error: keyError } = await supabase.from('question_keys').upsert({
    question_id: question.id,
    correct: question.correct,
    explanation: question.explanation,
  })
  if (keyError) fail(path, keyError.message)
  done(`/admin/questions/${encodeURIComponent(question.id)}`, 'Question saved; verify and publish when ready')
}

export async function setQuestionStatus(form: FormData) {
  const parsed = z.object({ id: text, status: z.enum(['draft', 'verified', 'published']) }).safeParse({
    id: field(form, 'id'), status: field(form, 'status'),
  })
  if (!parsed.success) fail('/admin', 'Invalid status change')
  const path = `/admin/questions/${encodeURIComponent(parsed.data.id)}`
  const { supabase } = await requireAdmin()
  if (parsed.data.status === 'published') {
    const { data: current, error: currentError } = await supabase.from('questions').select('status').eq('id', parsed.data.id).single()
    if (currentError || current?.status !== 'verified') fail(path, 'Mark this question verified before publishing')
  }
  const { error } = await supabase.from('questions').update({ status: parsed.data.status }).eq('id', parsed.data.id)
  if (error) fail(path, error.message)
  done(path, `Question ${parsed.data.status}`)
}

export async function setBankMembership(form: FormData) {
  const parsed = z.object({
    question_id: text,
    assessment_id: z.string().uuid(),
    source_number: z.coerce.number().int().nonnegative(),
    included: z.enum(['yes', 'no']),
  }).safeParse({
    question_id: field(form, 'question_id'),
    assessment_id: field(form, 'assessment_id'),
    source_number: field(form, 'source_number'),
    included: field(form, 'included'),
  })
  if (!parsed.success) fail('/admin', 'Invalid bank membership')
  const path = `/admin/questions/${encodeURIComponent(parsed.data.question_id)}`
  const { supabase } = await requireAdmin()
  const { question_id, assessment_id, source_number, included } = parsed.data
  const [questionResult, assessmentResult] = await Promise.all([
    supabase.from('questions').select('course_id').eq('id', question_id).single(),
    supabase.from('assessments').select('course_id').eq('id', assessment_id).single(),
  ])
  if (questionResult.error || assessmentResult.error || questionResult.data.course_id !== assessmentResult.data.course_id) fail(path, 'Question and assessment must belong to the same course')
  const result = included === 'yes'
    ? await supabase.from('bank_items').upsert({ question_id, assessment_id, source_number })
    : await supabase.from('bank_items').delete().eq('question_id', question_id).eq('assessment_id', assessment_id)
  if (result.error) fail(path, result.error.message)
  done(path, included === 'yes' ? 'Added to bank' : 'Removed from bank')
}

export async function inviteStudent(form: FormData) {
  const parsed = z.object({ email: z.email() }).safeParse({ email: field(form, 'email').trim().toLowerCase() })
  if (!parsed.success) fail('/admin', 'Enter a valid email address')
  await requireAdmin()
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? ''
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`
  const safeOrigin = z.url().safeParse(origin)
  if (!safeOrigin.success) fail('/admin', 'Invalid site URL')
  const { error } = await createGradingClient().auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${new URL(safeOrigin.data).origin}/auth/confirm`,
  })
  if (error) fail('/admin', error.message)
  done('/admin', `Invitation sent to ${parsed.data.email}`)
}
