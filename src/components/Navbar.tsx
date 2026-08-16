'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LogIn } from 'lucide-react'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Assignments', href: '/assignments' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <nav className="navbar-inner container">
        <Link href="/" className="navbar-brand" aria-label="DECA Roleplay Coach home">
          <span>deca<span className="brand-highlight">coach</span></span>
        </Link>

        <ul className="navbar-links">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <Link href={href} onClick={() => setOpen(false)}>{label}</Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <Link href="/login" className="btn btn-primary">
            <span className="btn-label">Log in</span>
            <span className="btn-icon-badge"><LogIn size={16} strokeWidth={2.5} /></span>
          </Link>
        </div>

        <button
          className="navbar-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          {open ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
        </button>
      </nav>

      {open && (
        <div className="navbar-mobile">
          <ul>
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} onClick={() => setOpen(false)}>{label}</Link>
              </li>
            ))}
          </ul>
          <Link href="/login" className="btn btn-primary" onClick={() => setOpen(false)} style={{ alignSelf: 'stretch', justifyContent: 'center' }}>
            <span className="btn-label">Log in</span>
            <span className="btn-icon-badge"><LogIn size={16} strokeWidth={2.5} /></span>
          </Link>
        </div>
      )}
    </header>
  )
}
