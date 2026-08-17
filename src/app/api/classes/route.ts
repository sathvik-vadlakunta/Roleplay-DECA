import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/supabase/admin'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const admin = adminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role, class_id')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'teacher') {
    const { data: classes } = await admin
      .from('classes')
      .select('id, name, join_code, teacher_id')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    const withCounts = await Promise.all(
      (classes ?? []).map(async cls => {
        const { count } = await admin
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', cls.id)
        return { ...cls, student_count: count ?? 0 }
      })
    )
    return NextResponse.json(withCounts)
  }

  if (profile?.class_id) {
    const { data: cls } = await admin
      .from('classes')
      .select('id, name, join_code, teacher_id')
      .eq('id', profile.class_id)
      .single()
    return NextResponse.json(cls ? [cls] : [])
  }

  return NextResponse.json([])
}

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

  const { name, join_code } = await req.json()
  const { data, error } = await admin
    .from('classes')
    .insert({ name, teacher_id: user.id, join_code })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, join_code } = await req.json()
  const admin = adminClient()

  const { error } = await admin
    .from('classes')
    .update({ join_code })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
