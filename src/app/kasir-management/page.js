'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getUserProfile } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '../../components/AdminSidebar'
import { useTheme } from '../../lib/ThemeContext'

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => onClose(), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className="fixed bottom-5 right-5 z-[300] max-w-sm w-full animate-slide-up">
      <div className={`rounded-2xl p-4 shadow-xl border backdrop-blur-md flex items-center justify-between gap-3
        ${toast.type === 'error'
          ? 'bg-red-50/90 border-red-200/80 text-red-700'
          : 'bg-emerald-50/90 border-emerald-200/80 text-emerald-700'}`}>
        <p className="text-xs font-bold whitespace-pre-line leading-relaxed">{toast.message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm font-bold">×</button>
      </div>
    </div>
  )
}

// ─── Confirm Dialog Component ─────────────────────────────────────────────────
function ConfirmDialog({ confirm, onYes, onNo }) {
  const { primaryColor } = useTheme()
  if (!confirm) return null
  let iconElement = null
  if (confirm.icon === '🗑️') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    )
  } else if (confirm.icon === '🔒') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  } else if (confirm.icon === '🔓') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col gap-5 animate-fade-in">
        {iconElement && <div>{iconElement}</div>}
        <div>
          <p className="font-bold text-gray-800 text-lg">{confirm.title ?? 'Konfirmasi'}</p>
          <p className="text-gray-500 text-sm mt-1 whitespace-pre-line font-medium">{confirm.message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onNo} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all">
            {confirm.labelNo ?? 'Batal'}
          </button>
          <button
            onClick={onYes}
            className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all active:scale-95 shadow-md
              ${confirm.danger ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : ''}`}
            style={!confirm.danger ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}20` } : {}}
          >
            {confirm.labelYes ?? 'Ya'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KasirManagement() {
  const { primaryColor } = useTheme()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [cashiers, setCashiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [copied, setCopied] = useState(false)

  // ─── Custom Dialog States ──────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  const [confirmState, setConfirmState] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve })
    })
  }, [])

  const handleConfirmYes = () => {
    confirmState?.resolve(true)
    setConfirmState(null)
  }

  const handleConfirmNo = () => {
    confirmState?.resolve(false)
    setConfirmState(null)
  }

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
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, role, store_id, status, full_name')
      .eq('store_id', profile.store_id)
      .eq('role', 'kasir')

    if (error) {
      console.error(error)
      showToast('Gagal memuat daftar kasir.', 'error')
    } else {
      setCashiers(data || [])
    }
    setLoading(false)
  }, [profile?.store_id, showToast])

  const handleUpdateStatus = async (userId, newStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('user_id', userId)

    if (error) {
      showToast('Gagal memperbarui status.', 'error')
    } else {
      showToast('Status kasir berhasil diperbarui.')
      fetchCashiers()
    }
  }

  const handleToggleStatus = async (ksr) => {
    const isActive = ksr.status === 'approved'
    const confirmed = await showConfirm({
      icon: isActive ? '🔒' : '🔓',
      title: isActive ? 'Nonaktifkan Kasir?' : 'Aktifkan Kasir?',
      message: isActive
        ? `Akun kasir "${ksr.full_name || 'Tanpa Nama'}" akan dinonaktifkan. Kasir tidak akan bisa masuk hingga diaktifkan kembali.`
        : `Akun kasir "${ksr.full_name || 'Tanpa Nama'}" akan diaktifkan kembali dan bisa langsung masuk ke sistem.`,
      labelYes: isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
      labelNo: 'Batal',
      danger: isActive,
    })

    if (!confirmed) return

    const newStatus = isActive ? 'disabled' : 'approved'
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('user_id', ksr.user_id)

    if (error) {
      showToast('Gagal mengubah status kasir.', 'error')
    } else {
      showToast(isActive ? 'Kasir berhasil dinonaktifkan.' : 'Kasir berhasil diaktifkan kembali.')
      fetchCashiers()
    }
  }

  const handleDeleteCashier = async (userId) => {
    const confirmed = await showConfirm({
      icon: '🗑️',
      title: 'Hapus Kasir?',
      message: 'Akses masuk kasir ini akan dicabut permanen dari toko Anda.',
      labelYes: 'Ya, Hapus',
      labelNo: 'Kembali',
      danger: true,
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId)

    if (error) {
      showToast('Gagal menghapus kasir.', 'error')
    } else {
      showToast('Kasir berhasil dihapus dari sistem.')
      fetchCashiers()
    }
  }

  const handleCopyCode = () => {
    if (!profile?.store_id) return
    navigator.clipboard.writeText(profile.store_id)
    setCopied(true)
    showToast('Kode registrasi berhasil disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    fetchCashiers()
  }, [fetchCashiers])

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog confirm={confirmState} onYes={handleConfirmYes} onNo={handleConfirmNo} />

      {checkingAuth && (
        <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      )}

      <main className="flex min-h-screen bg-white text-slate-900 font-sans">
        <AdminSidebar />
        <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
          <div className="max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md -mx-4 md:-mx-8 px-4 md:px-8 py-6 mb-4 flex justify-between items-center border-b border-slate-100">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight" style={{ color: primaryColor }}>Manajemen Kasir</h1>
                <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest mt-1 inline-block border"
                  style={{ color: primaryColor, borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}08` }}>
                  {cashiers.length} Kasir Terdaftar
                </span>
              </div>
            </header>

            <section className="grid md:grid-cols-2 gap-8 pt-4">
              {/* INFO CARD */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
                <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-3">
                  <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Kode Registrasi Kasir
                </h2>
                <div className="rounded-2xl p-6 text-center border-2 border-dashed relative group transition-all"
                  style={{ backgroundColor: `${primaryColor}05`, borderColor: `${primaryColor}25` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>Kode Registrasi Toko</p>
                  <code className="text-lg font-black tracking-wider break-all block mb-4 text-slate-800">
                    {profile?.store_id}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md
                      ${copied ? 'bg-emerald-600 text-white shadow-emerald-600/10' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
                    style={!copied ? { color: primaryColor, borderColor: `${primaryColor}30`, boxShadow: `0 4px 12px ${primaryColor}08` } : {}}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Salin Kode
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-8 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Panduan Pendaftaran
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">1</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Salin dan bagikan <strong>Kode Registrasi Toko</strong> di atas kepada calon kasir Anda.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">2</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Arahkan mereka untuk mendaftar akun di halaman pendaftaran kasir aplikasi ini.
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">3</span>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Setelah kasir mendaftar, setujui status keanggotaan mereka di tabel sebelah kanan agar mereka bisa masuk.
                      </p>
                    </li>
                  </ul>
                </div>
              </div>

              {/* LIST CARD */}
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-white">
                  <h3 className="font-bold text-slate-800 text-sm">Daftar Kasir Terdaftar</h3>
                </div>
                <div className="overflow-x-auto flex-1">
                  {loading ? (
                    <div className="p-16 text-center text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
                      Memuat kasir...
                    </div>
                  ) : cashiers.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center">
                      <svg className="w-10 h-10 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-xs font-semibold">Belum ada kasir yang terdaftar</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">
                          <th className="px-6 py-5">Nama Kasir</th>
                          <th className="px-6 py-5">ID Kasir</th>
                          <th className="px-6 py-5">Status</th>
                          <th className="px-6 py-5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50">
                        {cashiers.map((ksr) => (
                          <tr key={ksr.user_id} className="hover:bg-slate-50/40 transition-colors group">
                            <td className="px-6 py-5">
                              <p className="font-semibold text-slate-700 text-xs">{ksr.full_name || <span className="text-slate-300 italic">Belum diisi</span>}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-mono text-[10px] text-slate-400">{ksr.user_id.slice(0, 8)}...</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest border
                                ${ksr.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : ksr.status === 'disabled'
                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {ksr.status === 'approved' ? 'Aktif' : ksr.status === 'disabled' ? 'Nonaktif' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex gap-2 justify-center flex-wrap">
                                {/* Approve button for pending cashiers */}
                                {ksr.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateStatus(ksr.user_id, 'approved')}
                                    className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-600/10"
                                  >
                                    SETUJUI
                                  </button>
                                )}
                                {/* Toggle active/disabled for approved or disabled cashiers */}
                                {(ksr.status === 'approved' || ksr.status === 'disabled') && (
                                  <button
                                    onClick={() => handleToggleStatus(ksr)}
                                    className={`px-3 py-1.5 text-[9px] font-bold rounded-xl transition-all active:scale-95 shadow-md
                                      ${ksr.status === 'approved'
                                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 shadow-orange-50'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-emerald-50'}`}
                                  >
                                    {ksr.status === 'approved' ? 'NONAKTIFKAN' : 'AKTIFKAN'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteCashier(ksr.user_id)}
                                  className="px-3 py-1.5 bg-red-50 text-red-500 text-[9px] font-bold rounded-xl hover:bg-red-100 transition-all active:scale-95"
                                >
                                  HAPUS
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
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
