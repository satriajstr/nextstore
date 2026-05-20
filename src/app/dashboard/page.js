'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getUserProfile } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '../../components/AdminSidebar'
import { useTheme } from '../../lib/ThemeContext'

// ─── Custom Toast Component ──────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed top-6 right-6 z-50 max-w-sm w-full shadow-2xl rounded-2xl p-5 flex items-start gap-4 transition-all animate-fade-in
      ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      {isSuccess ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      )}
      <div className="flex-1">
        <p className={`font-bold text-sm ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
          {isSuccess ? 'Berhasil' : 'Gagal'}
        </p>
        <p className={`text-sm mt-0.5 whitespace-pre-line ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {toast.message}
        </p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>
  )
}

// ─── Custom Confirm Dialog Component ─────────────────────────────────────────
function ConfirmDialog({ confirm, onYes, onNo }) {
  if (!confirm) return null
  let iconElement = null
  if (confirm.icon === '🔒') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-rose-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  } else if (confirm.icon === '🔓') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h16.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-center">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col gap-5 animate-fade-in">
        {iconElement && <div>{iconElement}</div>}
        <div>
          <p className="font-black text-gray-800 text-lg">{confirm.title ?? 'Konfirmasi'}</p>
          <p className="text-gray-500 text-sm mt-1 whitespace-pre-line">{confirm.message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onNo} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all">
            {confirm.labelNo ?? 'Batal'}
          </button>
          <button onClick={onYes} className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all active:scale-95 shadow-md ${confirm.danger ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-100'}`}>
            {confirm.labelYes ?? 'Ya'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { primaryColor, storeName } = useTheme()
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  // States for Card
  const [transactions, setTransactions] = useState([])
  const [isClosed, setIsClosed] = useState(false)
  const [closing, setClosing] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Custom Confirm Dialog State
  const [confirmState, setConfirmState] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        onResolve: resolve
      })
    })
  }

  const handleConfirmYes = () => {
    if (confirmState?.onResolve) confirmState.onResolve(true)
    setConfirmState(null)
  }

  const handleConfirmNo = () => {
    if (confirmState?.onResolve) confirmState.onResolve(false)
    setConfirmState(null)
  }

  const formatIDR = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount ?? 0)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const userProfile = await getUserProfile()
      if (!userProfile || userProfile.role !== 'admin') {
        router.replace('/login')
        return
      }
      setProfile(userProfile)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.store_id) return
    const today = new Date().toISOString().split('T')[0]
    const startLocal = new Date(`${today}T00:00:00+07:00`).toISOString()
    const endLocal = new Date(new Date(`${today}T00:00:00+07:00`).getTime() + 86400000).toISOString()

    try {
      const { data: trxData, error: trxErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('store_id', profile.store_id)
        .gte('created_at', startLocal)
        .lt('created_at', endLocal)
      if (trxErr) throw trxErr
      setTransactions(trxData || [])

      const { data: summaryData } = await supabase
        .from('daily_summary')
        .select('status')
        .eq('store_id', profile.store_id)
        .eq('date', today)
        .maybeSingle()
      
      setIsClosed(summaryData?.status === 'closed')
    } catch (err) {
      console.error(err)
    }
  }, [profile?.store_id])

  useEffect(() => {
    if (profile?.store_id) {
      fetchDashboardData()
    }
  }, [profile?.store_id, fetchDashboardData])

  const handleCloseDay = async () => {
    if (isClosed) return
    if (!profile?.store_id) return

    const confirmed = await showConfirm({
      icon: '🔒',
      title: 'Tutup Hari Ini?',
      message: 'Anda akan dialihkan ke halaman laporan untuk memproses penutupan hari.',
      labelYes: 'Ke Laporan',
      labelNo: 'Batal',
    })
    
    if (confirmed) {
      router.push('/laporan')
    }
  }

  const handleOpenDay = async () => {
    if (!profile?.store_id) return
    
    const confirmed = await showConfirm({
      icon: '🔓',
      title: 'Buka Kembali Hari Ini?',
      message: 'Anda akan dialihkan ke halaman laporan untuk memproses pembukaan hari.',
      labelYes: 'Ke Laporan',
      labelNo: 'Batal',
    })
    
    if (confirmed) {
      router.push('/laporan')
    }
  }

  const totalHariIni = transactions.reduce((acc, t) => acc + (t.total_harga || 0), 0)
  const totalQRIS = transactions.filter(t => t.payment_method === 'QRIS').reduce((acc, t) => acc + (t.total_harga || 0), 0)
  const totalCash = transactions.filter(t => t.payment_method === 'Tunai').reduce((acc, t) => acc + (t.total_harga || 0), 0)

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    )
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmDialog confirm={confirmState} onYes={handleConfirmYes} onNo={handleConfirmNo} />

      <main className="flex min-h-screen bg-gray-50 text-slate-800 font-sans">
        <AdminSidebar />
        <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight" style={{ color: primaryColor }}>Dashboard Admin</h1>
              <p className="text-slate-400 text-sm mt-1">Selamat datang di panel kontrol {storeName}</p>
            </header>
            
            {/* EXACT CARD FROM LAPORAN PAGE */}
            <section 
              className="bg-white border-2 shadow-md shadow-slate-100/50 rounded-[2rem] p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6"
              style={{ borderColor: `${primaryColor}30` }}
            >
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {isClosed ? 'Rekap Penjualan (HARI DITUTUP)' : 'Total Penjualan Hari Ini'}
                  </p>
                  {isClosed && <span className="bg-emerald-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Locked</span>}
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight" style={{ color: primaryColor }}>
                  {formatIDR(totalHariIni)}
                </h2>
                <div className="flex gap-4 mt-4 justify-center md:justify-start">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Tunai</span>
                    <span className="text-base font-bold text-emerald-600">{formatIDR(totalCash)}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-200/80 self-center"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">QRIS / Non-Tunai</span>
                    <span className="text-base font-bold text-red-600">{formatIDR(totalQRIS)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center min-w-[120px]">
                  <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Transaksi</p>
                  <p className="text-2xl font-black text-slate-800">{transactions.length}</p>
                </div>

                {!isClosed ? (
                  <button
                    onClick={handleCloseDay}
                    disabled={closing || transactions.length === 0}
                    className="text-white px-6 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider"
                    style={{ 
                      backgroundColor: primaryColor, 
                      boxShadow: `0 4px 12px ${primaryColor}30` 
                    }}
                  >
                    {closing ? '...' : 'Tutup Hari'}
                  </button>
                ) : (
                  <button
                    onClick={handleOpenDay}
                    className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex flex-col items-center leading-tight text-xs uppercase tracking-wider"
                  >
                    Buka Hari
                  </button>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </>
  )
}
