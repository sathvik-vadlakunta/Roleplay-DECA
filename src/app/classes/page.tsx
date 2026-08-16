'use client'
import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Plus, Users, Hash, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import './classes.css'

type Class = {
  id: string
  name: string
  join_code: string
  teacher_id: string
  student_count?: number
}

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function ClassesPage() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const isTeacher = profile?.role === 'teacher'

  const [classes, setClasses] = useState<Class[]>([])
  const [myClass, setMyClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Teacher: create class
  const [showCreate, setShowCreate] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Student: join class
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')

  const load = useCallback(async () => {
    if (!user || !profile) return
    setLoading(true)

    if (isTeacher) {
      const { data } = await supabase
        .from('classes')
        .select('id, name, join_code, teacher_id')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        // Count students per class
        const withCounts = await Promise.all(
          data.map(async (cls: Class) => {
            const { count } = await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', cls.id)
            return { ...cls, student_count: count ?? 0 }
          })
        )
        setClasses(withCounts)
      }
    } else {
      // Student: fetch their current class
      if (profile.class_id) {
        const { data } = await supabase
          .from('classes')
          .select('id, name, join_code, teacher_id')
          .eq('id', profile.class_id)
          .single()
        setMyClass(data ?? null)
      }
    }
    setLoading(false)
  }, [user, profile, isTeacher, supabase])

  useEffect(() => { load() }, [load])

  async function createClass() {
    if (!newClassName.trim() || !user) return
    setCreating(true)
    setCreateError('')
    const code = randomCode()
    const { error } = await supabase
      .from('classes')
      .insert({ name: newClassName.trim(), teacher_id: user.id, join_code: code })

    if (error) {
      setCreateError(error.message)
    } else {
      setNewClassName('')
      setShowCreate(false)
      load()
    }
    setCreating(false)
  }

  async function joinClass() {
    if (!joinCode.trim() || !user) return
    setJoining(true)
    setJoinError('')
    setJoinSuccess('')

    const { data: cls, error: findError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single()

    if (findError || !cls) {
      setJoinError('Invalid code — double-check with your teacher.')
      setJoining(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ class_id: cls.id })
      .eq('id', user.id)

    if (updateError) {
      setJoinError(updateError.message)
    } else {
      setJoinSuccess(`Joined "${cls.name}" successfully!`)
      setJoinCode('')
      load()
    }
    setJoining(false)
  }

  async function copyCode(cls: Class) {
    await navigator.clipboard.writeText(cls.join_code)
    setCopiedId(cls.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function regenerateCode(cls: Class) {
    const code = randomCode()
    await supabase.from('classes').update({ join_code: code }).eq('id', cls.id)
    load()
  }

  if (!user) return (
    <main className="classes-page">
      <div className="container">
        <div className="classes-loading">Loading…</div>
      </div>
    </main>
  )

  // Profile may still be fetching — default to student join view while waiting
  const resolvedTeacher = profile?.role === 'teacher'

  return (
    <main className="classes-page">
      <div className="container">
        <div className="classes-header">
          <div>
            <h1>{resolvedTeacher ? 'Your Classes' : 'Classes'}</h1>
            <p>{resolvedTeacher
              ? 'Create classes and share join codes with your students.'
              : 'Enter a join code from your teacher to connect to your class.'
            }</p>
          </div>
          {resolvedTeacher && (
            <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
              <span className="btn-label">New class</span>
              <span className="btn-icon-badge"><Plus size={16} strokeWidth={2.5} /></span>
            </button>
          )}
        </div>

        {/* ── TEACHER VIEW ── */}
        {resolvedTeacher && (
          <>
            {showCreate && (
              <div className="create-card">
                <h3>Create a new class</h3>
                <div className="create-form">
                  <div className="field">
                    <label htmlFor="class-name">Class name</label>
                    <input
                      id="class-name"
                      type="text"
                      placeholder="e.g. Period 3 DECA"
                      value={newClassName}
                      onChange={e => setNewClassName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createClass()}
                      autoFocus
                    />
                  </div>
                  {createError && <p className="form-error">{createError}</p>}
                  <div className="create-actions">
                    <button className="btn btn-primary" onClick={createClass} disabled={creating || !newClassName.trim()}>
                      <span className="btn-label">{creating ? 'Creating…' : 'Create class'}</span>
                      <span className="btn-icon-badge"><ArrowRight size={14} strokeWidth={2.5} /></span>
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setCreateError('') }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="classes-loading">Loading your classes…</div>
            ) : classes.length === 0 ? (
              <div className="classes-empty">
                <Users size={48} strokeWidth={1.5} color="var(--muted-foreground)" />
                <p>No classes yet. Create one above and share the join code with your students.</p>
              </div>
            ) : (
              <div className="classes-grid">
                {classes.map(cls => (
                  <div className="class-card" key={cls.id}>
                    <div className="class-card-top">
                      <h3 className="class-name">{cls.name}</h3>
                      <div className="student-count">
                        <Users size={14} strokeWidth={2.5} />
                        {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="join-code-row">
                      <div className="join-code-pill">
                        <Hash size={14} strokeWidth={2.5} />
                        <span className="join-code-text">{cls.join_code}</span>
                      </div>
                      <button
                        className={`copy-btn${copiedId === cls.id ? ' copy-btn--done' : ''}`}
                        onClick={() => copyCode(cls)}
                        title="Copy join code"
                      >
                        {copiedId === cls.id
                          ? <><Check size={14} strokeWidth={2.5} /> Copied</>
                          : <><Copy size={14} strokeWidth={2.5} /> Copy code</>
                        }
                      </button>
                    </div>

                    <button className="regen-btn" onClick={() => regenerateCode(cls)}>
                      Regenerate code
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── STUDENT VIEW ── */}
        {!resolvedTeacher && (
          <>
            {myClass ? (
              <div className="my-class-card">
                <div className="my-class-icon">
                  <Users size={28} strokeWidth={2} color="white" />
                </div>
                <div>
                  <div className="my-class-label">You&apos;re in</div>
                  <h3 className="my-class-name">{myClass.name}</h3>
                </div>
              </div>
            ) : (
              <div className="join-card">
                <div className="join-card-icon">
                  <Hash size={32} strokeWidth={1.5} color="var(--accent)" />
                </div>
                <h3>Enter your class code</h3>
                <p>Your teacher will give you a 6-character code. Enter it below to join their class and see your assignments.</p>

                <div className="join-form">
                  <div className="field">
                    <label htmlFor="join-code">Class code</label>
                    <input
                      id="join-code"
                      type="text"
                      placeholder="e.g. AB3X9K"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && joinClass()}
                      maxLength={6}
                      className="join-code-input"
                      autoFocus
                    />
                  </div>
                  {joinError   && <p className="form-error">{joinError}</p>}
                  {joinSuccess && <p className="form-success">{joinSuccess}</p>}
                  <button
                    className="btn btn-primary join-submit"
                    onClick={joinClass}
                    disabled={joining || joinCode.length < 6}
                  >
                    <span className="btn-label">{joining ? 'Joining…' : 'Join class'}</span>
                    <span className="btn-icon-badge"><ArrowRight size={16} strokeWidth={2.5} /></span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
