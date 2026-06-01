import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getAdminProfileFromRequest, getSupabaseAdmin } from '../../../lib/supabaseAdmin'

function normalizeInviteCode(code) {
  return String(code || '').trim().toUpperCase()
}

function generateInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const pick = (length) => Array.from({ length }, () => alphabet[randomBytes(1)[0] % alphabet.length]).join('')
  return `KSR-${pick(4)}-${pick(4)}`
}

export async function GET(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const auth = await getAdminProfileFromRequest(request, supabaseAdmin)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: invites, error } = await supabaseAdmin
      .from('cashier_invites')
      .select('id, store_id, invite_code, status, used_by, used_at, expires_at, created_at')
      .eq('store_id', auth.profile.store_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const usedIds = [...new Set((invites || []).map((invite) => invite.used_by).filter(Boolean))]
    let profileMap = {}

    if (usedIds.length > 0) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', usedIds)

      if (profileError) throw profileError
      profileMap = Object.fromEntries((profiles || []).map((profile) => [profile.user_id, profile.full_name]))
    }

    return NextResponse.json({
      invites: (invites || []).map((invite) => ({
        ...invite,
        used_by_name: invite.used_by ? (profileMap[invite.used_by] || null) : null,
      })),
    })
  } catch (error) {
    console.error('[cashier-invites GET]', error)
    return NextResponse.json({ error: error.message || 'Gagal memuat undangan kasir.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const auth = await getAdminProfileFromRequest(request, supabaseAdmin)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    let inviteCode = ''
    let insertError = null
    let invite = null

    for (let attempt = 0; attempt < 5; attempt += 1) {
      inviteCode = normalizeInviteCode(generateInviteCode())
      const { data, error } = await supabaseAdmin
        .from('cashier_invites')
        .insert({
          store_id: auth.profile.store_id,
          invite_code: inviteCode,
          status: 'active',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id, store_id, invite_code, status, used_by, used_at, expires_at, created_at')
        .single()

      if (!error) {
        invite = data
        insertError = null
        break
      }

      insertError = error
      if (error.code !== '23505') break
    }

    if (insertError) throw insertError
    return NextResponse.json({ invite }, { status: 201 })
  } catch (error) {
    console.error('[cashier-invites POST]', error)
    return NextResponse.json({ error: error.message || 'Gagal membuat kode kasir.' }, { status: 500 })
  }
}
