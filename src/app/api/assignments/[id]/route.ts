import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/supabase/admin'

async function verifyTeacherOwnsAssignment(admin: ReturnType<typeof adminClient>, assignmentId: string, userId: string) {
  const { data: assignment } = await admin
    .from('assignments')
    .select('id, class_id, title, description, event_type, due_date, created_at')
    .eq('id', assignmentId)
    .single()

  if (!assignment) return { assignment: null, allowed: false }

  const { data: cls } = await admin
    .from('classes')
    .select('teacher_id')
    .eq('id', assignment.class_id)
    .single()

  return { assignment, allowed: cls?.teacher_id === userId }
}

// GET /api/assignments/[id] — assignment details + per-student submission summary
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const { id } = await params
  const admin = adminClient()
  const { assignment, allowed } = await verifyTeacherOwnsAssignment(admin, id, user.id)

  if (!assignment) return NextResponse.json(null, { status: 404 })
  if (!allowed) return NextResponse.json(null, { status: 403 })

  // All students in the class
  const { data: students } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('class_id', assignment.class_id)
    .order('full_name')

  // All submissions for this assignment with scores
  const { data: submissions } = await admin
    .from('submissions')
    .select('id, student_id, attempt_number, created_at, status, scores(score)')
    .eq('assignment_id', id)
    .order('attempt_number', { ascending: true })

  // Group by student — keep all attempts, derive latest
  const subsByStudent = (submissions ?? []).reduce<Record<string, typeof submissions>>((acc, s) => {
    if (!acc[s.student_id]) acc[s.student_id] = []
    acc![s.student_id]!.push(s)
    return acc
  }, {})

  const studentSummaries = (students ?? []).map(student => {
    const attempts = subsByStudent[student.id] ?? []
    const latest = attempts.at(-1) ?? null
    const scores = latest?.scores as { score: number }[] | null
    const latestScore = scores?.length
      ? scores.reduce((a, b) => a + b.score, 0) / scores.length
      : null

    return {
      id: student.id,
      full_name: student.full_name,
      attempt_count: attempts.length,
      latest_submission_id: latest?.id ?? null,
      latest_date: latest?.created_at ?? null,
      latest_status: latest?.status ?? null,
      latest_score: latestScore,
    }
  })

  return NextResponse.json({ ...assignment, students: studentSummaries })
}

// PATCH /api/assignments/[id] — update fields
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = adminClient()
  const { allowed } = await verifyTeacherOwnsAssignment(admin, id, user.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { error } = await admin
    .from('assignments')
    .update({
      title: body.name?.trim(),
      description: body.description?.trim() ?? '',
      event_type: body.event_type?.trim() ?? '',
      due_date: body.due_date || null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/assignments/[id]
export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = adminClient()
  const { allowed } = await verifyTeacherOwnsAssignment(admin, id, user.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin.from('assignments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
