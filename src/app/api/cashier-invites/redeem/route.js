import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

function normalizeInviteCode(code) {
  return String(code || '').trim().toUpperCase()
}

async function getInviteErrorMessage(supabaseAdmin, code) {
  const { data: invite, error } = await supabaseAdmin
    .from('cashier_invites')
    .select('status, used_by, expires_at')
    .eq('invite_code', code)
    .maybeSingle()

  if (error) throw error
  if (!invite) return { message: 'Kode kasir tidak ditemukan.', status: 404 }
  if (invite.used_by || invite.status === 'used') return { message: 'Kode kasir sudah digunakan.', status: 409 }
  if (invite.status !== 'active') return { message: 'Kode kasir sudah tidak aktif.', status: 400 }
  if (new Date(invite.expires_at).getTime() <= Date.now()) return { message: 'Kode kasir sudah kadaluarsa.', status: 410 }
  return { message: 'Kode kasir tidak valid.', status: 400 }
}

export async function POST(request) {
  try {
    const { inviteCode, userId, fullName } = await request.json()
    const code = normalizeInviteCode(inviteCode)
    const name = String(fullName || '').trim()

    if (!code || !userId || !name) {
      return NextResponse.json({ error: 'Data pendaftaran kasir belum lengkap.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Akun kasir tidak ditemukan.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.rpc('redeem_cashier_invite', {
      p_invite_code: code,
      p_user_id: userId,
      p_full_name: name,
    })

    if (error) {
      const inviteError = await getInviteErrorMessage(supabaseAdmin, code)
      return NextResponse.json({ error: inviteError.message }, { status: inviteError.status })
    }

    const redeemed = data?.[0]
    if (!redeemed?.store_id) {
      throw new Error('Kode kasir berhasil dipakai, tetapi data toko tidak ditemukan.')
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: name,
        role: 'kasir',
        store_id: redeemed?.store_id,
        status: 'active',
      })
      .eq('user_id', userId)

    if (profileError) throw profileError

    return NextResponse.json({ success: true, invite: redeemed || null })
  } catch (error) {
    console.error('[cashier-invites redeem]', error)
    return NextResponse.json({ error: error.message || 'Gagal menyelesaikan pendaftaran kasir.' }, { status: 500 })
  }
}
