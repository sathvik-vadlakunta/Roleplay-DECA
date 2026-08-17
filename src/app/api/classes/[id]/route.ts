import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/supabase/admin'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const { id } = await params
  const admin = adminClient()

  const { data: cls } = await admin
    .from('classes')
    .select('*')
    .eq('id', id)
    .single()

  if (!cls) return NextResponse.json(null, { status: 404 })
  if (cls.teacher_id !== user.id) return NextResponse.json(null, { status: 403 })

  // Students in this class
  const { data: students } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('class_id', id)
    .order('full_name')

  // Assignments for this class
  const { data: assignments } = await admin
    .from('assignments')
    .select('id, name, description, event_type, due_date, created_at')
    .eq('class_id', id)
    .order('created_at', { ascending: false })

  const assignmentIds = (assignments ?? []).map(a => a.id)

  // All submissions across every assignment in this class
  const { data: allSubs } = assignmentIds.length
    ? await admin.from('submissions').select('id, assignment_id, student_id').in('assignment_id', assignmentIds)
    : { data: [] }

  // Per-assignment: count unique students who submitted
  const subsPerAssignment: Record<string, number> = {}
  for (const id of assignmentIds) {
    const unique = new Set((allSubs ?? []).filter(s => s.assignment_id === id).map(s => s.student_id))
    subsPerAssignment[id] = unique.size
  }

  // Per-student: total submission count across this class
  const studentIds = (students ?? []).map(s => s.id)
  const subsPerStudent: Record<string, number> = {}
  for (const sid of studentIds) {
    subsPerStudent[sid] = (allSubs ?? []).filter(s => s.student_id === sid).length
  }

  return NextResponse.json({
    ...cls,
    students: (students ?? []).map(s => ({
      ...s,
      submission_count: subsPerStudent[s.id] ?? 0,
    })),
    assignments: (assignments ?? []).map(a => ({
      ...a,
      submission_count: subsPerAssignment[a.id] ?? 0,
    })),
  })
}
