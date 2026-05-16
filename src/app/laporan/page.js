'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { getUserProfile, getRole } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '../../components/AdminSidebar'

// ─── Custom Toast Component ──────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed top-6 right-6 z-50 max-w-sm w-full shadow-2xl rounded-2xl p-5 flex items-start gap-4 transition-all animate-fade-in
      ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <span className="text-2xl">{isSuccess ? '✅' : '❌'}</span>
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col gap-5 animate-fade-in">
        <div className="text-3xl">{confirm.icon ?? '❓'}</div>
        <div>
          <p className="font-black text-gray-800 text-lg">{confirm.title ?? 'Konfirmasi'}</p>
          <p className="text-gray-500 text-sm mt-1 whitespace-pre-line">{confirm.message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onNo}
            className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
          >
            {confirm.labelNo ?? 'Batal'}
          </button>
          <button
            onClick={onYes}
            className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all active:scale-95 shadow-md
              ${confirm.danger ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-100'}`}
          >
            {confirm.labelYes ?? 'Ya'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Laporan() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const userProfile = await getUserProfile()
      if (!userProfile) {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      if (userProfile.role === 'kasir') {
        router.replace('/')
        return
      }

      if (userProfile.role !== 'admin') {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      setProfile(userProfile)
      setRole(userProfile.role)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])
  const [transactions, setTransactions] = useState([])
  const [totalHariIni, setTotalHariIni] = useState(0)
  const [totalCash, setTotalCash] = useState(0)
  const [totalQRIS, setTotalQRIS] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isClosed, setIsClosed] = useState(false)
  const [closing, setClosing] = useState(false)
  const [history, setHistory] = useState([])

  // ─── Overlay States ───────────────────────────────────────────────────────
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

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    if (!profile?.store_id) return
    setLoading(true)
    const todayStr = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, created_at, total_harga, diskon, payment_method,
        transaction_items (
          quantity, subtotal,
          products ( name )
        )
      `)
      .eq('store_id', profile.store_id)
      .gte('created_at', todayStr)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
    } else {
      setTransactions(data || [])
      const sum = data?.reduce((acc, trx) => acc + trx.total_harga, 0) || 0
      const cash = data?.filter(t => t.payment_method === 'Tunai').reduce((acc, t) => acc + t.total_harga, 0) || 0
      const qris = data?.filter(t => t.payment_method !== 'Tunai').reduce((acc, t) => acc + t.total_harga, 0) || 0

      setTotalHariIni(sum)
      setTotalCash(cash)
      setTotalQRIS(qris)
    }
    setLoading(false)
  }, [profile?.store_id])

  const fetchHistory = useCallback(async () => {
    if (!profile?.store_id) return
    const { data } = await supabase
      .from('daily_summary')
      .select('*')
      .eq('store_id', profile.store_id)
      .order('date', { ascending: false })
    if (data) setHistory(data)
  }, [profile?.store_id])

  const checkStatus = useCallback(async () => {
    if (!profile?.store_id) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('daily_summary')
      .select('status')
      .eq('store_id', profile.store_id)
      .eq('date', today)
      .maybeSingle()
    setIsClosed(data?.status === 'closed')
  }, [profile?.store_id])

  useEffect(() => {
    fetchTransactions()
    checkStatus()
    fetchHistory()
  }, [fetchTransactions, checkStatus, fetchHistory])

  // ─── Batal Transaksi ──────────────────────────────────────────────────────
  const handleVoidTransaction = async (trx) => {
    if (isClosed) {
      showToast('Tidak bisa membatalkan transaksi pada hari yang sudah ditutup.\nBuka hari terlebih dahulu.', 'error')
      return
    }

    const confirmed = await showConfirm({
      icon: '🗑️',
      title: 'Batalkan Transaksi?',
      message: `Yakin membatalkan transaksi #${trx.id.slice(0, 8)} senilai ${formatIDR(trx.total_harga)}?\nStok barang akan otomatis dikembalikan.`,
      labelYes: 'Ya, Batalkan',
      labelNo: 'Kembali',
      danger: true,
    })

    if (!confirmed) return

    try {
      // 1. Dapatkan detail items untuk mengembalikan stok
      const { data: items, error: fetchErr } = await supabase
        .from('transaction_items')
        .select('product_id, quantity')
        .eq('transaction_id', trx.id)

      if (fetchErr) throw fetchErr

      // 2. Kembalikan stok masing-masing barang
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single()

        if (product) {
          await supabase
            .from('products')
            .update({ stock: (product.stock || 0) + item.quantity })
            .eq('id', item.product_id)
        }
      }

      // 3. Hapus transaksi (Hapus items dulu untuk menghindari error foreign key)
      await supabase.from('transaction_items').delete().eq('transaction_id', trx.id)

      const { error: deleteErr } = await supabase.from('transactions').delete().eq('id', trx.id)

      if (deleteErr) throw deleteErr

      showToast('Transaksi dibatalkan dan stok dikembalikan.', 'success')
      fetchTransactions()
    } catch (error) {
      showToast('Gagal membatalkan transaksi.', 'error')
      console.error(error)
    }
  }

  // ─── Tutup Hari ───────────────────────────────────────────────────────────
  const handleCloseDay = async () => {
    if (isClosed) return

    if (transactions.length === 0) {
      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('daily_summary').select('carry_over').eq('date', today).maybeSingle()
      if (!existing || existing.carry_over === 0) {
        showToast('Belum ada transaksi untuk ditutup.', 'error')
        return
      }
    }

    const confirmed = await showConfirm({
      icon: '🔒',
      title: 'Tutup Hari Ini?',
      message: 'Sistem akan menghitung total modal dan keuntungan bersih hari ini.',
      labelYes: 'Tutup Hari',
      labelNo: 'Batal',
    })
    if (!confirmed) return

    setClosing(true)
    const today = new Date().toISOString().split('T')[0]

    try {
      const { data: existing } = await supabase
        .from('daily_summary')
        .select('carry_over, carry_modal, carry_diskon, carry_trx_count')
        .eq('store_id', profile.store_id)
        .eq('date', today)
        .maybeSingle()

      const carryPenjualan = existing?.carry_over ?? 0
      const carryModal = existing?.carry_modal ?? 0
      const carryDiskon = existing?.carry_diskon ?? 0
      const carryTrxCount = existing?.carry_trx_count ?? 0

      let modalSesi = 0
      let diskonSesi = transactions.reduce((acc, trx) => acc + (trx.diskon || 0), 0)

      if (transactions.length > 0) {
        const { data: items, error: itemErr } = await supabase
          .from('transaction_items')
          .select('quantity, products (harga_modal)')
          .in('transaction_id', transactions.map(t => t.id))
        if (itemErr) throw itemErr
        items.forEach(item => {
          modalSesi += item.products.harga_modal * item.quantity
        })
      }

      const totalPenjualan = carryPenjualan + totalHariIni
      const totalModal = carryModal + modalSesi
      const totalDiskon = carryDiskon + diskonSesi
      const keuntunganBersih = totalPenjualan - totalModal
      const jumlahTrx = carryTrxCount + transactions.length

      const { error } = await supabase
        .from('daily_summary')
        .upsert({
          date: today,
          store_id: profile.store_id,
          total_penjualan: totalPenjualan,
          jumlah_transaksi: jumlahTrx,
          total_modal: totalModal,
          total_diskon: totalDiskon,
          keuntungan_bersih: keuntunganBersih,
          status: 'closed',
          carry_over: carryPenjualan,
          carry_modal: carryModal,
          carry_diskon: carryDiskon,
          carry_trx_count: carryTrxCount
        }, { onConflict: 'date, store_id' })

      if (error) throw error

      setIsClosed(true)
      fetchHistory()
      showToast(`Total Penjualan: ${formatIDR(totalPenjualan)}\nKeuntungan Bersih: ${formatIDR(keuntunganBersih)}`, 'success')

      // Tawarkan export CSV detail setelah tutup hari
      const wantExport = await showConfirm({
        icon: '📄',
        title: 'Export Laporan Detail?',
        message: `Ekspor rincian seluruh transaksi hari ini ke file CSV?`,
        labelYes: 'Export CSV',
        labelNo: 'Lewati',
      })
      if (wantExport) await exportDailyDetailCSV(today)

    } catch (err) {
      console.error("CLOSE DAY ERROR:", err)
      showToast('Gagal tutup hari. Periksa koneksi database.', 'error')
    } finally {
      setClosing(false)
    }
  }

  // ─── Buka Hari ───────────────────────────────────────────────────────────
  const handleOpenDay = async () => {
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
        const { data: currentSummary } = await supabase
          .from('daily_summary')
          .select('total_penjualan, total_modal, total_diskon, jumlah_transaksi')
          .eq('date', today)
          .single()

        await supabase
          .from('daily_summary')
          .update({
            status: 'open',
            carry_over: currentSummary?.total_penjualan ?? 0,
            carry_modal: currentSummary?.total_modal ?? 0,
            carry_diskon: currentSummary?.total_diskon ?? 0,
            carry_trx_count: currentSummary?.jumlah_transaksi ?? 0
          })
          .eq('date', today)

        const { error: itemsErr } = await supabase
          .from('transaction_items')
          .delete()
          .in('transaction_id', transactions.map(t => t.id))
        if (itemsErr) throw itemsErr

        const { error: trxErr } = await supabase
          .from('transactions')
          .delete()
          .gte('created_at', today)
        if (trxErr) throw trxErr

        showToast('Hari dibuka. Transaksi direset. Penjualan baru akan diakumulasi.', 'success')
      } else {
        await supabase
          .from('daily_summary')
          .update({ status: 'open' })
          .eq('date', today)

        showToast('Hari dibuka kembali. Data penjualan tetap ada.', 'success')
      }

      setIsClosed(false)
      fetchTransactions()
      fetchHistory()
    } catch (err) {
      console.error("OPEN DAY ERROR:", err)
      showToast('Terjadi kesalahan saat membuka hari.', 'error')
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatIDR = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount ?? 0)

  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
  })

  const exportCSV = () => {
    if (history.length === 0) {
      showToast('Belum ada data riwayat untuk diekspor.', 'error')
      return
    }
    const headers = ['Tanggal', 'Total Penjualan', 'Total Diskon', 'Total Modal', 'Keuntungan Bersih', 'Jumlah Transaksi']
    const rows = history.map(item => [
      item.date, item.total_penjualan, item.total_diskon ?? 0,
      item.total_modal ?? 0, item.keuntungan_bersih ?? 0, item.jumlah_transaksi
    ])
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-penjualan-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export CSV detail per item transaksi untuk tanggal tertentu
  const exportDailyDetailCSV = async (dateStr) => {
    try {
      // 1. Ambil semua transaksi pada tanggal tersebut
      const { data: trxList, error: trxErr } = await supabase
        .from('transactions')
        .select('id, created_at, total_harga, diskon, payment_method')
        .eq('store_id', profile.store_id)
        .gte('created_at', dateStr)
        .lt('created_at', new Date(new Date(dateStr).getTime() + 86400000).toISOString().split('T')[0])
        .order('created_at', { ascending: true })

      if (trxErr) throw trxErr
      if (!trxList || trxList.length === 0) {
        showToast('Tidak ada data transaksi untuk diekspor.', 'error')
        return
      }

      // 2. Ambil detail items + join produk
      const { data: items, error: itemErr } = await supabase
        .from('transaction_items')
        .select(`
          transaction_id,
          quantity,
          subtotal,
          products (name, category, harga_modal, harga_jual)
        `)
        .in('transaction_id', trxList.map(t => t.id))

      if (itemErr) throw itemErr

      // 3. Buat map trx_id → created_at untuk kolom Waktu
      const trxMap = Object.fromEntries(trxList.map(t => [t.id, t.created_at]))

      // 4. Build CSV rows
      const headers = [
        'Waktu (WIB)',
        'ID Transaksi',
        'Nama Produk',
        'Kategori',
        'Metode',
        'Harga Modal',
        'Harga Jual',
        'Qty',
        'Subtotal Jual (Kotor)',
        'Diskon (Proporsional)',
        'Subtotal Modal',
        'Keuntungan Bersih Item'
      ]

      const rows = items.map(item => {
        const waktu = new Date(trxMap[item.transaction_id]).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
        const subModal = item.products.harga_modal * item.quantity
        const fullTrx = trxList.find(t => t.id === item.transaction_id)
        const diskonTrx = fullTrx?.diskon || 0
        const metode = fullTrx?.payment_method || 'Tunai'

        const totalKotorTrx = fullTrx.total_harga + diskonTrx
        const diskonProporsional = totalKotorTrx > 0 ? (item.subtotal / totalKotorTrx) * diskonTrx : 0
        const keuntunganBersihItem = item.subtotal - diskonProporsional - subModal

        return [
          waktu,
          item.transaction_id.slice(0, 8),
          `"${item.products.name}"`,
          `"${item.products.category || 'Umum'}"`,
          metode,
          item.products.harga_modal,
          item.products.harga_jual,
          item.quantity,
          item.subtotal,
          diskonProporsional.toFixed(2),
          subModal,
          keuntunganBersihItem.toFixed(2)
        ]
      })

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `detail-penjualan-${dateStr}.csv`
      link.click()
      URL.revokeObjectURL(url)
      showToast(`Export berhasil: detail-penjualan-${dateStr}.csv`, 'success')
    } catch (err) {
      console.error('EXPORT DETAIL ERROR:', err)
      showToast('Gagal mengekspor data detail.', 'error')
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {checkingAuth && (
        <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      )}
      <ConfirmDialog confirm={confirmState} onYes={handleConfirmYes} onNo={handleConfirmNo} />

      <main className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
        <AdminSidebar />
        <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
          <div className="max-w-4xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-pink-500 tracking-tighter">Laporan Harian</h1>
                <p className="text-gray-500 text-sm">Rekap penjualan Anda hari ini</p>
              </div>
            </header>

            {/* SUMMARY CARD */}
            <section className={`rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6 transition-colors ${isClosed ? 'bg-gray-800 shadow-gray-100' : 'bg-pink-500 shadow-pink-100'}`}>
              <div className="text-center md:text-left">
                <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                  <p className="text-pink-100 text-sm font-medium uppercase tracking-wider opacity-80">
                    {isClosed ? 'Rekap Penjualan (HARI DITUTUP)' : 'Total Penjualan Hari Ini'}
                  </p>
                  {isClosed && <span className="bg-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Locked</span>}
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                  {formatIDR(totalHariIni)}
                </h2>
                <div className="flex gap-4 mt-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-pink-100 uppercase font-bold opacity-60">Tunai</span>
                    <span className="text-lg font-bold text-green-300">{formatIDR(totalCash)}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/20 self-center"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-pink-100 uppercase font-bold opacity-60">QRIS / Non-Tunai</span>
                    <span className="text-lg font-bold text-red-300">{formatIDR(totalQRIS)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 min-w-[120px]">
                  <p className="text-xs text-pink-100 mb-1 opacity-70">Transaksi</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>

                {!isClosed ? (
                  <button
                    onClick={handleCloseDay}
                    disabled={closing || transactions.length === 0}
                    className="bg-white text-pink-500 px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-pink-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {closing ? '...' : 'Tutup Hari'}
                  </button>
                ) : (
                  <button
                    onClick={handleOpenDay}
                    className="bg-green-500 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-green-600 transition-all active:scale-95 flex flex-col items-center leading-tight"
                  >
                    <span className="text-[10px] uppercase opacity-80">Status: Closed</span>
                    <span>Buka Hari</span>
                  </button>
                )}
              </div>
            </section>

            {/* TRANSACTION LIST */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Detail Transaksi Hari Ini</h3>
                {transactions.length > 0 && (
                  <button
                    onClick={() => exportDailyDetailCSV(new Date().toISOString().split('T')[0])}
                    className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-all shadow-md shadow-green-100 flex items-center gap-2"
                  >
                    ⬇ Export Detail Hari Ini
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    Memuat data...
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <span className="text-4xl mb-4 block">📭</span>
                    <p>Belum ada transaksi hari ini.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="px-6 py-4">Waktu</th>
                        <th className="px-6 py-4">Produk yang Dibeli</th>
                        <th className="px-6 py-4 text-center">Metode</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-gray-50 transition-colors align-top">
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <p>{formatTime(trx.created_at)}</p>
                            <p className="text-[10px] font-mono text-gray-300 mt-0.5">#{trx.id.slice(0, 8)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {trx.transaction_items?.map((item, i) => (
                                <span key={i} className="text-sm text-gray-600">
                                  <span className="font-medium">{item.products?.name ?? '—'}</span>
                                  <span className="text-gray-400"> × {item.quantity}</span>
                                  <span className="text-pink-400 ml-1 text-xs">({formatIDR(item.subtotal)})</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest
                            ${trx.payment_method === 'Tunai' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {trx.payment_method || 'Tunai'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <p className="font-bold text-gray-700">{formatIDR(trx.total_harga)}</p>
                            {trx.diskon > 0 && (
                              <p className="text-xs text-amber-500 font-medium">Diskon {formatIDR(trx.diskon)}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleVoidTransaction(trx)}
                              disabled={isClosed}
                              className="px-4 py-1.5 bg-red-500 text-white hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-red-500 text-[10px] font-bold rounded-full transition-colors uppercase tracking-widest shadow-sm"
                            >
                              REFUND
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* DAILY SUMMARY HISTORY */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-blue-50/30 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-blue-800">Riwayat Rekap Harian</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">DATA PERMANEN</span>
                </div>
                <button
                  onClick={exportCSV}
                  disabled={history.length === 0}
                  className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-all shadow-md shadow-green-100 flex items-center gap-2 disabled:opacity-50"
                >
                  ⬇ Export Riwayat
                </button>
              </div>
              <div className="overflow-x-auto">
                {history.length === 0 ? (
                  <div className="p-12 text-center text-gray-300">
                    <p>Belum ada riwayat penutupan hari.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4 text-right">Penjualan</th>
                        <th className="px-6 py-4 text-right">Modal</th>
                        <th className="px-6 py-4 text-right text-pink-500">Untung Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-700">
                              {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">#{item.jumlah_transaksi} Trx</p>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600 font-medium">{formatIDR(item.total_penjualan)}</td>
                          <td className="px-6 py-4 text-right text-gray-400 text-sm">{formatIDR(item.total_modal)}</td>
                          <td className="px-6 py-4 text-right font-black text-pink-500">{formatIDR(item.keuntungan_bersih)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
