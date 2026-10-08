import Link from 'next/link'

export type MirrorLink = { href: string; label: string; disabled?: boolean }

export function RouteMirror({ title, links, open, onClose }: { title: string; links: MirrorLink[]; open: boolean; onClose: () => void }) {
  return (
    <aside id="grove-route-list" className={`grove-route-list${open ? ' is-open' : ''}`} aria-label={title} hidden={!open}>
      <div className="grove-route-list-head">
        <h2>{title}</h2>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <ul>
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            {link.disabled ? <span aria-disabled="true">{link.label} <small>Bank empty</small></span> : <Link href={link.href}>{link.label}</Link>}
          </li>
        ))}
      </ul>
    </aside>
  )
}
