'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getUserProfile } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '../../components/AdminSidebar'
import SalesLineChart from '../../components/SalesLineChart'
import { useTheme } from '../../lib/ThemeContext'
import { getStoreHoursStatus } from '../../lib/storeHours'
import { getTodayId } from '../../lib/dateId'
import { autoClosePastDays } from '../../lib/autoClose'

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

// ─── Custom Auto Close Warning Modal Component ─────────────────────────────
function AutoCloseModal({ isOpen, onClose, closedDays, formatIDR, primaryColor }) {
  if (!isOpen || !closedDays || closedDays.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 text-center animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 flex flex-col gap-6 text-left max-h-[85vh] overflow-y-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Sesi Terlupakan Ditutup Otomatis 🔒</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Sistem mendeteksi ada hari operasional sebelumnya yang belum ditutup. Untuk memastikan keakuratan laporan penjualan, sistem telah merapikan dan menutup hari-hari berikut secara otomatis:
          </p>
        </div>

        <div className="flex flex-col gap-3 my-2 overflow-y-auto max-h-[40vh] pr-1">
          {closedDays.map((day) => {
            const formattedDate = new Date(day.date).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })
            return (
              <div 
                key={day.date} 
                className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">{formattedDate}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{day.jumlahTrx} Transaksi Berhasil</p>
                </div>
                <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Omzet / Laba Bersih</span>
                  <p className="text-xs font-black" style={{ color: primaryColor }}>
                    {formatIDR(day.totalPenjualan)} <span className="text-[9px] text-slate-400 font-normal">/</span> <span className="text-emerald-600 font-black">{formatIDR(day.keuntunganBersih)}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 shrink-0 cursor-pointer"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              boxShadow: `0 4px 14px -4px ${primaryColor}`
            }}
          >
            Mengerti & Lanjutkan
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
  const [hasOperatingHours, setHasOperatingHours] = useState(false)
  const [operatingHours, setOperatingHours] = useState({ open: '', close: '' })

  // Custom Confirm Dialog State
  const [confirmState, setConfirmState] = useState(null)

  // Auto Close States
  const [autoClosedDays, setAutoClosedDays] = useState([])
  const [showAutoCloseModal, setShowAutoCloseModal] = useState(false)
  const [hasCheckedAutoClose, setHasCheckedAutoClose] = useState(false)

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
    const today = getTodayId()
    const startLocal = new Date(`${today}T00:00:00+07:00`).toISOString()
    const endLocal = new Date(new Date(`${today}T00:00:00+07:00`).getTime() + 86400000).toISOString()

    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('open_time, close_time')
        .eq('id', profile.store_id)
        .single()

      const hoursStatus = getStoreHoursStatus(storeData?.open_time, storeData?.close_time)
      setHasOperatingHours(hoursStatus.hasHours)
      setOperatingHours({ open: hoursStatus.openTime, close: hoursStatus.closeTime })

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
    const initDashboard = async () => {
      if (profile?.store_id) {
        if (!hasCheckedAutoClose) {
          setHasCheckedAutoClose(true)
          try {
            const closed = await autoClosePastDays(supabase, profile.store_id)
            if (closed && closed.length > 0) {
              setAutoClosedDays(closed)
              setShowAutoCloseModal(true)
            }
          } catch (err) {
            console.error("Auto close error in dashboard:", err)
          }
        }
        fetchDashboardData()
      }
    }
    initDashboard()
  }, [profile?.store_id, hasCheckedAutoClose, fetchDashboardData])

  const handleCloseDay = async () => {
    if (isClosed) return
    if (!profile?.store_id) return

    const confirmed = await showConfirm({
      icon: '🔒',
      title: 'Tutup Hari Ini?',
      message:
        `Sistem akan menghitung total modal dan keuntungan bersih hari ini.` +
        (transactions.length === 0 ? `\n\nCatatan: Tidak ada transaksi hari ini.` : '') +
        (hasOperatingHours
          ? `\n\nPeringatan: Jam operasional aktif. Kasir akan otomatis terbuka besok pada jam ${operatingHours.open} WIB.`
          : ''),
      labelYes: 'Tutup',
      labelNo: 'Batal',
    })
    if (!confirmed) return

    setClosing(true)
    const today = getTodayId()
    const startLocal = new Date(`${today}T00:00:00+07:00`).toISOString()
    const endLocal = new Date(new Date(`${today}T00:00:00+07:00`).getTime() + 86400000).toISOString()

    try {
      // Re-fetch data "hari ini" (WIB) tepat sebelum upsert agar hitungan tidak bergantung state yang mungkin stale.
      const { data: trxToday, error: trxFetchErr } = await supabase
        .from('transactions')
        .select('id, total_harga, diskon')
        .eq('store_id', profile.store_id)
        .gte('created_at', startLocal)
        .lt('created_at', endLocal)

      if (trxFetchErr) throw trxFetchErr

      const trxList = trxToday || []
      const trxIds = trxList.map(t => t.id)
      const totalHariIniFresh = trxList.reduce((acc, t) => acc + (t.total_harga || 0), 0)
      const diskonSesi = trxList.reduce((acc, t) => acc + (t.diskon || 0), 0)

      const { data: existing } = await supabase
        .from('daily_summary')
        .select('carry_over, carry_modal, carry_diskon, carry_trx_count, total_penjualan, total_modal, total_diskon, keuntungan_bersih, jumlah_transaksi')
        .eq('store_id', profile.store_id)
        .eq('date', today)
        .maybeSingle()

      const carryPenjualan = existing?.carry_over ?? 0
      const carryModal = existing?.carry_modal ?? 0
      const carryDiskon = existing?.carry_diskon ?? 0
      const carryTrxCount = existing?.carry_trx_count ?? 0

      let modalSesi = 0

      if (trxIds.length > 0) {
        const { data: items, error: itemErr } = await supabase
          .from('transaction_items')
          .select('quantity, products (harga_modal)')
          .in('transaction_id', trxIds)
        if (itemErr) throw itemErr
          ; (items || []).forEach(item => {
            modalSesi += (item.products?.harga_modal ?? 0) * item.quantity
          })
      }

      // Jika tidak ada transaksi baru hari ini, jangan buat nilai rekap baru.
      const shouldWriteRecapValues = trxList.length > 0

      const totalPenjualan = shouldWriteRecapValues ? (carryPenjualan + totalHariIniFresh) : (existing?.total_penjualan ?? carryPenjualan)
      const totalModal = shouldWriteRecapValues ? (carryModal + modalSesi) : (existing?.total_modal ?? carryModal)
      const totalDiskon = shouldWriteRecapValues ? (carryDiskon + diskonSesi) : (existing?.total_diskon ?? carryDiskon)
      const keuntunganBersih = shouldWriteRecapValues ? (totalPenjualan - totalModal) : (existing?.keuntungan_bersih ?? (totalPenjualan - totalModal))
      const jumlahTrx = shouldWriteRecapValues ? (carryTrxCount + trxList.length) : (existing?.jumlah_transaksi ?? carryTrxCount)

      const upsertPayload = {
        date: today,
        store_id: profile.store_id,
        status: 'closed',
        carry_over: carryPenjualan,
        carry_modal: carryModal,
        carry_diskon: carryDiskon,
        carry_trx_count: carryTrxCount,
      }

      if (shouldWriteRecapValues) {
        upsertPayload.total_penjualan = totalPenjualan
        upsertPayload.jumlah_transaksi = jumlahTrx
        upsertPayload.total_modal = totalModal
        upsertPayload.total_diskon = totalDiskon
        upsertPayload.keuntungan_bersih = keuntunganBersih
      } else if (!existing) {
        // Supaya kasir terkunci, tetap catat status closed tanpa masuk riwayat (akan terfilter di halaman laporan).
        upsertPayload.total_penjualan = carryPenjualan
        upsertPayload.jumlah_transaksi = carryTrxCount
        upsertPayload.total_modal = carryModal
        upsertPayload.total_diskon = carryDiskon
        upsertPayload.keuntungan_bersih = carryPenjualan - carryModal
      }

      const { error } = await supabase
        .from('daily_summary')
        .upsert(upsertPayload, { onConflict: 'date, store_id' })

      if (error) throw error

      setIsClosed(true)
      showToast(`Total Penjualan: ${formatIDR(totalPenjualan)}\nKeuntungan Bersih: ${formatIDR(keuntunganBersih)}`, 'success')
      fetchDashboardData()
    } catch (err) {
      console.error("CLOSE DAY ERROR:", err)
      showToast(`Gagal tutup: ${err.message || 'Periksa koneksi database.'}`, 'error')
    } finally {
      setClosing(false)
    }
  }

  const handleOpenDay = async () => {
    if (!profile?.store_id) return

    const confirmed = await showConfirm({
      icon: '🔓',
      title: 'Buka Kembali Hari Ini?',
      message: 'Status laporan akan menjadi "Terbuka". Data riwayat tetap tersimpan.',
      labelYes: 'Buka',
      labelNo: 'Batal',
    })
    if (!confirmed) return

    const today = getTodayId()

    try {
      const { error } = await supabase
        .from('daily_summary')
        .update({ status: 'open' })
        .eq('store_id', profile.store_id)
        .eq('date', today)
      if (error) throw error
      showToast('Berhasil dibuka kembali. Data penjualan tetap ada.', 'success')

      setIsClosed(false)
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      showToast(`Gagal membuka: ${err.message || ''}`, 'error')
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
      const savedThreshold = typeof window !== 'undefined'
        ? parseInt(localStorage.getItem('critical_stock_threshold')) || 3
        : 3
      const { data } = await supabase
        .from('products')
        .select('id, name, stock, category')
        .eq('store_id', profile.store_id)
        .lte('stock', savedThreshold)
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
      <AutoCloseModal
        isOpen={showAutoCloseModal}
        onClose={() => setShowAutoCloseModal(false)}
        closedDays={autoClosedDays}
        formatIDR={formatIDR}
        primaryColor={primaryColor}
      />

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
                className="border-2 shadow-md shadow-slate-100/50 hover:shadow-lg hover:-translate-y-1 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-300"
                style={{
                  borderColor: isClosed ? 'rgba(148, 163, 184, 0.35)' : `${primaryColor}30`,
                  background: isClosed
                    ? 'linear-gradient(135deg, rgba(148,163,184,0.18) 0%, rgba(148,163,184,0.08) 60%, #ffffff 100%)'
                    : `linear-gradient(135deg, ${primaryColor}25 0%, ${primaryColor}10 60%, #ffffff 100%)`
                }}
              >
                <div className="text-left w-full md:w-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {isClosed ? 'Rekap Penjualan (HARI DITUTUP)' : 'Total Penjualan Hari Ini'}
                    </p>
                    {isClosed && <span className="bg-emerald-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Locked</span>}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: isClosed ? '#64748b' : primaryColor }}>
                    {formatIDR(totalHariIni)}
                  </h2>
                  <div className="flex gap-4 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H3.75A1.5 1.5 0 0 1 2.25 18V6a1.5 1.5 0 0 1 1.5-1.5zm10.5 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                        Tunai
                      </span>
                      <span className="text-base font-bold text-emerald-600">{formatIDR(totalCash)}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-200/80 self-center"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h4.5v4.5h-4.5zM15.75 3.75h4.5v4.5h-4.5zM3.75 15.75h4.5v4.5h-4.5zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
                        </svg>
                        QRIS / Non-Tunai
                      </span>
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
                      disabled={closing}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                      {closing ? '...' : 'Tutup'}
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenDay}
                      className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95 text-xs uppercase tracking-wider whitespace-nowrap"
                    >
                      Buka
                    </button>
                  )}
                </div>
              </section>

              {/* AI ASSISTANT CARD */}
              <section
                onClick={() => router.push('/owner/assistant-ai')}
                className="group bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 rounded-[2rem] p-6 w-full md:w-[200px] shrink-0 flex flex-col justify-between cursor-pointer transition-all duration-300"
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
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors flex items-center gap-1">
                    Buka Asisten
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </section>

            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_200px] gap-4 mb-8">

              {/* Rekap Harian Chart */}
              {historyChart.length > 1 && (
                <section
                  onClick={() => router.push('/laporan?tab=riwayat&grafik=1&days=7')}
                  className="group bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 rounded-[2rem] p-6 transition-all cursor-pointer duration-300"
                  style={{ outline: '2px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.outline = `2px solid ${primaryColor}40`}
                  onMouseLeave={e => e.currentTarget.style.outline = '2px solid transparent'}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}10` }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4" style={{ color: primaryColor }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Riwayat Penjualan</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">7 hari terakhir</p>
                      </div>
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
                  <SalesLineChart data={historyChart} primaryColor={primaryColor} formatIDR={formatIDR} />
                  <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors flex items-center gap-1">
                      Lihat detail riwayat
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </section>
              )}

              {/* Transaksi Hari Ini */}
              <section
                onClick={() => router.push('/laporan')}
                className="group bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 rounded-[2rem] p-5 flex flex-col cursor-pointer transition-all duration-300"
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
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${trx.payment_method === 'Tunai' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                              }`}>{trx.payment_method || 'Tunai'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="mt-auto pt-3 border-t border-slate-50 flex justify-end">
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors flex items-center gap-1">
                    Lihat detail transaksi
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </section>

              {/* Stok Kritis */}
              {criticalStock.length > 0 && (
                <section
                  onClick={() => router.push('/produk')}
                  className="group bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 rounded-[2rem] p-5 flex flex-col cursor-pointer transition-all duration-300"
                  style={{ outline: '2px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.outline = `2px solid ${primaryColor}40`}
                  onMouseLeave={e => e.currentTarget.style.outline = '2px solid transparent'}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="relative p-1.5 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}10` }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4" style={{ color: primaryColor }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">Stok Kritis</p>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400">{criticalStock.length} menipis</span>
                  </div>
                  <div className="overflow-y-auto max-h-[160px] flex flex-col divide-y divide-slate-100 pr-1">
                    {criticalStock.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2.5 gap-3">
                        <p className="text-[11px] font-semibold text-slate-700 truncate">{p.name}</p>
                        <span className={`text-[10px] font-bold shrink-0 ${p.stock === 0 ? 'text-rose-500' : 'text-slate-400'
                          }`}>{p.stock === 0 ? 'Habis' : p.stock}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-50 flex justify-end">
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors flex items-center gap-1">
                      Kelola stok produk
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
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
