import 'server-only'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/sign-in')
  const { data: profile } = await supabase.from('profiles').select('role, display_name').eq('user_id', user.id).maybeSingle()
  if (!profile) redirect('/sign-in?error=invite-required')
  return { user, profile, supabase }
}

export async function requireAdmin() {
  const context = await requireUser()
  if (context.profile.role !== 'admin') redirect('/')
  return context
}
