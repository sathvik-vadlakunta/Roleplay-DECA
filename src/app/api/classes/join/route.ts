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
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// POST /api/classes/join — student joins a class by code
export async function POST(req: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { join_code } = await req.json()
  const admin = adminClient()

  const { data: cls } = await admin
    .from('classes')
    .select('id, name')
    .eq('join_code', join_code.trim().toUpperCase())
    .single()

  if (!cls) return NextResponse.json({ error: 'Invalid code — double-check with your teacher.' }, { status: 404 })

  const { error } = await admin
    .from('profiles')
    .update({ class_id: cls.id })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ class_id: cls.id, name: cls.name })
}
