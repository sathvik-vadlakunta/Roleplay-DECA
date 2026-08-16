'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, CheckCircle, AlertTriangle, HelpCircle, Bookmark, Play, Star } from 'lucide-react'
import './submission.css'

type CommentType = 'strength' | 'improve' | 'question' | 'pi'

const TYPE_CONFIG: Record<CommentType, { label: string; emoji: string; color: string; bg: string }> = {
  strength: { label: 'Strength',          emoji: '✅', color: '#0D9488', bg: '#CCFBF1' },
  improve:  { label: 'Needs improvement', emoji: '⚠️', color: '#FF6F61', bg: '#FFE4E1' },
  question: { label: 'Question',          emoji: '❓', color: '#3B82F6', bg: '#DBEAFE' },
  pi:       { label: 'PI Reference',      emoji: '📌', color: '#F59E0B', bg: '#FEF3C7' },
}

const FEEDBACK = [
  { id: '1', type: 'strength' as CommentType, ts: 54,  tsLabel: '0:54', text: 'Great opening — you immediately identified the customer\'s need.', pi: null },
  { id: '2', type: 'improve'  as CommentType, ts: 112, tsLabel: '1:52', text: 'Missing a clarifying question here. You should ask about their budget or timeline.', pi: 'PI 2.3' },
  { id: '3', type: 'question' as CommentType, ts: 178, tsLabel: '2:58', text: 'How would you handle it if the judge pushed back on your pricing recommendation?', pi: null },
  { id: '4', type: 'pi'       as CommentType, ts: 245, tsLabel: '4:05', text: 'Good use of the closing technique here — but follow it with silence to let the judge respond.', pi: 'PI 3.4' },
]

const SCORES = [
  { pi: 'PI 2.1', label: 'Identify customer needs',      score: 4 },
  { pi: 'PI 2.3', label: 'Ask clarifying questions',     score: 2 },
  { pi: 'PI 3.4', label: 'Close the sale professionally', score: 3 },
]

const TOTAL_SECS = 360

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function SubmissionPage() {
  const [currentTime, setCurrentTime] = useState(0)

  const avg = (SCORES.reduce((a, b) => a + b.score, 0) / SCORES.length).toFixed(1)
  const pct = (currentTime / TOTAL_SECS) * 100

  return (
    <main className="sub-page">
      <div className="container">
        <Link href="/dashboard" className="back-link">
          <ChevronLeft size={18} strokeWidth={2.5} />
          Dashboard
        </Link>

        <div className="sub-header">
          <div>
            <h1>Marketing Cluster Roleplay #2 — Attempt 1</h1>
            <p>Reviewed by Coach Davis &middot; Aug 15, 2026</p>
          </div>
          <div className="sub-score-badge">
            <Star size={16} strokeWidth={2.5} color="#F59E0B" />
            <span className="sub-score-val">{avg}</span>
            <span className="sub-score-max">/ 5.0</span>
          </div>
        </div>

        <div className="sub-layout">
          {/* Video */}
          <div className="sub-player-col">
            <div className="video-wrapper">
              <div className="video-screen">
                <div className="video-placeholder">
                  <Play size={64} strokeWidth={1.5} color="white" />
                </div>
              </div>
              <div className="timeline-wrap">
                <div
                  className="timeline-track"
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                    setCurrentTime(Math.round(p * TOTAL_SECS))
                  }}
                >
                  <div className="timeline-fill" style={{ width: `${pct}%` }} />
                  {FEEDBACK.map(f => (
                    <div
                      key={f.id}
                      className="timeline-pin"
                      style={{ left: `${(f.ts / TOTAL_SECS) * 100}%`, background: TYPE_CONFIG[f.type].color }}
                      onClick={e => { e.stopPropagation(); setCurrentTime(f.ts) }}
                    />
                  ))}
                </div>
                <div className="timeline-labels">
                  <span>0:00</span>
                  <span>{fmtTime(TOTAL_SECS)}</span>
                </div>
              </div>
            </div>

            {/* Rubric scores */}
            <div className="rubric-card">
              <h3>Your Scores</h3>
              <div className="score-rows">
                {SCORES.map(s => (
                  <div className="score-row" key={s.pi}>
                    <div className="score-row-left">
                      <span className="pi-tag">{s.pi}</span>
                      <span className="score-row-label">{s.label}</span>
                    </div>
                    <div className="score-row-right">
                      <div className="score-bar-wrap">
                        <div className="score-bar" style={{ width: `${(s.score / 5) * 100}%` }} />
                      </div>
                      <span className="score-num">{s.score}<span className="score-num-max">/5</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comments */}
          <aside className="sub-sidebar">
            <div className="comments-box">
              <h3>Feedback ({FEEDBACK.length} comments)</h3>
              <div className="comment-list">
                {FEEDBACK.map(f => {
                  const cfg = TYPE_CONFIG[f.type]
                  const Icon =
                    f.type === 'strength' ? CheckCircle :
                    f.type === 'improve'  ? AlertTriangle :
                    f.type === 'question' ? HelpCircle :
                    Bookmark
                  return (
                    <div
                      className={`comment-item${currentTime === f.ts ? ' comment-item--active' : ''}`}
                      key={f.id}
                      onClick={() => setCurrentTime(f.ts)}
                    >
                      <div className="comment-item-top">
                        <span className="comment-type-pill" style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon size={12} strokeWidth={2.5} />
                          {cfg.label}
                        </span>
                        <span className="comment-ts">{f.tsLabel}</span>
                      </div>
                      <p className="comment-text">{f.text}</p>
                      {f.pi && <span className="comment-pi pi-tag">{f.pi}</span>}
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
