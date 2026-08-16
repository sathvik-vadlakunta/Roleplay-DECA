'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Upload, Video, Mic, RotateCcw, Send, ChevronLeft, FileText, Clock } from 'lucide-react'
import './submit.css'

const ASSIGNMENT = {
  id: '1',
  title: 'Marketing Cluster Roleplay #2',
  event: 'Marketing Management',
  due: 'Aug 18, 2026',
  pis: [
    { id: 'PI 2.1', label: 'Identify customer needs' },
    { id: 'PI 2.3', label: 'Ask clarifying questions' },
    { id: 'PI 3.4', label: 'Close the sale professionally' },
  ],
  instructions: 'You are a marketing consultant brought in to advise a mid-size retail client. Their sales have dropped 15% YoY. Identify the root cause, propose a marketing strategy, and handle judge follow-up questions. You have 10 minutes to present.',
  casePromptUrl: '#',
}

const PAST_ATTEMPTS = [
  { num: 1, date: 'Aug 5, 2026', score: 3.2, status: 'reviewed' },
]

export default function SubmitAssignment() {
  const [mode, setMode] = useState<'idle' | 'record' | 'upload' | 'preview'>('idle')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFileName(f.name)
      setMode('preview')
    }
  }

  return (
    <main className="submit-page">
      <div className="container">
        <Link href="/assignments" className="back-link">
          <ChevronLeft size={18} strokeWidth={2.5} />
          All assignments
        </Link>

        <div className="submit-layout">
          {/* Left: video upload */}
          <div className="submit-main">
            <div className="submit-card">
              <h2>Submit your roleplay</h2>
              <p>Record directly in the browser or upload a video file (MP4, MOV, WEBM &mdash; up to 500MB).</p>

              {mode === 'idle' && (
                <div className="upload-options">
                  <button className="upload-option" onClick={() => setMode('record')}>
                    <div className="upload-option-icon" style={{ background: '#FF6F61' }}>
                      <Video size={28} strokeWidth={2} color="white" />
                    </div>
                    <div className="upload-option-label">Record now</div>
                    <div className="upload-option-sub">Use your webcam & mic</div>
                  </button>
                  <button className="upload-option" onClick={() => fileRef.current?.click()}>
                    <div className="upload-option-icon" style={{ background: '#3B82F6' }}>
                      <Upload size={28} strokeWidth={2} color="white" />
                    </div>
                    <div className="upload-option-label">Upload file</div>
                    <div className="upload-option-sub">MP4, MOV, or WEBM</div>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              )}

              {mode === 'record' && (
                <div className="record-area">
                  <div className="record-preview">
                    <Mic size={48} strokeWidth={1.5} color="var(--muted-foreground)" />
                    <span>Camera preview will appear here</span>
                    <div className="record-controls">
                      <button className="btn btn-primary record-btn">
                        <span className="btn-label">Start recording</span>
                        <span className="btn-icon-badge"><Video size={16} strokeWidth={2.5} /></span>
                      </button>
                      <button className="btn btn-secondary" onClick={() => setMode('idle')}>
                        Cancel
                      </button>
                    </div>
                  </div>
                  <p className="record-tip">
                    <Clock size={14} /> Tip: DECA roleplays are typically 5–10 min. A countdown timer will appear when you start.
                  </p>
                </div>
              )}

              {mode === 'preview' && (
                <div className="preview-area">
                  <div className="preview-video">
                    <Video size={48} strokeWidth={1.5} color="var(--muted-foreground)" />
                    <span className="preview-filename">{fileName}</span>
                    <span className="preview-size">Ready to submit</span>
                  </div>
                  <div className="preview-actions">
                    <button className="btn btn-secondary" onClick={() => { setMode('idle'); setFileName('') }}>
                      <span className="btn-label">Re-record / change file</span>
                      <span className="btn-icon-badge"><RotateCcw size={14} strokeWidth={2.5} /></span>
                    </button>
                    <button className="btn btn-primary">
                      <span className="btn-label">Submit attempt</span>
                      <span className="btn-icon-badge"><Send size={14} strokeWidth={2.5} /></span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Past attempts */}
            {PAST_ATTEMPTS.length > 0 && (
              <div className="past-attempts">
                <h3>Previous attempts</h3>
                <div className="attempts-list">
                  {PAST_ATTEMPTS.map(a => (
                    <div className="attempt-row" key={a.num}>
                      <div>
                        <div className="attempt-title">Attempt {a.num}</div>
                        <div className="attempt-date">{a.date}</div>
                      </div>
                      <div className="attempt-right">
                        <div className="attempt-score">
                          <span className="attempt-score-val">{a.score}</span>
                          <span className="attempt-score-max">/ 5.0</span>
                        </div>
                        <span className="badge badge-reviewed">Reviewed</span>
                        <Link href={`/submissions/${ASSIGNMENT.id}`} className="btn btn-secondary attempt-btn">
                          View feedback
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: assignment details */}
          <aside className="submit-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-card-top">
                <span className="badge badge-pending">
                  <Clock size={12} strokeWidth={2.5} />
                  Due {ASSIGNMENT.due}
                </span>
              </div>
              <h3 className="sidebar-card-title">{ASSIGNMENT.title}</h3>
              <div className="sidebar-event">{ASSIGNMENT.event}</div>

              <div className="sidebar-section">
                <div className="sidebar-label">Instructions</div>
                <p className="sidebar-instructions">{ASSIGNMENT.instructions}</p>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Performance Indicators</div>
                <ul className="pi-list">
                  {ASSIGNMENT.pis.map(pi => (
                    <li key={pi.id} className="pi-list-item">
                      <span className="pi-tag">{pi.id}</span>
                      <span>{pi.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a href={ASSIGNMENT.casePromptUrl} className="btn btn-secondary sidebar-doc-btn">
                <span className="btn-label">Download case prompt</span>
                <span className="btn-icon-badge"><FileText size={14} strokeWidth={2.5} /></span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
