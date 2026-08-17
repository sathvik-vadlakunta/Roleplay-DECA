import { NextResponse } from 'next/server'
import { adminClient, getAuthUser } from '@/lib/supabase/admin'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json(null, { status: 401 })

  const admin = adminClient()
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, role, class_id')
    .eq('id', user.id)
    .single()

  if (data) return NextResponse.json(data)

  const meta = user.user_metadata ?? {}
  const role = meta.role === 'teacher' ? 'teacher' : 'student'
  const profile = {
    id: user.id,
    full_name: (meta.full_name ?? meta.name ?? '') as string,
    role: role as 'student' | 'teacher',
    class_id: null as string | null,
  }
  await admin.from('profiles').insert(profile)
  return NextResponse.json(profile)
}

export async function PUT(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const role = body.role === 'teacher' ? 'teacher' : 'student'
  const admin = adminClient()
  await admin.from('profiles').update({ role }).eq('id', user.id)
  return NextResponse.json({ role })
}
