import Link from 'next/link'
import { GraduationCap, BookOpen, ArrowRight } from 'lucide-react'
import './signup.css'

export default function SignupLanding() {
  return (
    <main className="signup-page">
      <div className="signup-inner">
        <h1 className="signup-title">Join DECA Coach</h1>
        <p className="signup-sub">Select your role to get started.</p>

        <div className="signup-options">
          <Link href="/login?signup=1&role=student" className="signup-option">
            <div className="signup-option-icon signup-option-icon--student">
              <GraduationCap size={28} strokeWidth={2} color="white" />
            </div>
            <div className="signup-option-label">Student</div>
            <div className="signup-option-desc">Submit roleplays &amp; get feedback</div>
          </Link>

          <Link href="/login?signup=1&role=teacher" className="signup-option">
            <div className="signup-option-icon signup-option-icon--teacher">
              <BookOpen size={28} strokeWidth={2} color="white" />
            </div>
            <div className="signup-option-label">Teacher / Coach</div>
            <div className="signup-option-desc">Create classes &amp; review submissions</div>
          </Link>
        </div>

        <p className="signup-login-link">
          Already have an account?{' '}
          <Link href="/login">
            Log in <ArrowRight size={12} className="signup-arrow" />
          </Link>
        </p>
      </div>
    </main>
  )
}
