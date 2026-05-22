'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getUserProfile } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  } else if (confirm.icon === '🗑️') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

// ─── Line Chart Component ──────────────────────────────────────────────────
function LineChart({ data, primaryColor, formatIDR }) {
  const [hovered, setHovered] = useState(null)
  const W = 520, H = 110, padX = 16, padY = 12
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const maxVal = Math.max(...data.map(d => d.total_penjualan), 1)

  const px = (i) => padX + (i / (data.length - 1)) * innerW
  const py = (v) => padY + innerH - (v / maxVal) * innerH

  const salesPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.total_penjualan)}`).join(' ')
  const profitPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(Math.max(d.keuntungan_bersih, 0))}`).join(' ')
  const areaPath = `${salesPath} L${px(data.length - 1)},${H} L${padX},${H} Z`

  // Hitung posisi tooltip dalam persen relatif container
  const tooltipLeft = (i) => `${(px(i) / W) * 100}%`

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110, overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={salesPath} fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={profitPath} fill="none" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.45" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            {/* Hit area lebih besar */}
            <circle cx={px(i)} cy={py(d.total_penjualan)} r={12} fill="transparent" />
            <circle cx={px(i)} cy={py(d.total_penjualan)} r={hovered === i ? 5 : 3} fill="white" stroke={primaryColor} strokeWidth="2" />
          </g>
        ))}
      </svg>

      {/* Tooltip HTML di luar SVG */}
      {hovered !== null && (
        <div
          className="absolute -top-14 pointer-events-none z-10"
          style={{
            left: tooltipLeft(hovered),
            transform: hovered === 0 ? 'translateX(0)' : hovered === data.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)'
          }}
        >
          <div className="bg-slate-800 text-white rounded-xl px-3 py-2 text-[10px] font-bold whitespace-nowrap shadow-xl">
            <div>{formatIDR(data[hovered].total_penjualan)}</div>
            <div className="text-emerald-400 font-semibold mt-0.5">Untung: {formatIDR(data[hovered].keuntungan_bersih)}</div>
          </div>
        </div>
      )}

      {/* X labels */}
      <div className="flex justify-between mt-1">
        {data.map((d) => (
          <span key={d.date} className="text-[8px] text-slate-400 font-semibold">
            {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })}
          </span>
        ))}
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
    if (confirmed) router.push('/laporan')
  }

  const handleOpenDay = async () => {
    if (!profile?.store_id) return

    const confirmed = await showConfirm({
      icon: '🔓',
      title: 'Buka Kembali Hari Ini?',
      message: 'Status laporan akan menjadi "Terbuka". Data riwayat tetap tersimpan.',
      labelYes: 'Buka Hari',
      labelNo: 'Batal',
    })
    if (!confirmed) return

    const resetData = await showConfirm({
      icon: '🗑️',
      title: 'Hapus Semua Transaksi?',
      message: 'Semua transaksi hari ini akan dihapus dan total penjualan kembali ke Rp 0.\nPenjualan baru akan diakumulasi ke rekap sebelumnya.',
      labelYes: 'Reset Transaksi',
      labelNo: 'Tidak, Simpan',
      danger: true,
    })

    const today = new Date().toISOString().split('T')[0]

    try {
      if (resetData) {
        const { data: currentSummary, error: summaryErr } = await supabase
          .from('daily_summary')
          .select('total_penjualan, total_modal, total_diskon, jumlah_transaksi')
          .eq('store_id', profile.store_id)
          .eq('date', today)
          .single()
        if (summaryErr) throw summaryErr

        await supabase
          .from('daily_summary')
          .update({
            status: 'open',
            carry_over: currentSummary?.total_penjualan ?? 0,
            carry_modal: currentSummary?.total_modal ?? 0,
            carry_diskon: currentSummary?.total_diskon ?? 0,
            carry_trx_count: currentSummary?.jumlah_transaksi ?? 0
          })
          .eq('store_id', profile.store_id)
          .eq('date', today)

        if (transactions.length > 0) {
          await supabase.from('transaction_items').delete().in('transaction_id', transactions.map(t => t.id))
          await supabase.from('transactions').delete().eq('store_id', profile.store_id).gte('created_at', today)
        }

        showToast('Hari dibuka. Transaksi direset.', 'success')
      } else {
        const { error } = await supabase
          .from('daily_summary')
          .update({ status: 'open' })
          .eq('store_id', profile.store_id)
          .eq('date', today)
        if (error) throw error
        showToast('Hari dibuka kembali. Data penjualan tetap ada.', 'success')
      }

      setIsClosed(false)
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      showToast(`Gagal membuka hari: ${err.message || ''}`, 'error')
    }
  }

  const totalHariIni = transactions.reduce((acc, t) => acc + (t.total_harga || 0), 0)
  const totalQRIS = transactions.filter(t => t.payment_method === 'QRIS').reduce((acc, t) => acc + (t.total_harga || 0), 0)
  const totalCash = transactions.filter(t => t.payment_method === 'Tunai').reduce((acc, t) => acc + (t.total_harga || 0), 0)

  // ─── History Chart Data ───────────────────────────────────────────────────
  const [historyChart, setHistoryChart] = useState([])

  useEffect(() => {
    const fetchHistory = async () => {
      if (!profile?.store_id) return
      const { data } = await supabase
        .from('daily_summary')
        .select('date, total_penjualan, keuntungan_bersih')
        .eq('store_id', profile.store_id)
        .order('date', { ascending: false })
        .limit(7)
      if (data) setHistoryChart(data.reverse())
    }
    if (profile?.store_id) fetchHistory()
  }, [profile?.store_id])

  // ─── Stok Kritis ──────────────────────────────────────────────────────────
  const [criticalStock, setCriticalStock] = useState([])

  useEffect(() => {
    const fetchCritical = async () => {
      if (!profile?.store_id) return
      const { data } = await supabase
        .from('products')
        .select('id, name, stock, category')
        .eq('store_id', profile.store_id)
        .lte('stock', 3)
        .order('stock', { ascending: true })
      if (data) setCriticalStock(data)
    }
    if (profile?.store_id) fetchCritical()
  }, [profile?.store_id])

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
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <header className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight" style={{ color: primaryColor }}>Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Selamat datang, Admin {profile?.full_name ?? storeName}.</p>
            </header>
            
            {/* CARD TOTAL PENJUALAN + AI ASSISTANT */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-8">

            {/* EXACT CARD FROM LAPORAN PAGE */}
            <section 
              className="border-2 shadow-md shadow-slate-100/50 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6"
              style={{ 
                borderColor: `${primaryColor}30`,
                background: `linear-gradient(135deg, ${primaryColor}25 0%, ${primaryColor}10 60%, #ffffff 100%)`
              }}
            >
              <div className="text-left w-full md:w-auto">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {isClosed ? 'Rekap Penjualan (HARI DITUTUP)' : 'Total Penjualan Hari Ini'}
                  </p>
                  {isClosed && <span className="bg-emerald-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Locked</span>}
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: primaryColor }}>
                  {formatIDR(totalHariIni)}
                </h2>
                <div className="flex gap-4 mt-4">
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

              <div className="flex items-center gap-3 md:ml-auto shrink-0">
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Transaksi</p>
                  <p className="text-xl font-black text-slate-800">{transactions.length}</p>
                </div>

                <div className="w-px h-8 bg-slate-200/80" />

                {!isClosed ? (
                  <button
                    onClick={handleCloseDay}
                    disabled={closing || transactions.length === 0}
                    className="text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider whitespace-nowrap"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}30` }}
                  >
                    {closing ? '...' : 'Tutup Hari'}
                  </button>
                ) : (
                  <button
                    onClick={handleOpenDay}
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95 text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    Buka Hari
                  </button>
                )}
              </div>
            </section>

            {/* AI ASSISTANT CARD */}
            <section
              onClick={() => router.push('/owner/assistant-ai')}
              className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 w-full md:w-[200px] shrink-0 flex flex-col justify-between cursor-pointer transition-all"
              style={{ outline: '2px solid transparent' }}
              onMouseEnter={e => e.currentTarget.style.outline = `2px solid ${primaryColor}40`}
              onMouseLeave={e => e.currentTarget.style.outline = '2px solid transparent'}
            >
              <div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${primaryColor}15` }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-snug">Assistant AI</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Analisis bisnis & rekomendasi cerdas untuk toko Anda.</p>
              </div>
            </section>

            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_200px] gap-4 mb-8">

              {/* Rekap Harian Chart */}
              {historyChart.length > 1 && (
                <section
                  onClick={() => router.push('/laporan?tab=riwayat')}
                  className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6 transition-all cursor-pointer"
                  style={{ outline: '2px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.outline = `2px solid ${primaryColor}40`}
                  onMouseLeave={e => e.currentTarget.style.outline = '2px solid transparent'}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Rekap Penjualan</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">7 hari terakhir</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-[2px] rounded" style={{ backgroundColor: primaryColor }} />
                        <span className="text-[9px] text-slate-400 font-semibold">Penjualan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-[2px] rounded border-t-2 border-dashed" style={{ borderColor: primaryColor, opacity: 0.45 }} />
                        <span className="text-[9px] text-slate-400 font-semibold">Keuntungan</span>
                      </div>
                    </div>
                  </div>
                  <LineChart data={historyChart} primaryColor={primaryColor} formatIDR={formatIDR} />
                </section>
              )}

              {/* Transaksi Hari Ini */}
              <section
                onClick={() => router.push('/laporan')}
                className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-5 flex flex-col cursor-pointer transition-all"
                style={{ outline: '2px solid transparent' }}
                onMouseEnter={e => e.currentTarget.style.outline = `2px solid ${primaryColor}40`}
                onMouseLeave={e => e.currentTarget.style.outline = '2px solid transparent'}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-800">Transaksi Hari Ini</p>
                  <span className="text-[9px] font-semibold text-slate-400">{transactions.length} trx</span>
                </div>
                {transactions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="text-[10px] font-semibold text-slate-400 text-center">Belum ada transaksi hari ini.</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100">
                    {transactions.slice(0, 3).map((trx) => {
                      const timeStr = new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
                      return (
                        <div key={trx.id} className="flex items-center justify-between py-2.5 gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 truncate">#{trx.id.slice(0, 8)}</p>
                            <p className="text-[9px] text-slate-400">{timeStr}</p>
                          </div>
                          <div className="flex flex-col items-end shrink-0 gap-0.5">
                            <span className="text-[10px] font-black" style={{ color: primaryColor }}>{formatIDR(trx.total_harga)}</span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                              trx.payment_method === 'Tunai' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                            }`}>{trx.payment_method || 'Tunai'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Stok Kritis */}
              {criticalStock.length > 0 && (
                <section
                  onClick={() => router.push('/produk')}
                  className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-5 flex flex-col cursor-pointer transition-all"
                  style={{ outline: '2px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.outline = `2px solid ${primaryColor}40`}
                  onMouseLeave={e => e.currentTarget.style.outline = '2px solid transparent'}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <p className="text-xs font-bold text-slate-800">Stok Kritis</p>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400">{criticalStock.length} menipis</span>
                  </div>
                  <div className="overflow-y-auto max-h-[160px] flex flex-col divide-y divide-slate-100 pr-1">
                    {criticalStock.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5 gap-3">
                        <p className="text-[11px] font-semibold text-slate-700 truncate">{p.name}</p>
                        <span className={`text-[10px] font-bold shrink-0 ${
                          p.stock === 0 ? 'text-rose-500' : 'text-slate-400'
                        }`}>{p.stock === 0 ? 'Habis' : p.stock}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

          </div>
        </div>
      </main>
    </>
  )
}
