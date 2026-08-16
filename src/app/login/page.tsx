'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, GraduationCap, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import './login.css'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, logIn } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(name, email, password, role)
        router.push('/dashboard')
      } else {
        await logIn(email, password)
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (msg === 'CHECK_EMAIL') {
        setInfo('Account created! Check your email and click the confirmation link, then log in.')
        setMode('login')
      } else {
        setError(friendlyError(msg))
      }
    } finally {
      setLoading(false)
    }
  }

  function friendlyError(msg: string) {
    if (msg.includes('already registered') || msg.includes('User already registered')) return 'An account with that email already exists. Try logging in instead.'
    if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) return 'Incorrect email or password.'
    if (msg.includes('Email not confirmed') || msg.includes('not confirmed')) return 'Please confirm your email first — check your inbox for the confirmation link.'
    if (msg.includes('Password should') || msg.includes('at least')) return 'Password must be at least 6 characters.'
    if (msg.includes('rate limit') || msg.includes('Too many')) return 'Too many attempts — wait a minute and try again.'
    return msg
  }

  return (
    <main className="login-page">
      <div className="login-shapes" aria-hidden="true">
        <div className="login-shape login-shape--circle" />
        <div className="login-shape login-shape--triangle" />
        <div className="login-shape login-shape--square" />
        <div className="login-shape login-shape--pill" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <Link href="/" className="login-brand">
            deca<span>coach</span>
          </Link>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p>{mode === 'login' ? 'Log in to see your assignments and feedback.' : 'Join your class and start improving your roleplays.'}</p>
        </div>

        {mode === 'signup' && (
          <div className="role-picker">
            <button
              className={`role-option${role === 'student' ? ' role-option--active' : ''}`}
              onClick={() => setRole('student')}
              type="button"
            >
              <GraduationCap size={20} strokeWidth={2} />
              <span>Student</span>
            </button>
            <button
              className={`role-option${role === 'teacher' ? ' role-option--active' : ''}`}
              onClick={() => setRole('teacher')}
              type="button"
            >
              <BookOpen size={20} strokeWidth={2} />
              <span>Teacher / Coach</span>
            </button>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {info  && <p className="login-info">{info}</p>}
          {error && <p className="login-error">{error}</p>}

          <button className="login-submit btn btn-primary" type="submit" disabled={loading}>
            <span className="btn-label">
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </span>
            {!loading && (
              <span className="btn-icon-badge">
                <ArrowRight size={18} strokeWidth={2.5} />
              </span>
            )}
          </button>
        </form>

        <p className="login-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </main>
  )
}
