'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getUserProfile } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '../../components/AdminSidebar'
import { useTheme } from '../../lib/ThemeContext'

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => onClose(), 4000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className="fixed bottom-5 right-5 z-[300] max-w-sm w-full">
      <div className={`rounded-2xl p-4 shadow-xl border flex items-center justify-between gap-3 ${
        toast.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      }`}>
        <p className="text-xs font-bold whitespace-pre-line leading-relaxed">{toast.message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-bold">x</button>
      </div>
    </div>
  )
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  })
}

function isInviteExpired(invite) {
  return invite.status === 'active' && new Date(invite.expires_at).getTime() <= Date.now()
}

function getInviteStatus(invite) {
  if (invite.status === 'used') return 'used'
  if (isInviteExpired(invite)) return 'expired'
  return invite.status
}

function getStatusLabel(status) {
  if (status === 'active' || status === 'approved') return 'Aktif'
  if (status === 'disabled') return 'Nonaktif'
  if (status === 'used') return 'Terpakai'
  if (status === 'expired') return 'Kadaluarsa'
  return 'Pending'
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Sesi tidak ditemukan.')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.')
  return data
}

export default function KasirManagement() {
  const { primaryColor } = useTheme()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [cashiers, setCashiers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const userProfile = await getUserProfile()
      if (!userProfile || userProfile.role !== 'admin') {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      setProfile(userProfile)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const fetchCashiers = useCallback(async () => {
    if (!profile?.store_id) return
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, role, store_id, status, full_name')
      .eq('store_id', profile.store_id)
      .eq('role', 'kasir')
      .order('full_name', { ascending: true })

    if (error) throw error
    setCashiers(data || [])
  }, [profile?.store_id])

  const fetchInvites = useCallback(async () => {
    const headers = await getAuthHeaders()
    const data = await fetchJson('/api/cashier-invites', { headers })
    setInvites(data.invites || [])
  }, [])

  const refreshData = useCallback(async () => {
    if (!profile?.store_id) return
    setLoading(true)
    try {
      await Promise.all([fetchCashiers(), fetchInvites()])
    } catch (error) {
      console.error(error)
      showToast(error.message || 'Gagal memuat data kasir.', 'error')
    } finally {
      setLoading(false)
    }
  }, [fetchCashiers, fetchInvites, profile?.store_id, showToast])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const handleGenerateInvite = async () => {
    setGenerating(true)
    try {
      const headers = await getAuthHeaders()
      const data = await fetchJson('/api/cashier-invites', {
        method: 'POST',
        headers,
      })
      setInvites((prev) => [data.invite, ...prev])
      await navigator.clipboard?.writeText(data.invite.invite_code)
      showToast('Kode kasir berhasil dibuat dan disalin.')
    } catch (error) {
      console.error(error)
      showToast(error.message || 'Gagal membuat kode kasir.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async (code) => {
    await navigator.clipboard?.writeText(code)
    showToast('Kode kasir berhasil disalin.')
  }

  const handleToggleStatus = async (cashier) => {
    const isActive = cashier.status === 'active' || cashier.status === 'approved'
    const nextStatus = isActive ? 'disabled' : 'active'
    const { error } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('user_id', cashier.user_id)
      .eq('store_id', profile.store_id)

    if (error) {
      showToast('Gagal mengubah status kasir.', 'error')
      return
    }

    showToast(isActive ? 'Kasir berhasil dinonaktifkan.' : 'Kasir berhasil diaktifkan.')
    fetchCashiers()
  }

  const handleDeleteCashier = async (cashier) => {
    const confirmed = window.confirm(`Hapus kasir "${cashier.full_name || 'Tanpa Nama'}" dari toko ini? Akun login kasir juga akan dihapus.`)
    if (!confirmed) return

    try {
      const headers = await getAuthHeaders()
      await fetchJson(`/api/cashiers/${cashier.user_id}`, {
        method: 'DELETE',
        headers,
      })
      showToast('Kasir berhasil dihapus dari toko.')
      await refreshData()
    } catch (error) {
      console.error(error)
      showToast(error.message || 'Gagal menghapus kasir.', 'error')
    }
  }

  const activeInvites = invites.filter((invite) => getInviteStatus(invite) === 'active')
  const usedInvites = invites.filter((invite) => getInviteStatus(invite) === 'used')

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="flex min-h-screen bg-white text-slate-900 font-sans">
        <AdminSidebar />
        <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md -mx-4 md:-mx-8 px-4 md:px-8 py-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight" style={{ color: primaryColor }}>Kelola Kasir</h1>
                {checkingAuth ? (
                  <div className="h-3 w-32 rounded-full animate-pulse mt-2 bg-slate-200" />
                ) : (
                  <p className="text-xs text-slate-400 font-semibold mt-1">{cashiers.length} kasir terdaftar</p>
                )}
              </div>
              {checkingAuth ? (
                <div className="w-48 h-10 rounded-xl animate-pulse bg-slate-200" />
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  disabled={generating}
                  className="px-5 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-60 active:scale-95 transition-all"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 8px 18px ${primaryColor}30` }}
                >
                  {generating ? 'Membuat...' : 'Generate Kode Kasir'}
                </button>
              )}
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 pt-4">
              <div className="space-y-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-slate-800">Kode Aktif</h2>
                    {checkingAuth || loading ? (
                      <div className="h-3 w-12 rounded-full animate-pulse bg-slate-100" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">{activeInvites.length} kode</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {checkingAuth || loading ? (
                      [...Array(2)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-slate-100 p-4 bg-slate-50/40 animate-pulse">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-32 bg-slate-200 rounded-full" />
                              <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
                            </div>
                            <div className="w-12 h-7 bg-slate-200 rounded-lg" />
                          </div>
                        </div>
                      ))
                    ) : activeInvites.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold py-6 text-center">Belum ada kode aktif.</p>
                    ) : (
                      activeInvites.map((invite) => (
                        <div key={invite.id} className="rounded-2xl border border-slate-100 p-4 bg-slate-50/40">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-sm font-black text-slate-800 tracking-wider">{invite.invite_code}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1">Expired: {formatDateTime(invite.expires_at)}</p>
                            </div>
                            <button onClick={() => handleCopy(invite.invite_code)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100">
                              Salin
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-slate-800">Kode Terpakai</h2>
                    {checkingAuth || loading ? (
                      <div className="h-3 w-12 rounded-full animate-pulse bg-slate-100" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">{usedInvites.length} kode</span>
                    )}
                  </div>
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {checkingAuth || loading ? (
                      [...Array(2)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-slate-100 p-4 animate-pulse">
                          <div className="space-y-2">
                            <div className="h-3 w-28 bg-slate-200 rounded-full" />
                            <div className="h-2.5 w-40 bg-slate-100 rounded-full" />
                          </div>
                        </div>
                      ))
                    ) : usedInvites.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold py-6 text-center">Belum ada kode terpakai.</p>
                    ) : (
                      usedInvites.map((invite) => (
                        <div key={invite.id} className="rounded-2xl border border-slate-100 p-4">
                          <p className="font-mono text-xs font-black text-slate-700 tracking-wider">{invite.invite_code}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">Dipakai: {invite.used_by_name || 'Kasir'} - {formatDateTime(invite.used_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-800">Kasir Terdaftar</h2>
                </div>
                <div className="overflow-x-auto">
                  {checkingAuth || loading ? (
                    <div className="divide-y divide-slate-100/50">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between gap-4 animate-pulse">
                          <div className="space-y-2 flex-1">
                            <div className="h-3 w-32 bg-slate-200 rounded-full" />
                            <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
                          </div>
                          <div className="w-16 h-4 bg-slate-100 rounded-full" />
                          <div className="flex gap-2">
                            <div className="w-24 h-7 bg-slate-100 rounded-xl" />
                            <div className="w-12 h-7 bg-slate-100 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : cashiers.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                      <p className="text-xs font-semibold">Belum ada kasir yang terdaftar.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-6 py-4">Nama</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {cashiers.map((cashier) => {
                          const active = cashier.status === 'active' || cashier.status === 'approved'
                          return (
                            <tr key={cashier.user_id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="text-xs font-bold text-slate-700">{cashier.full_name || 'Tanpa Nama'}</p>
                                <p className="text-[9px] font-mono text-slate-400 mt-0.5">#{cashier.user_id.slice(0, 8)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest border ${
                                  active
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : cashier.status === 'disabled'
                                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                                      : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                  {getStatusLabel(cashier.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleToggleStatus(cashier)}
                                    className={`px-3 py-1.5 text-[9px] font-bold rounded-xl transition-all active:scale-95 ${
                                      active
                                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {active ? 'NONAKTIFKAN' : 'AKTIFKAN'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCashier(cashier)}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-bold rounded-xl transition-all active:scale-95"
                                  >
                                    HAPUS
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
