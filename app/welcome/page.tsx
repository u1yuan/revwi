import { redirect } from 'next/navigation'
import { linkGoogle, setPassword } from '@/app/actions/auth'
import { requireUser } from '@/lib/server/auth'

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user } = await requireUser()
  if (!user.email) redirect('/sign-in')
  const { error } = await searchParams
  return (
    <main className="void-surface" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ background: '#fff', color: '#14243A', padding: 32, borderRadius: 12, maxWidth: 440, width: '100%' }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Set up your Revwi account</h1>
        <p style={{ marginBottom: 20 }}>Invitation accepted for {user.email}. Choose a password, connect Google, or both.</p>
        {error && <p role="alert" style={{ color: '#AD2540' }}>Could not complete that step. Check your password or Google settings and try again.</p>}
        <form action={setPassword} style={{ display: 'grid', gap: 12 }}>
          <label htmlFor="password">Password, at least 8 characters</label>
          <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required style={{ padding: 12, border: '1px solid #64748b', borderRadius: 8 }} />
          <button type="submit" style={{ padding: 12, borderRadius: 8, background: '#2457C5', color: '#fff' }}>Save password</button>
        </form>
        <form action={linkGoogle} style={{ marginTop: 12 }}>
          <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #64748b' }}>Connect Google account</button>
        </form>
        <a href="/" style={{ display: 'inline-block', marginTop: 20 }}>Continue to Revwi</a>
      </div>
    </main>
  )
}
