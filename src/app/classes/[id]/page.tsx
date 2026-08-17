'use client'
import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Copy, Check, Plus, Users, BookOpen,
  Calendar, Trash2, Pencil, ArrowRight, Clock, CheckCircle2, Hash,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import './class.css'

type Student = { id: string; full_name: string; submission_count: number }

type Assignment = {
  id: string
  title: string
  description: string
  event_type: string
  due_date: string | null
  created_at: string
  submission_count: number
}

type ClassData = {
  id: string
  name: string
  join_code: string
  created_at: string
  students: Student[]
  assignments: Assignment[]
}

const DECA_EVENTS = [
  'Principles of Business Administration',
  'Principles of Finance',
  'Principles of Hospitality & Tourism',
  'Principles of Marketing',
  'Business Administration Core',
  'Entrepreneurship',
  'Finance Operations',
  'Hospitality & Tourism',
  'Marketing',
  'Sports & Entertainment Marketing',
  'Personal Financial Literacy',
  'Business Ethics & Law',
  'Accounting Applications',
  'Human Resources Management',
  'Business Law',
  'International Business',
]

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isPast(d: string | null) {
  return !!d && new Date(d) < new Date()
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function ClassDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params)
  const { user, loading: authLoading } = useAuth()

  const [cls, setCls] = useState<ClassData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')
  const [newName, setNewName] = useState('')
  const [newEvent, setNewEvent] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDue, setNewDue] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEvent, setEditEvent] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDue, setEditDue] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/classes/${classId}`)
    if (!res.ok) { setError('Class not found or access denied.'); setLoading(false); return }
    setCls(await res.json())
    setLoading(false)
  }, [classId])

  useEffect(() => {
    if (!authLoading && user) load()
  }, [authLoading, user, load])

  async function copyCode() {
    if (!cls) return
    await navigator.clipboard.writeText(cls.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function createAssignment() {
    if (!newName.trim()) return
    setCreating(true)
    setCreateErr('')
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, name: newName, event_type: newEvent, description: newDesc, due_date: newDue || null }),
    })
    if (!res.ok) {
      const b = await res.json()
      setCreateErr(b.error ?? 'Failed to create')
    } else {
      setNewName(''); setNewEvent(''); setNewDesc(''); setNewDue('')
      setShowCreate(false)
      await load()
    }
    setCreating(false)
  }

  function startEdit(a: Assignment) {
    setEditingId(a.id)
    setEditName(a.title)
    setEditEvent(a.event_type ?? '')
    setEditDesc(a.description ?? '')
    setEditDue(a.due_date ? a.due_date.slice(0, 10) : '')
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/assignments/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, event_type: editEvent, description: editDesc, due_date: editDue || null }),
    })
    if (res.ok) { setEditingId(null); await load() }
    setSaving(false)
  }

  async function deleteAssignment(id: string) {
    if (!confirm('Delete this assignment? All submissions will also be deleted.')) return
    await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
    await load()
  }

  if (authLoading || loading) return (
    <main className="class-page"><div className="container"><div className="class-status-msg">Loading class…</div></div></main>
  )

  if (error || !cls) return (
    <main className="class-page">
      <div className="container">
        <Link href="/classes" className="back-link"><ChevronLeft size={18} strokeWidth={2.5} /> All Classes</Link>
        <div className="class-status-msg">{error || 'Class not found.'}</div>
      </div>
    </main>
  )

  const studentCount = cls.students.length
  const totalSubs = cls.students.reduce((n, s) => n + s.submission_count, 0)

  return (
    <main className="class-page">
      <div className="container">

        {/* ── HEADER ── */}
        <Link href="/classes" className="back-link">
          <ChevronLeft size={18} strokeWidth={2.5} /> All Classes
        </Link>

        <div className="class-header">
          <div>
            <h1 className="class-title">{cls.name}</h1>
            <p className="class-meta">Created {fmtDate(cls.created_at)}</p>
          </div>
          <button className={`code-chip${copied ? ' code-chip--done' : ''}`} onClick={copyCode}>
            {copied
              ? <><Check size={13} strokeWidth={2.5} /> Copied!</>
              : <><Hash size={13} strokeWidth={2.5} /> {cls.join_code} <Copy size={12} strokeWidth={2.5} /></>
            }
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="class-stats-row">
          <div className="stat-item"><Users size={15} strokeWidth={2.5} /><strong>{studentCount}</strong> {studentCount === 1 ? 'student' : 'students'}</div>
          <span className="stat-dot">·</span>
          <div className="stat-item"><BookOpen size={15} strokeWidth={2.5} /><strong>{cls.assignments.length}</strong> {cls.assignments.length === 1 ? 'assignment' : 'assignments'}</div>
          <span className="stat-dot">·</span>
          <div className="stat-item"><CheckCircle2 size={15} strokeWidth={2.5} /><strong>{totalSubs}</strong> total {totalSubs === 1 ? 'submission' : 'submissions'}</div>
        </div>

        {/* ── ASSIGNMENTS ── */}
        <section className="class-section">
          <div className="class-section-header">
            <h2>Assignments</h2>
            <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
              <span className="btn-label">New assignment</span>
              <span className="btn-icon-badge"><Plus size={14} strokeWidth={2.5} /></span>
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="asgn-form-card">
              <h3>New Assignment</h3>
              <div className="asgn-form-grid">
                <div className="field">
                  <label>Assignment name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Entrepreneurship Roleplay #1"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createAssignment()}
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label>DECA Event</label>
                  <input
                    type="text"
                    list="deca-events-new"
                    placeholder="e.g. Entrepreneurship"
                    value={newEvent}
                    onChange={e => setNewEvent(e.target.value)}
                  />
                  <datalist id="deca-events-new">
                    {DECA_EVENTS.map(e => <option key={e} value={e} />)}
                  </datalist>
                </div>
                <div className="field">
                  <label>Due date</label>
                  <input type="date" min={todayIso()} value={newDue} onChange={e => setNewDue(e.target.value)} />
                </div>
                <div className="field field--full">
                  <label>Instructions</label>
                  <textarea
                    placeholder="Describe what students should do, tips, case prompt details…"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              {createErr && <p className="form-error">{createErr}</p>}
              <div className="form-row">
                <button className="btn btn-primary" onClick={createAssignment} disabled={creating || !newName.trim()}>
                  <span className="btn-label">{creating ? 'Creating…' : 'Create assignment'}</span>
                  <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
                </button>
                <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setCreateErr('') }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Assignment cards */}
          {cls.assignments.length === 0 ? (
            <div className="section-empty">
              <BookOpen size={44} strokeWidth={1.5} color="var(--muted-foreground)" />
              <p>No assignments yet. Create one above and students can start submitting roleplays.</p>
            </div>
          ) : (
            <div className="asgn-grid">
              {cls.assignments.map(a => (
                <div className="asgn-card" key={a.id}>
                  {editingId === a.id ? (
                    <div className="asgn-edit-form">
                      <div className="field">
                        <label>Name</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                      </div>
                      <div className="field">
                        <label>DECA Event</label>
                        <input type="text" list="deca-events-edit" value={editEvent} onChange={e => setEditEvent(e.target.value)} />
                        <datalist id="deca-events-edit">
                          {DECA_EVENTS.map(e => <option key={e} value={e} />)}
                        </datalist>
                      </div>
                      <div className="field">
                        <label>Due date</label>
                        <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>Instructions</label>
                        <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
                      </div>
                      <div className="form-row">
                        <button className="btn btn-primary" onClick={saveEdit} disabled={saving || !editName.trim()}>
                          <span className="btn-label">{saving ? 'Saving…' : 'Save changes'}</span>
                        </button>
                        <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="asgn-card-top">
                        <div className="asgn-card-top-left">
                          {a.event_type && <span className="event-pill">{a.event_type}</span>}
                          <h3 className="asgn-name">{a.title}</h3>
                        </div>
                        <div className="asgn-icon-btns">
                          <button className="icon-btn" onClick={() => startEdit(a)} title="Edit assignment">
                            <Pencil size={14} strokeWidth={2.5} />
                          </button>
                          <button className="icon-btn icon-btn--danger" onClick={() => deleteAssignment(a.id)} title="Delete assignment">
                            <Trash2 size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>

                      {a.description && <p className="asgn-desc">{a.description}</p>}

                      <div className="asgn-chips">
                        {a.due_date && (
                          <span className={`asgn-chip${isPast(a.due_date) ? ' asgn-chip--past' : ''}`}>
                            <Clock size={12} strokeWidth={2.5} />
                            {isPast(a.due_date) ? 'Past due · ' : 'Due · '}
                            {fmtDate(a.due_date)}
                          </span>
                        )}
                        <span className="asgn-chip">
                          <Users size={12} strokeWidth={2.5} />
                          {a.submission_count} / {studentCount} submitted
                        </span>
                      </div>

                      <div className="sub-progress-track">
                        <div
                          className="sub-progress-fill"
                          style={{ width: studentCount > 0 ? `${(a.submission_count / studentCount) * 100}%` : '0%' }}
                        />
                      </div>

                      <Link href={`/classes/${classId}/assignments/${a.id}`} className="btn btn-secondary asgn-view-btn">
                        <span className="btn-label">View submissions</span>
                        <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
                      </Link>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── STUDENTS ── */}
        <section className="class-section">
          <div className="class-section-header">
            <h2>Students <span className="section-count">({studentCount})</span></h2>
          </div>

          {cls.students.length === 0 ? (
            <div className="section-empty">
              <Users size={44} strokeWidth={1.5} color="var(--muted-foreground)" />
              <p>
                No students yet. Share the join code{' '}
                <button className="inline-code" onClick={copyCode}>{cls.join_code}</button>
                {' '}with your class.
              </p>
            </div>
          ) : (
            <div className="students-list">
              <div className="students-list-header">
                <span>Student</span>
                <span>Submissions</span>
              </div>
              {cls.students.map(s => (
                <div className="student-row" key={s.id}>
                  <div className="student-name">
                    <div className="student-avatar">{s.full_name.charAt(0).toUpperCase()}</div>
                    <span>{s.full_name}</span>
                  </div>
                  <span className={`badge ${s.submission_count > 0 ? 'badge-submitted' : 'badge-pending'}`}>
                    {s.submission_count > 0 ? `${s.submission_count} submitted` : 'None yet'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
