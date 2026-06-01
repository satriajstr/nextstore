import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

function normalizeInviteCode(code) {
  return String(code || '').trim().toUpperCase()
}

function inviteErrorResponse(invite) {
  if (!invite) {
    return NextResponse.json({ error: 'Kode kasir tidak ditemukan.' }, { status: 404 })
  }

  if (invite.used_by || invite.status === 'used') {
    return NextResponse.json({ error: 'Kode kasir sudah digunakan.' }, { status: 409 })
  }

  if (invite.status !== 'active') {
    return NextResponse.json({ error: 'Kode kasir sudah tidak aktif.' }, { status: 400 })
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Kode kasir sudah kadaluarsa.' }, { status: 410 })
  }

  return NextResponse.json({ error: 'Kode kasir tidak valid.' }, { status: 400 })
}

export async function POST(request) {
  try {
    const { inviteCode } = await request.json()
    const code = normalizeInviteCode(inviteCode)

    if (!code) {
      return NextResponse.json({ error: 'Kode kasir wajib diisi.' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: invite, error } = await supabaseAdmin
      .from('cashier_invites')
      .select('id, store_id, invite_code, status, used_by, expires_at, stores(name)')
      .eq('invite_code', code)
      .maybeSingle()

    if (error) throw error
    if (!invite || invite.used_by || invite.status !== 'active' || new Date(invite.expires_at).getTime() <= Date.now()) {
      return inviteErrorResponse(invite)
    }

    return NextResponse.json({
      valid: true,
      invite: {
        store_id: invite.store_id,
        invite_code: invite.invite_code,
        expires_at: invite.expires_at,
        store_name: invite.stores?.name || null,
      },
    })
  } catch (error) {
    console.error('[cashier-invites validate]', error)
    return NextResponse.json({ error: error.message || 'Gagal memvalidasi kode kasir.' }, { status: 500 })
  }
}
