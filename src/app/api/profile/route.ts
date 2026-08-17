import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET /api/profile — returns the authenticated user's profile, bypassing RLS
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

  // No profile row — create one from auth metadata
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

// PUT /api/profile — lets the authenticated user update their own role
export async function PUT(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const role = body.role === 'teacher' ? 'teacher' : 'student'

  const admin = adminClient()
  await admin.from('profiles').update({ role }).eq('id', user.id)

  return NextResponse.json({ role })
}
