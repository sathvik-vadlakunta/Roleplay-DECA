import Link from 'next/link'
import { ArrowRight, Clock, Video, CheckCircle, AlertTriangle, Plus } from 'lucide-react'
import './assignments.css'

const ASSIGNMENTS = [
  {
    id: '1',
    title: 'Marketing Cluster Roleplay #2',
    event: 'Marketing Management',
    due: 'Aug 18, 2026',
    pis: ['PI 2.1', 'PI 2.3', 'PI 3.4'],
    status: 'pending',
    submissions: 0,
    totalStudents: 24,
  },
  {
    id: '2',
    title: 'Entrepreneurship Case Study',
    event: 'Entrepreneurship — Individual',
    due: 'Aug 22, 2026',
    pis: ['PI 1.1', 'PI 1.2', 'PI 4.1'],
    status: 'submitted',
    submissions: 18,
    totalStudents: 24,
  },
  {
    id: '3',
    title: 'Finance Roleplay #1',
    event: 'Personal Financial Literacy',
    due: 'Aug 10, 2026',
    pis: ['PI 5.1', 'PI 5.2'],
    status: 'reviewed',
    submissions: 24,
    totalStudents: 24,
  },
  {
    id: '4',
    title: 'Sports & Entertainment Mock',
    event: 'Sports & Entertainment Marketing',
    due: 'Sep 3, 2026',
    pis: ['PI 1.4', 'PI 2.2', 'PI 3.1'],
    status: 'pending',
    submissions: 0,
    totalStudents: 24,
  },
]

const statusMap: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: 'Open',      cls: 'badge-pending',   icon: Clock },
  submitted: { label: 'In review', cls: 'badge-submitted', icon: Video },
  reviewed:  { label: 'Graded',    cls: 'badge-reviewed',  icon: CheckCircle },
  revision:  { label: 'Revision',  cls: 'badge-revision',  icon: AlertTriangle },
}

export default function Assignments() {
  return (
    <main className="assignments-page">
      <div className="container">
        <div className="assignments-header">
          <div>
            <h1>Assignments</h1>
            <p>All active and past roleplay assignments for your class.</p>
          </div>
          <button className="btn btn-primary">
            <span className="btn-label">New assignment</span>
            <span className="btn-icon-badge"><Plus size={16} strokeWidth={2.5} /></span>
          </button>
        </div>

        <div className="assignments-grid">
          {ASSIGNMENTS.map(a => {
            const s = statusMap[a.status]
            const StatusIcon = s.icon
            const pct = Math.round((a.submissions / a.totalStudents) * 100)
            return (
              <div className="assignment-card" key={a.id}>
                <div className="assignment-card-top">
                  <span className={`badge ${s.cls}`}>
                    <StatusIcon size={12} strokeWidth={2.5} />
                    {s.label}
                  </span>
                  <span className="assignment-card-due">Due {a.due}</span>
                </div>

                <h3 className="assignment-card-title">{a.title}</h3>
                <div className="assignment-card-event">{a.event}</div>

                <div className="assignment-card-pis">
                  {a.pis.map(pi => (
                    <span key={pi} className="pi-tag">{pi}</span>
                  ))}
                </div>

                <div className="assignment-card-progress">
                  <div className="progress-label">
                    <span>{a.submissions} / {a.totalStudents} submitted</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="assignment-card-actions">
                  <Link href={`/assignments/${a.id}`} className="btn btn-primary">
                    <span className="btn-label">
                      {a.status === 'pending' ? 'Submit video' : 'View details'}
                    </span>
                    <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
