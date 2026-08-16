'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'Dashboard',   href: '/dashboard' },
  { label: 'Assignments', href: '/assignments' },
  { label: 'Classes',     href: '/classes' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, profile, logOut } = useAuth()
  const router = useRouter()

  async function handleLogOut() {
    await logOut()
    router.push('/')
    setOpen(false)
  }

  return (
    <header className="navbar">
      <nav className="navbar-inner container">
        <Link href="/" className="navbar-brand" aria-label="DECA Coach home">
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
          {user ? (
            <>
              {profile && (
                <span className="navbar-role-pill">
                  {profile.role === 'teacher' ? 'Coach' : 'Student'}
                </span>
              )}
              <button className="btn btn-secondary navbar-logout" onClick={handleLogOut}>
                <span className="btn-label">Log out</span>
                <span className="btn-icon-badge"><LogOut size={16} strokeWidth={2.5} /></span>
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              <span className="btn-label">Log in</span>
              <span className="btn-icon-badge"><LogIn size={16} strokeWidth={2.5} /></span>
            </Link>
          )}
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
          {user ? (
            <button className="btn btn-secondary" onClick={handleLogOut} style={{ alignSelf: 'stretch', justifyContent: 'center' }}>
              <span className="btn-label">Log out</span>
              <span className="btn-icon-badge"><LogOut size={16} strokeWidth={2.5} /></span>
            </button>
          ) : (
            <Link href="/login" className="btn btn-primary" onClick={() => setOpen(false)} style={{ alignSelf: 'stretch', justifyContent: 'center' }}>
              <span className="btn-label">Log in</span>
              <span className="btn-icon-badge"><LogIn size={16} strokeWidth={2.5} /></span>
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
