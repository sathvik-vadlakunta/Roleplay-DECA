'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, Play, Pause, Plus, CheckCircle, AlertTriangle, HelpCircle, Bookmark, Send, X } from 'lucide-react'
import './review.css'

type CommentType = 'strength' | 'improve' | 'question' | 'pi'

const TYPE_CONFIG: Record<CommentType, { label: string; emoji: string; color: string; bg: string }> = {
  strength: { label: 'Strength',         emoji: '✅', color: '#0D9488', bg: '#CCFBF1' },
  improve:  { label: 'Needs improvement',emoji: '⚠️', color: '#FF6F61', bg: '#FFE4E1' },
  question: { label: 'Question',         emoji: '❓', color: '#3B82F6', bg: '#DBEAFE' },
  pi:       { label: 'PI Reference',     emoji: '📌', color: '#F59E0B', bg: '#FEF3C7' },
}

const RUBRIC_PIS = [
  { id: 'PI 2.1', label: 'Identify customer needs' },
  { id: 'PI 2.3', label: 'Ask clarifying questions' },
  { id: 'PI 3.4', label: 'Close the sale professionally' },
]

const MOCK_COMMENTS = [
  { id: '1', type: 'strength' as CommentType,  ts: 54,  tsLabel: '0:54', text: 'Great opening — you immediately identified the customer\'s need.', pi: null },
  { id: '2', type: 'improve'  as CommentType,  ts: 112, tsLabel: '1:52', text: 'Missing a clarifying question here. You should ask about their budget or timeline.', pi: 'PI 2.3' },
  { id: '3', type: 'question' as CommentType,  ts: 178, tsLabel: '2:58', text: 'How would you handle it if the judge pushed back on your pricing recommendation?', pi: null },
  { id: '4', type: 'pi'       as CommentType,  ts: 245, tsLabel: '4:05', text: 'Good use of the closing technique here — but follow it with silence to let the judge respond.', pi: 'PI 3.4' },
]

