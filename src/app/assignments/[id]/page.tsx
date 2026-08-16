'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Upload, Video, RotateCcw, Send, ChevronLeft, FileText, Clock, Square, Circle } from 'lucide-react'
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

type Mode = 'idle' | 'record' | 'upload' | 'preview'
type RecordState = 'camera' | 'recording' | 'done'

function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function SubmitAssignment() {
  const [mode, setMode] = useState<Mode>('idle')
  const [recordState, setRecordState] = useState<RecordState>('camera')
  const [fileName, setFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [camError, setCamError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start camera as soon as record mode is entered
  useEffect(() => {
    if (mode !== 'record') return

    setCamError('')
    setRecordState('camera')
    setElapsed(0)

    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true })
      .then(stream => {
        streamRef.current = stream
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream
        }
      })
      .catch(err => {
        const msg =
          err.name === 'NotAllowedError' ? 'Camera permission denied. Allow access in your browser settings and try again.' :
          err.name === 'NotFoundError'   ? 'No camera or microphone found on this device.' :
          'Could not access camera: ' + err.message
        setCamError(msg)
      })

    return () => stopCamera()
  }, [mode])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  function startRecording() {
    if (!streamRef.current) return
    chunksRef.current = []

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4'

    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setFileName(`recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`)
      stopCamera()
      setRecordState('done')
    }

    recorder.start(250) // collect chunks every 250ms
    setRecordState('recording')

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }

  function finishRecording() {
    // move to the preview mode after the recorder.onstop fires
    setMode('preview')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    setFileName(f.name)
    setMode('preview')
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setFileName('')
    setElapsed(0)
    setMode('idle')
  }

  // Wire preview video src when url arrives
  useEffect(() => {
    if (previewVideoRef.current && previewUrl) {
      previewVideoRef.current.src = previewUrl
    }
  }, [previewUrl])

  // When recordState hits 'done', switch to preview mode
  useEffect(() => {
    if (recordState === 'done' && previewUrl) {
      setMode('preview')
    }
  }, [recordState, previewUrl])

  return (
    <main className="submit-page">
      <div className="container">
        <Link href="/assignments" className="back-link">
          <ChevronLeft size={18} strokeWidth={2.5} />
          All assignments
        </Link>

        <div className="submit-layout">
          <div className="submit-main">
            <div className="submit-card">
              <h2>Submit your roleplay</h2>
              <p>Record directly in the browser or upload a video file (MP4, MOV, WEBM &mdash; up to 500 MB).</p>

              {/* ── IDLE: choose method ── */}
              {mode === 'idle' && (
                <div className="upload-options">
                  <button className="upload-option" onClick={() => setMode('record')}>
                    <div className="upload-option-icon" style={{ background: '#FF6F61' }}>
                      <Video size={28} strokeWidth={2} color="white" />
                    </div>
                    <div className="upload-option-label">Record now</div>
                    <div className="upload-option-sub">Use your webcam &amp; mic</div>
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

              {/* ── RECORD: live camera ── */}
              {mode === 'record' && (
                <div className="record-area">
                  {camError ? (
                    <div className="cam-error">
                      <p>{camError}</p>
                      <button className="btn btn-secondary" onClick={reset}>Go back</button>
                    </div>
                  ) : (
                    <>
                      <div className="record-preview">
                        <video
                          ref={liveVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="live-video"
                        />
                        {recordState === 'recording' && (
                          <div className="record-badge">
                            <span className="record-dot" />
                            REC {fmtDuration(elapsed)}
                          </div>
                        )}
                      </div>

                      <div className="record-controls">
                        {recordState === 'camera' && (
                          <>
                            <button className="btn btn-primary" onClick={startRecording}>
                              <span className="btn-label">Start recording</span>
                              <span className="btn-icon-badge"><Circle size={14} strokeWidth={2.5} /></span>
                            </button>
                            <button className="btn btn-secondary" onClick={reset}>
                              Cancel
                            </button>
                          </>
                        )}
                        {recordState === 'recording' && (
                          <button className="btn btn-primary stop-btn" onClick={stopRecording}>
                            <span className="btn-label">Stop recording</span>
                            <span className="btn-icon-badge"><Square size={14} strokeWidth={2.5} /></span>
                          </button>
                        )}
                      </div>

                      {recordState === 'camera' && (
                        <p className="record-tip">
                          <Clock size={14} />
                          DECA roleplays are typically 5–10 min. A timer will appear when you start.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── PREVIEW: review before submitting ── */}
              {mode === 'preview' && (
                <div className="preview-area">
                  <video
                    ref={previewVideoRef}
                    controls
                    playsInline
                    className="preview-video-player"
                  />
                  <div className="preview-filename-row">
                    <Video size={16} strokeWidth={2} color="var(--secondary)" />
                    <span className="preview-filename">{fileName}</span>
                  </div>
                  <div className="preview-actions">
                    <button className="btn btn-secondary" onClick={reset}>
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
