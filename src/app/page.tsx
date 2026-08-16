import Link from 'next/link'
import { ArrowRight, MessageSquare, BarChart2, ClipboardList, Video } from 'lucide-react'
import './home.css'

const features = [
  {
    icon: MessageSquare,
    color: '#0D9488',
    title: 'Timestamped Feedback',
    body: 'Drop comment pins at the exact moment that needs coaching — no more vague end-of-video notes.',
  },
  {
    icon: ClipboardList,
    color: '#FF6F61',
    title: 'Rubric-Based Scoring',
    body: 'Score every Performance Indicator from the official DECA rubric, right inside the video review.',
  },
  {
    icon: BarChart2,
    color: '#3B82F6',
    title: 'Progress Tracking',
    body: 'Students see their PI scores trend upward across attempts. Teachers spot class-wide weak spots at a glance.',
  },
  {
    icon: Video,
    color: '#F59E0B',
    title: 'Record or Upload',
    body: 'Students record directly in the browser or upload a file from their phone — no extra software needed.',
  },
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="hero section">
        <div className="hero-shapes" aria-hidden="true">
          <div className="hero-shape hero-shape--circle" />
          <div className="hero-shape hero-shape--square" />
          <div className="hero-shape hero-shape--pill" />
          <div className="hero-shape hero-shape--triangle" />
        </div>
        <div className="container hero-inner">
          <div className="hero-badge">
            <span>Built for DECA</span>
          </div>
          <h1 className="hero-title">
            Coach every rep.<br />
            Not just the <span className="brand-highlight">final score.</span>
          </h1>
          <p className="hero-sub">
            Students upload roleplay videos. Teachers drop timestamped comments, score Performance Indicators, and track improvement — all in one place.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="btn btn-primary">
              <span className="btn-label">Get started</span>
              <span className="btn-icon-badge"><ArrowRight size={18} strokeWidth={2.5} /></span>
            </Link>
            <Link href="/assignments" className="btn btn-secondary">
              <span className="btn-label">View assignments</span>
            </Link>
          </div>

          <div className="hero-preview">
            <div className="hero-preview-bar">
              <span className="hero-preview-dot" style={{ background: '#FF6F61' }} />
              <span className="hero-preview-dot" style={{ background: '#F59E0B' }} />
              <span className="hero-preview-dot" style={{ background: '#0D9488' }} />
            </div>
            <div className="hero-preview-body">
              <div className="hero-preview-video">
                <Video size={48} strokeWidth={1.5} color="var(--muted-foreground)" />
                <span>Marketing Cluster Roleplay #2</span>
              </div>
              <div className="hero-preview-timeline">
                <div className="hero-timeline-track">
                  <div className="hero-timeline-fill" style={{ width: '42%' }} />
                  <div className="hero-timeline-marker" style={{ left: '18%', background: '#0D9488' }} />
                  <div className="hero-timeline-marker" style={{ left: '31%', background: '#FF6F61' }} />
                  <div className="hero-timeline-marker" style={{ left: '42%', background: '#3B82F6' }} />
                </div>
                <div className="hero-timeline-labels">
                  <span>0:00</span>
                  <span>5:00</span>
                </div>
              </div>
              <div className="hero-preview-comment">
                <span className="hero-preview-tag" style={{ background: '#CCFBF1', color: '#0D9488' }}>✅ Strength</span>
                <p>&ldquo;Great opening — you immediately identified the customer&apos;s need.&rdquo;</p>
                <span className="hero-preview-ts">@ 0:54</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features section">
        <div className="container">
          <div className="features-header">
            <h2>Everything your team needs to improve</h2>
            <p>From first attempt to state competition — DECA Coach has the whole workflow covered.</p>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, color, title, body }) => (
              <div className="card" key={title} style={{ '--card-color': color } as React.CSSProperties}>
                <div className="card-icon-badge">
                  <Icon size={24} strokeWidth={2} />
                </div>
                <h3 className="card-title">{title}</h3>
                <p className="card-body">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how section">
        <div className="container">
          <div className="how-header">
            <h2>How it works</h2>
          </div>
          <div className="how-steps">
            {[
              { num: '01', title: 'Teacher creates an assignment', desc: 'Pick the DECA event, set a due date, attach the official case prompt, and choose which PIs to focus on.' },
              { num: '02', title: 'Student records & submits', desc: 'Record directly in the browser or upload a file from their phone — then submit against the assignment.' },
              { num: '03', title: 'Teacher reviews with pinned comments', desc: 'Watch the video and click "Add comment" at any moment. Each pin lands right on the timeline, color-coded by type.' },
              { num: '04', title: 'Student levels up', desc: 'Get notified when feedback is ready, see every pinned comment, respond to questions, and track PI score trends over time.' },
            ].map(step => (
              <div className="how-step" key={step.num}>
                <div className="how-step-num">{step.num}</div>
                <div>
                  <h4 className="how-step-title">{step.title}</h4>
                  <p className="how-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section section">
        <div className="container cta-inner">
          <div className="cta-shapes" aria-hidden="true">
            <div className="cta-shape cta-shape--a" />
            <div className="cta-shape cta-shape--b" />
          </div>
          <h2>Ready to level up your chapter?</h2>
          <p>Stop leaving feedback in the margins of a scoresheet. Give your students timestamped, actionable coaching.</p>
          <Link href="/dashboard" className="btn btn-primary">
            <span className="btn-label">Get started free</span>
            <span className="btn-icon-badge"><ArrowRight size={18} strokeWidth={2.5} /></span>
          </Link>
        </div>
      </section>
    </main>
  )
}
