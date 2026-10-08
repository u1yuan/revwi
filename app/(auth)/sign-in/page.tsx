export default function SignInPage() {
  return (
    <div className="void-surface" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div
        style={{
          background: '#fff',
          color: '#14243A',
          padding: 32,
          borderRadius: 12,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Sign in to Revwi</h1>
        <p style={{ marginBottom: 16, fontSize: 15 }}>
          Connect Supabase Auth in your project, then add the email or OAuth provider UI here.
        </p>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Until auth is configured, use the multiverse and local reviewer without an account.
        </p>
      </div>
    </div>
  )
}
