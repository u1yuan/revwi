'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/server/auth'

const credentials = z.object({ email: z.email(), password: z.string().min(1) })
const passwordSchema = z.string().min(8).max(72)

function siteOrigin(headersList: Headers) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, '')
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  if (!host) throw new Error('Missing site host')
  return `${protocol}://${host}`
}

export async function signIn(formData: FormData) {
  const parsed = credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) redirect('/sign-in?error=credentials')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.user) redirect('/sign-in?error=credentials')
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', data.user.id).maybeSingle()
  if (!profile) {
    await supabase.auth.signOut()
    redirect('/sign-in?error=invite-required')
  }
  redirect(profile.role === 'admin' ? '/admin' : '/')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = siteOrigin(await headers())
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: `${origin}/auth/callback` },
  })
  if (error || !data.url) redirect('/sign-in?error=google')
  redirect(data.url)
}

export async function setPassword(formData: FormData) {
  const parsed = passwordSchema.safeParse(formData.get('password'))
  if (!parsed.success) redirect('/welcome?error=password')
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) redirect('/welcome?error=password')
  redirect('/')
}

export async function linkGoogle() {
  await requireUser()
  const supabase = await createClient()
  const origin = siteOrigin(await headers())
  const { data, error } = await supabase.auth.linkIdentity({
    provider: 'google', options: { redirectTo: `${origin}/auth/callback?next=/welcome` },
  })
  if (error || !data.url) redirect('/welcome?error=google')
  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
