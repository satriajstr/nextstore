import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server env belum lengkap. Set SUPABASE_SERVICE_ROLE_KEY di environment server.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getBearerToken(request) {
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null
  return authHeader.slice(7).trim()
}

export async function getAdminProfileFromRequest(request, supabaseAdmin) {
  const token = getBearerToken(request)
  if (!token) return { error: 'Sesi tidak ditemukan.', status: 401 }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  const user = userData?.user
  if (userError || !user) return { error: 'Sesi tidak valid.', status: 401 }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_id, role, store_id, status, full_name')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profil tidak ditemukan.', status: 403 }
  if (profile.role !== 'admin') return { error: 'Hanya admin yang dapat mengelola undangan kasir.', status: 403 }

  return { user, profile }
}
