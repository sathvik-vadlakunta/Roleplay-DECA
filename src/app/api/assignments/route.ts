import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/supabase/admin'

// GET /api/assignments?class_id=X — list assignments for a class (student view)
export async function GET(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { searchParams } = new URL(req.url)
  const classId = searchParams.get('class_id')
  if (!classId) return NextResponse.json([], { status: 400 })

  const admin = adminClient()
  const { data } = await admin
    .from('assignments')
    .select('id, name, description, event_type, due_date, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

// POST /api/assignments — create a new assignment
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

  // Verify teacher owns this class
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
      name: name.trim(),
      description: description?.trim() ?? '',
      event_type: event_type?.trim() ?? '',
      due_date: due_date || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
