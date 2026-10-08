import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/sign-in?error=google', url))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(new URL('/sign-in?error=google', url))
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', data.user.id).maybeSingle()
  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/sign-in?error=invite-required', url))
  }
  const next = url.searchParams.get('next')
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : profile.role === 'admin' ? '/admin' : '/'
  return NextResponse.redirect(new URL(destination, url))
}
