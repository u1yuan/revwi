import Link from 'next/link'
import { List, SignIn, X } from '@phosphor-icons/react'

export function FlightDeck({ context, listOpen, onToggleList }: { context?: string; listOpen: boolean; onToggleList: () => void }) {
  return (
    <header className="grove-header">
      <div className="grove-brand-row">
        <Link href="/" className="grove-brand">Revwi</Link>
        {context ? <span className="grove-context">{context}</span> : null}
      </div>
      <nav className="grove-header-actions" aria-label="Student navigation">
        <button type="button" className="grove-list-button" onClick={onToggleList} aria-expanded={listOpen} aria-controls="grove-route-list">
          {listOpen ? <X size={19} aria-hidden /> : <List size={19} aria-hidden />}
          <span>{listOpen ? 'Close list' : 'List view'}</span>
        </button>
        <Link href="/sign-in" className="grove-sign-in"><SignIn size={19} aria-hidden /><span>Sign in</span></Link>
      </nav>
    </header>
  )
}