const TOTAL_SECS = 360

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function ReviewPage() {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(42)
  const [comments, setComments] = useState(MOCK_COMMENTS)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<CommentType>('strength')
  const [formText, setFormText] = useState('')
  const [formPi, setFormPi] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({ 'PI 2.1': 4, 'PI 2.3': 2, 'PI 3.4': 3 })
  const [filterType, setFilterType] = useState<CommentType | 'all'>('all')
  const trackRef = useRef<HTMLDivElement>(null)

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setCurrentTime(Math.round(pct * TOTAL_SECS))
  }

  function addComment() {
    if (!formText.trim()) return
    const newComment = {
      id: String(Date.now()),
      type: formType,
      ts: currentTime,
      tsLabel: fmtTime(currentTime),
      text: formText,
      pi: formPi || null,
    }
    setComments(prev => [...prev, newComment].sort((a, b) => a.ts - b.ts))
    setFormText('')
    setFormPi('')
    setShowForm(false)
  }

  const pct = (currentTime / TOTAL_SECS) * 100
  const overallScore = (Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length).toFixed(1)
  const filtered = filterType === 'all' ? comments : comments.filter(c => c.type === filterType)

  return (
    <main className="review-page">
      <div className="container">
        <Link href="/dashboard" className="back-link">
          <ChevronLeft size={18} strokeWidth={2.5} />
          Back to dashboard
        </Link>

        <div className="review-header">
          <div>
            <h1>Priya Sharma — Attempt 1</h1>
            <p>Marketing Cluster Roleplay #2 &middot; Submitted Aug 14, 2026</p>
          </div>
          <button className="btn btn-primary">
            <span className="btn-label">Publish feedback</span>
            <span className="btn-icon-badge"><Send size={16} strokeWidth={2.5} /></span>
          </button>
        </div>

        <div className="review-layout">
          {/* Left: video player */}
          <div className="review-player-col">
            {/* Video */}
            <div className="video-wrapper">
              <div className="video-screen">
                <div className="video-placeholder">
                  <Play size={64} strokeWidth={1.5} color="white" />
                </div>
              </div>

              {/* Controls */}
              <div className="video-controls">
                <button className="play-btn" onClick={() => setPlaying(v => !v)}>
                  {playing
                    ? <Pause size={18} strokeWidth={2.5} />
                    : <Play  size={18} strokeWidth={2.5} />
                  }
                </button>
                <span className="time-display">{fmtTime(currentTime)} / {fmtTime(TOTAL_SECS)}</span>
              </div>

              {/* Timeline */}
              <div className="timeline-wrap">
                <div className="timeline-track" ref={trackRef} onClick={seekTo}>
                  <div className="timeline-fill" style={{ width: `${pct}%` }} />
                  {comments.map(c => (
                    <div
                      key={c.id}
                      className="timeline-pin"
                      style={{
                        left: `${(c.ts / TOTAL_SECS) * 100}%`,
                        background: TYPE_CONFIG[c.type].color,
                      }}
                      title={`${TYPE_CONFIG[c.type].emoji} ${c.tsLabel} — ${c.text.slice(0, 40)}…`}
                      onClick={e => { e.stopPropagation(); setCurrentTime(c.ts) }}
                    />
                  ))}
                </div>
                <div className="timeline-labels">
                  <span>0:00</span>
                  <span>{fmtTime(TOTAL_SECS)}</span>
                </div>
              </div>

              {/* Add comment button */}
              <button className="add-comment-btn btn btn-primary" onClick={() => setShowForm(v => !v)}>
                <span className="btn-label">
                  {showForm ? 'Cancel' : `Add comment at ${fmtTime(currentTime)}`}
                </span>
                <span className="btn-icon-badge">
                  {showForm ? <X size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
                </span>
              </button>
            </div>

            {/* Comment form */}
            {showForm && (
              <div className="comment-form">
                <div className="comment-form-header">
                  <span className="comment-form-ts">Pinning at {fmtTime(currentTime)}</span>
                  <h4>Add a comment</h4>
                </div>

                <div className="type-picker">
                  {(Object.keys(TYPE_CONFIG) as CommentType[]).map(t => (
                    <button
                      key={t}
                      className={`type-btn${formType === t ? ' type-btn--active' : ''}`}
                      style={formType === t ? { background: TYPE_CONFIG[t].bg, borderColor: TYPE_CONFIG[t].color, color: TYPE_CONFIG[t].color } : {}}
                      onClick={() => setFormType(t)}
                    >
                      {TYPE_CONFIG[t].emoji} {TYPE_CONFIG[t].label}
                    </button>
                  ))}
                </div>

                {(formType === 'improve' || formType === 'pi') && (
                  <div className="field">
                    <label htmlFor="form-pi">Link to Performance Indicator</label>
                    <select id="form-pi" value={formPi} onChange={e => setFormPi(e.target.value)}>
                      <option value="">— None —</option>
                      {RUBRIC_PIS.map(p => (
                        <option key={p.id} value={p.id}>{p.id} — {p.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="form-text">Your comment</label>
                  <textarea
                    id="form-text"
                    rows={3}
                    placeholder="What do you want to tell the student about this moment?"
                    value={formText}
                    onChange={e => setFormText(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary" onClick={addComment}>
                  <span className="btn-label">Pin comment</span>
                  <span className="btn-icon-badge"><Plus size={16} strokeWidth={2.5} /></span>
                </button>
              </div>
            )}

            {/* Rubric */}
            <div className="rubric-card">
              <div className="rubric-header">
                <h3>Rubric Scores</h3>
                <div className="overall-score">
                  <span className="overall-val">{overallScore}</span>
                  <span className="overall-max">/ 5.0 avg</span>
                </div>
              </div>
              <div className="rubric-rows">
                {RUBRIC_PIS.map(pi => (
                  <div className="rubric-row" key={pi.id}>
                    <div className="rubric-pi-info">
                      <span className="pi-tag">{pi.id}</span>
                      <span className="rubric-pi-label">{pi.label}</span>
                    </div>
                    <div className="score-dots">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          className={`score-dot${scores[pi.id] === n ? ' score-dot--active' : ''}`}
                          onClick={() => setScores(prev => ({ ...prev, [pi.id]: n }))}
                          title={`Score ${n}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: comments sidebar */}
          <aside className="review-sidebar">
            <div className="sidebar-comments">
              <div className="comments-header">
                <h3>Feedback ({comments.length})</h3>
                <div className="filter-row">
                  {(['all', ...Object.keys(TYPE_CONFIG)] as Array<'all' | CommentType>).map(t => (
                    <button
                      key={t}
                      className={`filter-btn${filterType === t ? ' filter-btn--active' : ''}`}
                      onClick={() => setFilterType(t)}
                    >
                      {t === 'all' ? 'All' : TYPE_CONFIG[t as CommentType].emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="comment-list">
                {filtered.map(c => {
                  const cfg = TYPE_CONFIG[c.type]
                  const TypeIcon =
                    c.type === 'strength' ? CheckCircle :
                    c.type === 'improve'  ? AlertTriangle :
                    c.type === 'question' ? HelpCircle :
                    Bookmark
                  return (
                    <div
                      className="comment-item"
                      key={c.id}
                      onClick={() => setCurrentTime(c.ts)}
                    >
                      <div className="comment-item-top">
                        <span
                          className="comment-type-pill"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <TypeIcon size={12} strokeWidth={2.5} />
                          {cfg.label}
                        </span>
                        <span className="comment-ts">{c.tsLabel}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                      {c.pi && <span className="comment-pi pi-tag">{c.pi}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
