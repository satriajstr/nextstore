import { NextResponse } from 'next/server'
import { getAdminProfileFromRequest, getSupabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function DELETE(request, { params }) {
  try {
    const { userId } = await params
    const supabaseAdmin = getSupabaseAdmin()
    const auth = await getAdminProfileFromRequest(request, supabaseAdmin)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: cashier, error: cashierError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role, store_id')
      .eq('user_id', userId)
      .eq('store_id', auth.profile.store_id)
      .eq('role', 'kasir')
      .maybeSingle()

    if (cashierError) throw cashierError
    if (!cashier) {
      return NextResponse.json({ error: 'Kasir tidak ditemukan di toko ini.' }, { status: 404 })
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthError) throw deleteAuthError

    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', auth.profile.store_id)
      .eq('role', 'kasir')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[cashiers DELETE]', error)
    return NextResponse.json({ error: error.message || 'Gagal menghapus kasir.' }, { status: 500 })
  }
}
