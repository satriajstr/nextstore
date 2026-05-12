import { supabase } from './supabase'

export async function getRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data.role
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}
