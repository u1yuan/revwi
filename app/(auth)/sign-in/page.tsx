import { signIn, signInWithGoogle } from '@/app/actions/auth'

const messages: Record<string, string> = {
  credentials: 'Check your email and password, then try again.',
  google: 'Google sign-in could not finish. Try again or use your password.',
  invite: 'The invitation link is invalid or expired. Ask an admin to invite you again.',
  'invite-required': 'Revwi is invitation only. Open your invitation email before signing in.',
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="void-surface" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div
        style={{
          background: '#fff',
          color: '#14243A',
          padding: 32,
          borderRadius: 12,
          maxWidth: 440,
          width: '100%',
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Sign in to Revwi</h1>
        <p style={{ marginBottom: 18 }}>Open your invitation email first to set up your account.</p>
        {error && <p role="alert" style={{ color: '#AD2540', marginBottom: 16 }}>{messages[error] ?? 'Sign-in failed. Try again.'}</p>}
        <form action={signIn} style={{ display: 'grid', gap: 12 }}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required style={{ padding: 12, border: '1px solid #64748b', borderRadius: 8 }} />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required style={{ padding: 12, border: '1px solid #64748b', borderRadius: 8 }} />
          <button type="submit" style={{ padding: 12, borderRadius: 8, background: '#2457C5', color: '#fff' }}>Sign in</button>
        </form>
        <form action={signInWithGoogle} style={{ marginTop: 12 }}>
          <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #64748b' }}>Continue with Google</button>
        </form>
      </div>
    </main>
  )
}
