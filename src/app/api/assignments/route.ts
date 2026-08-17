import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/supabase/admin'

// GET /api/assignments — for students: their class assignments + submission status
//                      — for teachers: pass ?class_id=X
export async function GET(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const admin = adminClient()
  const { searchParams } = new URL(req.url)
  const paramClassId = searchParams.get('class_id')

  // Resolve class_id — use param if given, otherwise look up student's class
  let classId = paramClassId
  if (!classId) {
    const { data: profile } = await admin
      .from('profiles')
      .select('class_id')
      .eq('id', user.id)
      .single()
    classId = profile?.class_id ?? null
  }

  if (!classId) return NextResponse.json([])

  const { data: assignments } = await admin
    .from('assignments')
    .select('id, title, description, event_type, due_date, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  if (!assignments?.length) return NextResponse.json([])

  // Fetch this student's latest submission per assignment
  const { data: submissions } = await admin
    .from('submissions')
    .select('id, assignment_id, attempt_number, status, created_at')
    .eq('student_id', user.id)
    .in('assignment_id', assignments.map(a => a.id))
    .order('attempt_number', { ascending: false })

  // Latest submission per assignment
  const latestByAssignment: Record<string, { id: string; status: string; attempt_number: number }> = {}
  for (const s of submissions ?? []) {
    if (!latestByAssignment[s.assignment_id]) {
      latestByAssignment[s.assignment_id] = { id: s.id, status: s.status, attempt_number: s.attempt_number }
    }
  }

  return NextResponse.json(
    assignments.map(a => ({
      ...a,
      submission: latestByAssignment[a.id] ?? null,
    }))
  )
}

// POST /api/assignments — create a new assignment (teachers only)
export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = adminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { class_id, name, description, event_type, due_date } = body

  if (!class_id || !name?.trim()) {
    return NextResponse.json({ error: 'class_id and name are required' }, { status: 400 })
  }

  const { data: cls } = await admin
    .from('classes')
    .select('teacher_id')
    .eq('id', class_id)
    .single()

  if (cls?.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('assignments')
    .insert({
      class_id,
      teacher_id: user.id,
      title: name.trim(),
      description: description?.trim() ?? '',
      event_type: event_type?.trim() ?? '',
      due_date: due_date || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
