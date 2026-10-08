import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash')
  if (!tokenHash || url.searchParams.get('type') !== 'invite') {
    return NextResponse.redirect(new URL('/sign-in?error=invite', url))
  }
  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' })
  if (error || !data.user) return NextResponse.redirect(new URL('/sign-in?error=invite', url))
  const { data: profile } = await supabase.from('profiles').select('user_id').eq('user_id', data.user.id).maybeSingle()
  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/sign-in?error=invite-required', url))
  }
  return NextResponse.redirect(new URL('/welcome', url))
}
