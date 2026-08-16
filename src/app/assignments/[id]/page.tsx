'use client'
import { useState, useRef, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, Video, RotateCcw, Send, ChevronLeft, FileText, Clock, Square, Circle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import './submit.css'

type Mode = 'idle' | 'record' | 'upload' | 'preview' | 'uploading' | 'success'
type RecordState = 'camera' | 'recording' | 'done'

function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function SubmitAssignment({ params }: { params: Promise<{ id: string }> }) {
  const { id: assignmentId } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('idle')
  const [recordState, setRecordState] = useState<RecordState>('camera')
  const [fileName, setFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [camError, setCamError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [pastAttempts, setPastAttempts] = useState<{ num: number; date: string; score: number | null; status: string; id: string }[]>([])

  const fileRef = useRef<HTMLInputElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load past attempts for this assignment
  useEffect(() => {
    if (!user) return
    supabase
      .from('submissions')
      .select('id, attempt_number, created_at, status, scores(score)')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .order('attempt_number', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        setPastAttempts(data.map((s: { id: string; attempt_number: number; created_at: string; status: string; scores: { score: number }[] }) => ({
          id: s.id,
          num: s.attempt_number,
          date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: s.status,
          score: s.scores?.length
            ? s.scores.reduce((a: number, b: { score: number }) => a + b.score, 0) / s.scores.length
            : null,
        })))
      })
  }, [user, assignmentId, supabase])

  // Start camera when record mode is entered
  useEffect(() => {
    if (mode !== 'record') return
    setCamError('')
    setRecordState('camera')
    setElapsed(0)

    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true })
      .then(stream => {
        streamRef.current = stream
        if (liveVideoRef.current) liveVideoRef.current.srcObject = stream
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
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'

    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setVideoBlob(blob)
      setPreviewUrl(url)
      setFileName(`recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`)
      stopCamera()
      setRecordState('done')
    }

    recorder.start(250)
    setRecordState('recording')
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }

  useEffect(() => {
    if (previewVideoRef.current && previewUrl) previewVideoRef.current.src = previewUrl
  }, [previewUrl])

  useEffect(() => {
    if (recordState === 'done' && previewUrl) setMode('preview')
  }, [recordState, previewUrl])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setVideoBlob(f)
    setPreviewUrl(URL.createObjectURL(f))
    setFileName(f.name)
    setMode('preview')
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setFileName('')
    setVideoBlob(null)
    setElapsed(0)
    setSubmitError('')
    setMode('idle')
  }

  async function handleSubmit() {
    if (!videoBlob || !user) return
    setSubmitError('')
    setMode('uploading')
    setUploadProgress(0)

    try {
      const nextAttempt = pastAttempts.length + 1
      const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm'
      const storagePath = `${user.id}/${assignmentId}/attempt_${nextAttempt}.${ext}`

      // Upload video to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, videoBlob, {
          contentType: videoBlob.type,
          upsert: true,
        })

      if (uploadError) throw uploadError

      setUploadProgress(80)

      // Create submission record
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: user.id,
          attempt_number: nextAttempt,
          video_url: storagePath,
          status: 'submitted',
        })

      if (insertError) throw insertError

      setUploadProgress(100)
      setMode('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setSubmitError(msg)
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
          <div className="submit-main">
            <div className="submit-card">
              <h2>Submit your roleplay</h2>
              <p>Record directly in the browser or upload a video file (MP4, MOV, WEBM &mdash; up to 500 MB).</p>

              {/* ── IDLE ── */}
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
                  <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              )}

              {/* ── RECORD ── */}
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
                        <video ref={liveVideoRef} autoPlay muted playsInline className="live-video" />
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
                            <button className="btn btn-secondary" onClick={reset}>Cancel</button>
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

              {/* ── PREVIEW ── */}
              {mode === 'preview' && (
                <div className="preview-area">
                  <video ref={previewVideoRef} controls playsInline className="preview-video-player" />
                  <div className="preview-filename-row">
                    <Video size={16} strokeWidth={2} color="var(--secondary)" />
                    <span className="preview-filename">{fileName}</span>
                  </div>
                  {submitError && <p className="submit-error">{submitError}</p>}
                  <div className="preview-actions">
                    <button className="btn btn-secondary" onClick={reset}>
                      <span className="btn-label">Re-record / change file</span>
                      <span className="btn-icon-badge"><RotateCcw size={14} strokeWidth={2.5} /></span>
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit}>
                      <span className="btn-label">Submit attempt</span>
                      <span className="btn-icon-badge"><Send size={14} strokeWidth={2.5} /></span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── UPLOADING ── */}
              {mode === 'uploading' && (
                <div className="uploading-area">
                  <div className="upload-progress-label">Uploading your video…</div>
                  <div className="upload-progress-track">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="upload-progress-sub">Don&apos;t close this tab</p>
                </div>
              )}

              {/* ── SUCCESS ── */}
              {mode === 'success' && (
                <div className="success-area">
                  <div className="success-icon">
                    <CheckCircle size={48} strokeWidth={1.5} color="var(--secondary)" />
                  </div>
                  <h3>Submitted!</h3>
                  <p>Your roleplay has been submitted. You&apos;ll get a notification when your teacher leaves feedback.</p>
                  <div className="success-actions">
                    <Link href="/dashboard" className="btn btn-primary">
                      <span className="btn-label">Go to dashboard</span>
                    </Link>
                    <button className="btn btn-secondary" onClick={reset}>
                      <span className="btn-label">Submit another attempt</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Past attempts */}
            {pastAttempts.length > 0 && (
              <div className="past-attempts">
                <h3>Previous attempts</h3>
                <div className="attempts-list">
                  {pastAttempts.map(a => (
                    <div className="attempt-row" key={a.id}>
                      <div>
                        <div className="attempt-title">Attempt {a.num}</div>
                        <div className="attempt-date">{a.date}</div>
                      </div>
                      <div className="attempt-right">
                        {a.score !== null && (
                          <div className="attempt-score">
                            <span className="attempt-score-val">{a.score.toFixed(1)}</span>
                            <span className="attempt-score-max">/ 5.0</span>
                          </div>
                        )}
                        <span className={`badge badge-${a.status}`}>{a.status}</span>
                        <Link href={`/submissions/${a.id}`} className="btn btn-secondary attempt-btn">
                          View feedback
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="submit-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-card-top">
                <span className="badge badge-pending">
                  <Clock size={12} strokeWidth={2.5} />
                  Assignment #{assignmentId}
                </span>
              </div>
              <h3 className="sidebar-card-title">Roleplay Assignment</h3>
              <div className="sidebar-event">DECA Competitive Event</div>

              <div className="sidebar-section">
                <div className="sidebar-label">Instructions</div>
                <p className="sidebar-instructions">
                  Record your roleplay and submit it for teacher feedback. Make sure your audio and video are clear before submitting.
                </p>
              </div>

              <a href="#" className="btn btn-secondary sidebar-doc-btn">
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
