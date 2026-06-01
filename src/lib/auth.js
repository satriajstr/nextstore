import { supabase } from './supabase'

export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('role, store_id, status, full_name, disabled_reason')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data
}

export async function getRole() {
  const profile = await getUserProfile()
  return profile ? profile.role : null
}

export async function signOut() {
  try {
    localStorage.removeItem('nextstore_theme')
  } catch (e) {}
  await supabase.auth.signOut()
  window.location.href = '/login'
}
