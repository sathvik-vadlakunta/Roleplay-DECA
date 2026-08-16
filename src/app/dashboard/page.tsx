'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Video, Clock, CheckCircle, AlertTriangle, ArrowRight, Star, TrendingUp, Users } from 'lucide-react'
import './dashboard.css'

const STUDENT_ASSIGNMENTS = [
  { id: '1', title: 'Marketing Cluster Roleplay #2', event: 'Marketing Management', due: 'Aug 18, 2026', status: 'pending', attempt: 0 },
  { id: '2', title: 'Entrepreneurship Case Study', event: 'Entrepreneurship — Individual', due: 'Aug 22, 2026', status: 'submitted', attempt: 1 },
  { id: '3', title: 'Finance Roleplay #1', event: 'Personal Financial Literacy', due: 'Aug 10, 2026', status: 'reviewed', attempt: 2 },
]

const TEACHER_QUEUE = [
  { id: '1', student: 'Priya Sharma', assignment: 'Marketing Cluster Roleplay #2', submitted: '2 hours ago', attempt: 1 },
  { id: '2', student: 'Jordan Lee', assignment: 'Marketing Cluster Roleplay #2', submitted: '5 hours ago', attempt: 1 },
  { id: '3', student: 'Alex Kim', assignment: 'Entrepreneurship Case Study', submitted: 'Yesterday', attempt: 2 },
]

const statusMap: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: 'Not started', cls: 'badge-pending',   icon: Clock },
  submitted: { label: 'Submitted',   cls: 'badge-submitted', icon: Video },
  reviewed:  { label: 'Reviewed',    cls: 'badge-reviewed',  icon: CheckCircle },
  revision:  { label: 'Revision',    cls: 'badge-revision',  icon: AlertTriangle },
}

export default function Dashboard() {
  const [view, setView] = useState<'student' | 'teacher'>('student')

  return (
    <main className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Your Dashboard</h1>
            <p>Track your assignments, feedback, and progress.</p>
          </div>
          <div className="view-toggle">
            <button className={`view-btn${view === 'student' ? ' view-btn--active' : ''}`} onClick={() => setView('student')}>
              Student view
            </button>
            <button className={`view-btn${view === 'teacher' ? ' view-btn--active' : ''}`} onClick={() => setView('teacher')}>
              Teacher view
            </button>
          </div>
        </div>

        {view === 'student' ? (
          <>
            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Due this week',    value: '2',   icon: Clock,       color: '#F59E0B' },
                { label: 'Submitted',        value: '5',   icon: Video,       color: '#3B82F6' },
                { label: 'Avg PI score',     value: '3.8', icon: Star,        color: '#0D9488' },
                { label: 'Feedback items',   value: '14',  icon: TrendingUp,  color: '#FF6F61' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-icon" style={{ background: s.color }}>
                    <s.icon size={20} strokeWidth={2.5} color="white" />
                  </div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Assignments */}
            <div className="section-header">
              <h2>Assignments</h2>
              <Link href="/assignments" className="see-all">See all <ArrowRight size={14} /></Link>
            </div>
            <div className="assignment-list">
              {STUDENT_ASSIGNMENTS.map(a => {
                const s = statusMap[a.status]
                const StatusIcon = s.icon
                return (
                  <div className="assignment-row" key={a.id}>
                    <div className="assignment-info">
                      <div className="assignment-title">{a.title}</div>
                      <div className="assignment-meta">{a.event} &middot; Due {a.due}</div>
                    </div>
                    <div className="assignment-right">
                      <span className={`badge ${s.cls}`}>
                        <StatusIcon size={12} strokeWidth={2.5} />
                        {s.label}
                      </span>
                      {a.status === 'pending' ? (
                        <Link href={`/assignments/${a.id}`} className="btn btn-primary assignment-cta">
                          <span className="btn-label">Submit</span>
                          <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
                        </Link>
                      ) : (
                        <Link href={`/submissions/${a.id}`} className="btn btn-secondary assignment-cta">
                          <span className="btn-label">View feedback</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            {/* Teacher stats */}
            <div className="stats-grid">
              {[
                { label: 'To review',       value: '7',  icon: Video,  color: '#FF6F61' },
                { label: 'Students',        value: '24', icon: Users,  color: '#3B82F6' },
                { label: 'Avg class score', value: '3.4',icon: Star,   color: '#0D9488' },
                { label: 'Reviewed today',  value: '3',  icon: CheckCircle, color: '#F59E0B' },
              ].map(s => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-icon" style={{ background: s.color }}>
                    <s.icon size={20} strokeWidth={2.5} color="white" />
                  </div>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Review queue */}
            <div className="section-header">
              <h2>Review queue</h2>
              <span className="queue-tag">{TEACHER_QUEUE.length} pending</span>
            </div>
            <div className="assignment-list">
              {TEACHER_QUEUE.map(item => (
                <div className="assignment-row" key={item.id}>
                  <div className="assignment-info">
                    <div className="assignment-title">{item.student}</div>
                    <div className="assignment-meta">{item.assignment} &middot; Attempt {item.attempt} &middot; {item.submitted}</div>
                  </div>
                  <Link href={`/review/${item.id}`} className="btn btn-primary assignment-cta">
                    <span className="btn-label">Review</span>
                    <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
                  </Link>
                </div>
              ))}
            </div>

            {/* Analytics callout */}
            <div className="analytics-callout">
              <div className="analytics-callout-icon">
                <TrendingUp size={24} strokeWidth={2} color="white" />
              </div>
              <div>
                <div className="analytics-callout-title">Most common weak spot this month</div>
                <div className="analytics-callout-desc">
                  <strong>PI 2.3 — Ask clarifying questions</strong> — flagged in 15 of 22 submissions (68%). Consider a class drill before the next assignment.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
