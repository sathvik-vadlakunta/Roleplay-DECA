'use client'
import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ChevronLeft, Clock, CheckCircle, Video, AlertTriangle, Users, Star } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import './submissions.css'

type StudentSummary = {
  id: string
  full_name: string
  attempt_count: number
  latest_submission_id: string | null
  latest_date: string | null
  latest_status: string | null
  latest_score: number | null
}

type AssignmentDetail = {
  id: string
  title: string
  description: string
  event_type: string
  due_date: string | null
  created_at: string
  students: StudentSummary[]
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtScore(n: number | null) {
  if (n === null) return '—'
  return n.toFixed(1)
}

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  submitted: { label: 'Submitted',  cls: 'badge-submitted', icon: Video },
  reviewed:  { label: 'Reviewed',   cls: 'badge-reviewed',  icon: CheckCircle },
  revision:  { label: 'Needs work', cls: 'badge-revision',  icon: AlertTriangle },
}

export default function SubmissionsView({
  params,
}: {
  params: Promise<{ id: string; aid: string }>
}) {
  const { id: classId, aid } = use(params)
  const { user, loading: authLoading } = useAuth()

  const [asgn, setAsgn] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !user) return
    fetch(`/api/assignments/${aid}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(d => { setAsgn(d); setLoading(false) })
      .catch(() => { setError('Could not load assignment.'); setLoading(false) })
  }, [authLoading, user, aid])

  if (authLoading || loading) return (
    <main className="subs-page"><div className="container"><div className="subs-status">Loading…</div></div></main>
  )

  if (error || !asgn) return (
    <main className="subs-page">
      <div className="container">
        <Link href={`/classes/${classId}`} className="back-link"><ChevronLeft size={18} strokeWidth={2.5} /> Back to class</Link>
        <div className="subs-status">{error || 'Assignment not found.'}</div>
      </div>
    </main>
  )

  const submitted = asgn.students.filter(s => s.latest_submission_id !== null)
  const notSubmitted = asgn.students.filter(s => s.latest_submission_id === null)
  const submittedPct = asgn.students.length > 0
    ? Math.round((submitted.length / asgn.students.length) * 100)
    : 0
  const avgScore = submitted.filter(s => s.latest_score !== null).length > 0
    ? submitted.filter(s => s.latest_score !== null)
        .reduce((sum, s) => sum + (s.latest_score ?? 0), 0) /
      submitted.filter(s => s.latest_score !== null).length
    : null

  return (
    <main className="subs-page">
      <div className="container">
        <Link href={`/classes/${classId}`} className="back-link">
          <ChevronLeft size={18} strokeWidth={2.5} /> Back to class
        </Link>

        {/* ── ASSIGNMENT HEADER ── */}
        <div className="subs-header">
          <div>
            {asgn.event_type && <div className="subs-event-label">{asgn.event_type}</div>}
            <h1 className="subs-title">{asgn.title}</h1>
            {asgn.description && <p className="subs-desc">{asgn.description}</p>}
          </div>
          <div className="subs-due">
            {asgn.due_date && (
              <span className="asgn-chip">
                <Clock size={13} strokeWidth={2.5} />
                Due {fmtDate(asgn.due_date)}
              </span>
            )}
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="subs-stats">
          <div className="subs-stat-card">
            <div className="subs-stat-icon" style={{ background: '#CCFBF1' }}>
              <Users size={22} strokeWidth={2} color="var(--secondary)" />
            </div>
            <div>
              <div className="subs-stat-val">{submitted.length} <span>/ {asgn.students.length}</span></div>
              <div className="subs-stat-label">Students submitted</div>
            </div>
          </div>

          <div className="subs-stat-card">
            <div className="subs-stat-icon" style={{ background: '#FFE4E1' }}>
              <Star size={22} strokeWidth={2} color="var(--accent)" />
            </div>
            <div>
              <div className="subs-stat-val">{avgScore !== null ? avgScore.toFixed(1) : '—'}<span> / 5.0</span></div>
              <div className="subs-stat-label">Avg score (graded)</div>
            </div>
          </div>

          <div className="subs-stat-card">
            <div className="subs-stat-icon" style={{ background: '#FEF3C7' }}>
              <CheckCircle size={22} strokeWidth={2} color="var(--tertiary)" />
            </div>
            <div>
              <div className="subs-stat-val">{submittedPct}<span>%</span></div>
              <div className="subs-stat-label">Completion rate</div>
            </div>
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="subs-progress-wrap">
          <div className="subs-progress-track">
            <div className="subs-progress-fill" style={{ width: `${submittedPct}%` }} />
          </div>
          <span className="subs-progress-label">{submittedPct}% submitted</span>
        </div>

        {/* ── SUBMITTED ── */}
        {submitted.length > 0 && (
          <section className="subs-section">
            <h2 className="subs-section-title">Submitted ({submitted.length})</h2>
            <div className="subs-table">
              <div className="subs-table-head">
                <span>Student</span>
                <span>Attempts</span>
                <span>Latest score</span>
                <span>Date</span>
                <span>Status</span>
                <span></span>
              </div>
              {submitted.map(s => {
                const cfg = s.latest_status ? (statusConfig[s.latest_status] ?? statusConfig.submitted) : statusConfig.submitted
                const Icon = cfg.icon
                return (
                  <div className="subs-table-row" key={s.id}>
                    <div className="subs-student-name">
                      <div className="student-avatar">{s.full_name.charAt(0).toUpperCase()}</div>
                      {s.full_name}
                    </div>
                    <span className="subs-attempts">{s.attempt_count}</span>
                    <span className="subs-score">
                      {s.latest_score !== null
                        ? <><strong>{fmtScore(s.latest_score)}</strong><span className="score-max"> / 5.0</span></>
                        : <span className="no-score">Not graded</span>
                      }
                    </span>
                    <span className="subs-date">{fmtDate(s.latest_date)}</span>
                    <span className={`badge ${cfg.cls}`}>
                      <Icon size={11} strokeWidth={2.5} />
                      {cfg.label}
                    </span>
                    <Link
                      href={`/review/${s.latest_submission_id}`}
                      className="btn btn-primary subs-review-btn"
                    >
                      <span className="btn-label">Review</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── NOT SUBMITTED ── */}
        {notSubmitted.length > 0 && (
          <section className="subs-section">
            <h2 className="subs-section-title">Not submitted ({notSubmitted.length})</h2>
            <div className="subs-table">
              <div className="subs-table-head">
                <span>Student</span>
                <span>Status</span>
              </div>
              {notSubmitted.map(s => (
                <div className="subs-table-row" key={s.id}>
                  <div className="subs-student-name">
                    <div className="student-avatar student-avatar--muted">{s.full_name.charAt(0).toUpperCase()}</div>
                    {s.full_name}
                  </div>
                  <span className="badge badge-pending">Not submitted</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {asgn.students.length === 0 && (
          <div className="subs-empty">
            <Users size={44} strokeWidth={1.5} color="var(--muted-foreground)" />
            <p>No students in this class yet.</p>
          </div>
        )}
      </div>
    </main>
  )
}
