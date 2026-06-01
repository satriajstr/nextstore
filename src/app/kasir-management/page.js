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
  const [selectedCashier, setSelectedCashier] = useState(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [disabling, setDisabling] = useState(false)

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
      .select('user_id, role, store_id, status, full_name, disabled_reason')
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

  const handleDeactivateInDetail = async () => {
    if (!selectedCashier) return
    if (!deactivateReason.trim()) {
      showToast('Alasan nonaktif wajib diisi.', 'error')
      return
    }
    setDisabling(true)
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'disabled', disabled_reason: deactivateReason.trim() })
      .eq('user_id', selectedCashier.user_id)
      .eq('store_id', profile.store_id)

    if (error) {
      showToast('Gagal menonaktifkan kasir.', 'error')
      setDisabling(false)
      return
    }

    showToast('Kasir berhasil dinonaktifkan.')
    const updatedCashier = { ...selectedCashier, status: 'disabled', disabled_reason: deactivateReason.trim() }
    setSelectedCashier(updatedCashier)
    setIsDeactivating(false)
    setDeactivateReason('')
    setDisabling(false)
    fetchCashiers()
  }

  const handleActivateInDetail = async () => {
    if (!selectedCashier) return
    setDisabling(true)
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'active', disabled_reason: null })
      .eq('user_id', selectedCashier.user_id)
      .eq('store_id', profile.store_id)

    if (error) {
      showToast('Gagal mengaktifkan kasir.', 'error')
      setDisabling(false)
      return
    }

    showToast('Kasir berhasil diaktifkan.')
    const updatedCashier = { ...selectedCashier, status: 'active', disabled_reason: null }
    setSelectedCashier(updatedCashier)
    setDisabling(false)
    fetchCashiers()
  }

  const handleDeleteInDetail = async () => {
    if (!selectedCashier) return
    const confirmed = window.confirm(`Hapus kasir "${selectedCashier.full_name || 'Tanpa Nama'}" dari toko ini? Akun login kasir juga akan dihapus.`)
    if (!confirmed) return

    setDisabling(true)
    try {
      const headers = await getAuthHeaders()
      await fetchJson(`/api/cashiers/${selectedCashier.user_id}`, {
        method: 'DELETE',
        headers,
      })
      showToast('Kasir berhasil dihapus dari toko.')
      setSelectedCashier(null)
      await refreshData()
    } catch (error) {
      console.error(error)
      showToast(error.message || 'Gagal menghapus kasir.', 'error')
    } finally {
      setDisabling(false)
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
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">Kode Aktif</h2>
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
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">Kode Terpakai</h2>
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
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">Kasir Terdaftar</h2>
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
                          <th className="px-6 py-4 text-right">Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {cashiers.map((cashier) => {
                          const active = cashier.status === 'active' || cashier.status === 'approved'
                          return (
                            <tr 
                              key={cashier.user_id} 
                              onClick={() => {
                                setSelectedCashier(cashier)
                                setIsDeactivating(false)
                                setDeactivateReason('')
                              }}
                              className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                            >
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
                                <span className="text-slate-300 hover:text-slate-500 transition-colors inline-block align-middle">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                  </svg>
                                </span>
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

      {/* Detail Kasir Overlay */}
      {selectedCashier && (
        <div 
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" 
          onClick={() => !disabling && setSelectedCashier(null)}
        >
          <div 
            className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 relative overflow-hidden" 
            onClick={e => e.stopPropagation()} 
            style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
          >
            {/* Close Button */}
            <button 
              onClick={() => !disabling && setSelectedCashier(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1"
              disabled={disabling}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Avatar & Header */}
            <div className="flex flex-col items-center mb-6">
              <div 
                className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-xl font-black uppercase text-white mb-3 shadow-md"
                style={{ 
                  backgroundColor: primaryColor,
                  boxShadow: `0 8px 20px ${primaryColor}25`
                }}
              >
                {selectedCashier.full_name ? selectedCashier.full_name.charAt(0) : 'K'}
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center tracking-tight leading-snug">
                {selectedCashier.full_name || 'Tanpa Nama'}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                ID: {selectedCashier.user_id}
              </p>
            </div>

            {/* Details Card */}
            <div className="space-y-4 mb-6">
              {/* Status Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Status Akun</span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${
                  selectedCashier.status === 'active' || selectedCashier.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : selectedCashier.status === 'disabled'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {getStatusLabel(selectedCashier.status)}
                </span>
              </div>

              {/* Disabled Reason Callout */}
              {selectedCashier.status === 'disabled' && selectedCashier.disabled_reason && (
                <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 text-left">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block mb-1">
                    Alasan Dinonaktifkan
                  </span>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">
                    {selectedCashier.disabled_reason}
                  </p>
                </div>
              )}
            </div>

            {/* Deactivation Input */}
            {isDeactivating ? (
              <div className="space-y-4 pt-2 border-t border-slate-100" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Alasan Nonaktif <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={deactivateReason}
                    onChange={e => setDeactivateReason(e.target.value)}
                    placeholder="Contoh: Tidak lagi bekerja di toko ini atau sedang cuti"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none text-xs text-slate-700 font-medium resize-none transition-all"
                    onFocus={e => { e.target.style.borderColor = primaryColor; e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20` }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setIsDeactivating(false); setDeactivateReason('') }}
                    disabled={disabling}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeactivateInDetail}
                    disabled={disabling || !deactivateReason.trim()}
                    className="flex-1 py-3 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                    style={{ 
                      backgroundColor: primaryColor,
                      boxShadow: `0 6px 16px ${primaryColor}30` 
                    }}
                  >
                    {disabling ? 'Memproses...' : 'Nonaktifkan'}
                  </button>
                </div>
              </div>
            ) : (
              /* Primary Action Buttons */
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex gap-3">
                  {selectedCashier.status === 'active' || selectedCashier.status === 'approved' ? (
                    <button
                      onClick={() => setIsDeactivating(true)}
                      disabled={disabling}
                      className="flex-1 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                      Nonaktifkan
                    </button>
                  ) : (
                    <button
                      onClick={handleActivateInDetail}
                      disabled={disabling}
                      className="flex-1 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                      Aktifkan
                    </button>
                  )}
                  <button
                    onClick={handleDeleteInDetail}
                    disabled={disabling}
                    className="flex-1 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    Hapus Kasir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
