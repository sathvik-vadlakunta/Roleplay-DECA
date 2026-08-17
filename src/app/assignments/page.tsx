'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Video, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import './assignments.css'

type Submission = {
  id: string
  status: string
  attempt_number: number
}

type Assignment = {
  id: string
  title: string
  description: string
  event_type: string
  due_date: string | null
  created_at: string
  submission: Submission | null
}

const statusMap: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  submitted: { label: 'Submitted',  cls: 'badge-submitted', icon: Video },
  reviewed:  { label: 'Reviewed',   cls: 'badge-reviewed',  icon: CheckCircle },
  revision:  { label: 'Needs work', cls: 'badge-revision',  icon: AlertTriangle },
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isPast(d: string | null) {
  return !!d && new Date(d) < new Date()
}

export default function AssignmentsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return
    fetch('/api/assignments')
      .then(r => r.json())
      .then(d => { setAssignments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [authLoading, user])

  const noClass = !authLoading && !loading && profile && !profile.class_id

  return (
    <main className="assignments-page">
      <div className="container">
        <div className="assignments-header">
          <div>
            <h1>Assignments</h1>
            <p>Your active and past roleplay assignments.</p>
          </div>
        </div>

        {(authLoading || loading) && (
          <div className="assignments-loading">Loading assignments…</div>
        )}

        {noClass && (
          <div className="assignments-empty">
            <BookOpen size={48} strokeWidth={1.5} color="var(--muted-foreground)" />
            <p>You haven&apos;t joined a class yet.</p>
            <Link href="/classes" className="btn btn-primary">
              <span className="btn-label">Join a class</span>
              <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
            </Link>
          </div>
        )}

        {!loading && !noClass && assignments.length === 0 && (
          <div className="assignments-empty">
            <BookOpen size={48} strokeWidth={1.5} color="var(--muted-foreground)" />
            <p>No assignments yet — your teacher hasn&apos;t posted any.</p>
          </div>
        )}

        {assignments.length > 0 && (
          <div className="assignments-grid">
            {assignments.map(a => {
              const sub = a.submission
              const statusKey = sub?.status ?? 'open'
              const s = sub ? (statusMap[sub.status] ?? statusMap.submitted) : null
              const StatusIcon = s?.icon

              return (
                <div className="assignment-card" key={a.id}>
                  <div className="assignment-card-top">
                    {s && StatusIcon ? (
                      <span className={`badge ${s.cls}`}>
                        <StatusIcon size={12} strokeWidth={2.5} />
                        {s.label}
                      </span>
                    ) : (
                      <span className="badge badge-pending">
                        <Clock size={12} strokeWidth={2.5} />
                        Open
                      </span>
                    )}
                    {a.due_date && (
                      <span className={`assignment-card-due${isPast(a.due_date) && !sub ? ' assignment-card-due--past' : ''}`}>
                        {isPast(a.due_date) ? 'Past due · ' : 'Due · '}
                        {fmtDate(a.due_date)}
                      </span>
                    )}
                  </div>

                  <h3 className="assignment-card-title">{a.title}</h3>
                  {a.event_type && <div className="assignment-card-event">{a.event_type}</div>}
                  {a.description && <p className="assignment-card-desc">{a.description}</p>}

                  {sub && (
                    <div className="assignment-card-attempts">
                      {sub.attempt_number} {sub.attempt_number === 1 ? 'attempt' : 'attempts'} submitted
                    </div>
                  )}

                  <div className="assignment-card-actions">
                    <Link href={`/assignments/${a.id}`} className="btn btn-primary">
                      <span className="btn-label">
                        {sub ? 'View / resubmit' : 'Submit video'}
                      </span>
                      <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
