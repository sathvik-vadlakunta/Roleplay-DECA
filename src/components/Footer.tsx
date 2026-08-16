import Link from 'next/link'
import { Mail } from 'lucide-react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <Link href="/" className="footer-logo" aria-label="DECA Coach home">
          deca<span className="brand-highlight">coach</span>
        </Link>
        <p className="footer-tagline">
          Timestamped video feedback for DECA roleplay practice — built to help students improve faster.
        </p>
        <div className="footer-socials">
          <a href="mailto:hello@decacoach.app" className="footer-social-link" aria-label="Email">
            <Mail size={18} strokeWidth={2.5} />
          </a>
        </div>
      </div>
      <div className="footer-bottom container">
        <p>&copy; {new Date().getFullYear()} DECA Coach. All rights reserved.</p>
      </div>
    </footer>
  )
}
