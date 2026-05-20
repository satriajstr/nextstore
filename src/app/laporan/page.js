'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { getUserProfile, getRole } from '../../lib/auth'
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
  if (confirm.icon === '🗑️') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    )
  } else if (confirm.icon === '🔒') {
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
  } else if (confirm.icon === '📄') {
    iconElement = (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-pink-500 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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

// ─── Custom Detail Transaksi Modal Component ──────────────────────────────────
function DetailTransaksiModal({ date, isOpen, onClose, transactions, loading, formatIDR, primaryColor }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedPayment, setSelectedPayment] = useState('Semua')

  if (!isOpen) return null

  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // 1. Get unique categories dynamically
  const categories = ['Semua', ...new Set(
    transactions.flatMap(t =>
      t.transaction_items?.map(item => item.products?.category).filter(Boolean) || []
    )
  )]

  // 2. Get unique payment methods dynamically
  const paymentMethods = ['Semua', ...new Set(
    transactions.map(t => t.payment_method).filter(Boolean)
  )]

  // 3. Filter transactions based on selection
  const filteredTransactions = transactions.map(t => {
    // Filter by payment method
    if (selectedPayment !== 'Semua' && t.payment_method !== selectedPayment) {
      return null
    }

    // Filter transaction items by category
    const filteredItems = t.transaction_items?.filter(item => {
      if (selectedCategory === 'Semua') return true
      return (item.products?.category || 'Umum') === selectedCategory
    }) || []

    if (filteredItems.length === 0) return null

    // Calculate proportional discount for this transaction's filtered items
    const diskonTrx = t.diskon || 0
    const totalKotorTrx = t.total_harga + diskonTrx
    const proportionalDiskon = filteredItems.reduce((sum, item) => {
      const diskonProp = totalKotorTrx > 0 ? (item.subtotal / totalKotorTrx) * diskonTrx : 0
      return sum + diskonProp
    }, 0)

    // Calculate gross revenue for filtered items (without subtracting discount)
    const grossSubtotal = filteredItems.reduce((sum, item) => sum + item.subtotal, 0)

    return {
      ...t,
      transaction_items: filteredItems,
      filteredDiskon: proportionalDiskon,
      filteredRevenue: grossSubtotal
    }
  }).filter(Boolean)

  // 4. Calculate dynamic summary based on filters
  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.filteredRevenue, 0)

  const totalDiscounts = filteredTransactions.reduce((acc, t) => acc + t.filteredDiskon, 0)

  const totalCash = filteredTransactions
    .filter(t => t.payment_method === 'Tunai')
    .reduce((acc, t) => acc + t.filteredRevenue, 0)

  const totalQRIS = filteredTransactions
    .filter(t => t.payment_method !== 'Tunai')
    .reduce((acc, t) => acc + t.filteredRevenue, 0)

  // 5. Generate and export CSV following the active filters
  const handleExportCSV = () => {
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

    const rows = []
    filteredTransactions.forEach(t => {
      const waktu = new Date(t.created_at).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      const diskonTrx = t.diskon || 0
      const totalKotorTrx = t.total_harga + diskonTrx

      t.transaction_items.forEach(item => {
        const subModal = (item.products?.harga_modal ?? 0) * item.quantity
        const diskonProporsional = totalKotorTrx > 0 ? (item.subtotal / totalKotorTrx) * diskonTrx : 0
        const keuntunganBersihItem = item.subtotal - diskonProporsional - subModal

        rows.push([
          waktu,
          t.id.slice(0, 8),
          `"${item.products?.name ?? '—'}"`,
          `"${item.products?.category || 'Umum'}"`,
          t.payment_method || 'Tunai',
          item.products?.harga_modal ?? 0,
          item.products?.harga_jual ?? 0,
          item.quantity,
          item.subtotal,
          diskonProporsional.toFixed(2),
          subModal,
          keuntunganBersihItem.toFixed(2)
        ])
      })
    })

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `detail-penjualan-filtered-${date}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setSelectedCategory('Semua')
    setSelectedPayment('Semua')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border"
                  style={{ color: primaryColor, borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}08` }}>
              Detail Riwayat Harian
            </span>
            <h3 className="font-extrabold text-slate-800 text-xl mt-2 tracking-tight">{formattedDate}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2.5 transition-all active:scale-95 border border-slate-100"
            aria-label="Tutup"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Penyaringan (Filter) Inputs */}
        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="flex-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Kategori Produk</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer"
              >
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Metode Pembayaran</label>
            <div className="relative">
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer"
              >
                {paymentMethods.map((met, i) => (
                  <option key={i} value={met}>{met}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Note / Info */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5 font-medium tracking-wide">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>Hasil export ringkasan penjualan otomatis terfilter berdasarkan filter aktif di atas.</span>
        </div>

        {/* Ringkasan Singkat Hari Itu (Berdasarkan Filter) */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 bg-white p-6 gap-3">
          <div className="bg-slate-50/50 p-4 rounded-2xl text-left border border-slate-100/50 cursor-help transition-all hover:bg-slate-100/50" title="Penjualan kotor sebelum dikurangi diskon">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Penjualan</span>
            <span className="text-base font-extrabold" style={{ color: primaryColor }}>{formatIDR(totalRevenue)}</span>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-2xl text-left border border-slate-100/50 cursor-help transition-all hover:bg-slate-100/50" title="Total potongan diskon pada transaksi">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Diskon</span>
            <span className="text-base font-extrabold text-amber-600">{formatIDR(totalDiscounts)}</span>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-2xl text-left border border-slate-100/50 cursor-help transition-all hover:bg-slate-100/50" title="Total pembayaran tunai sebelum dikurangi diskon">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Tunai</span>
            <span className="text-base font-extrabold text-emerald-600">{formatIDR(totalCash)}</span>
          </div>
          <div className="bg-slate-50/50 p-4 rounded-2xl text-left border border-slate-100/50 cursor-help transition-all hover:bg-slate-100/50" title="Total pembayaran QRIS/Non-Tunai sebelum dikurangi diskon">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-1">QRIS</span>
            <span className="text-base font-extrabold text-red-600">{formatIDR(totalQRIS)}</span>
          </div>
        </div>

        {/* List Transaksi */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 space-y-4 min-h-[250px]">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: primaryColor }}></div>
              <span className="text-xs font-semibold">Memuat detail transaksi...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
              </svg>
              <p className="font-semibold text-xs text-slate-400">Tidak ada transaksi yang cocok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daftar Transaksi ({filteredTransactions.length})</span>
              </div>
              {filteredTransactions.map((trx) => {
                const timeStr = new Date(trx.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Jakarta'
                })
                return (
                  <div key={trx.id} className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-slate-200 transition-all shadow-sm hover:shadow-md flex flex-col gap-3.5">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{timeStr}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] font-mono text-slate-400">#{trx.id.slice(0, 8)}</span>
                      </div>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider
                        ${trx.payment_method === 'Tunai' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {trx.payment_method || 'Tunai'}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100/50">
                      {trx.transaction_items?.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between items-center text-xs">
                          <div className="text-slate-600">
                            <span className="font-bold text-slate-700">{item.products?.name ?? '—'}</span>
                            <span className="text-slate-400 font-semibold"> × {item.quantity}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded ml-2 font-medium"
                                  style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                              ({item.products?.category || 'Umum'})
                            </span>
                          </div>
                          <span className="text-slate-800 font-bold">{formatIDR(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
                      <div>
                        {trx.filteredDiskon > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/30">
                            <span>Diskon:</span>
                            <span>-{formatIDR(trx.filteredDiskon)}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">
                          {selectedCategory !== 'Semua' ? 'Subtotal Filter' : 'Total'}
                        </span>
                        <span className="text-sm font-extrabold" style={{ color: primaryColor }}>
                          {formatIDR(trx.filteredRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0 || loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-600/10 flex items-center gap-1.5 text-xs tracking-wide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {(selectedCategory !== 'Semua' || selectedPayment !== 'Semua') ? 'Export (Terfilter)' : 'Export'}
          </button>
          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95 text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Laporan() {
  const router = useRouter()
  const { primaryColor } = useTheme()
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

  // ─── Detail Riwayat Harian States ──────────────────────────────────────────
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null)
  const [detailTransactions, setDetailTransactions] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

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

  const fetchDetailTransactions = useCallback(async (dateStr) => {
    if (!profile?.store_id) return
    setLoadingDetail(true)
    setIsDetailOpen(true)
    setSelectedHistoryDate(dateStr)

    try {
      const startLocal = new Date(`${dateStr}T00:00:00+07:00`).toISOString()
      const endLocal = new Date(new Date(`${dateStr}T00:00:00+07:00`).getTime() + 86400000).toISOString()
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, created_at, total_harga, diskon, payment_method,
          transaction_items (
            quantity, subtotal,
            products ( name, category, harga_modal, harga_jual )
          )
        `)
        .eq('store_id', profile.store_id)
        .gte('created_at', startLocal)
        .lt('created_at', endLocal)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDetailTransactions(data || [])
    } catch (err) {
      console.error("Error fetching detail:", err)
      showToast("Gagal memuat detail transaksi hari tersebut.", "error")
    } finally {
      setLoadingDetail(false)
    }
  }, [profile?.store_id, showToast])

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

    if (!profile?.store_id) {
      showToast('Gagal membatalkan transaksi: Toko tidak teridentifikasi.', 'error')
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
        .eq('store_id', profile.store_id)
        .eq('transaction_id', trx.id)

      if (fetchErr) throw fetchErr

      // 2. Kembalikan stok masing-masing barang
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('store_id', profile.store_id)
          .eq('id', item.product_id)
          .single()

        if (product) {
          await supabase
            .from('products')
            .update({ stock: (product.stock || 0) + item.quantity })
            .eq('store_id', profile.store_id)
            .eq('id', item.product_id)
        }
      }

      // 3. Hapus transaksi (Hapus items dulu untuk menghindari error foreign key)
      await supabase
        .from('transaction_items')
        .delete()
        .eq('store_id', profile.store_id)
        .eq('transaction_id', trx.id)

      const { error: deleteErr } = await supabase
        .from('transactions')
        .delete()
        .eq('store_id', profile.store_id)
        .eq('id', trx.id)

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

    if (!profile?.store_id) {
      showToast('Gagal tutup hari: Toko tidak teridentifikasi.', 'error')
      return
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
          modalSesi += (item.products?.harga_modal ?? 0) * item.quantity
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
      showToast(`Gagal tutup hari: ${err.message || 'Periksa koneksi database.'}`, 'error')
    } finally {
      setClosing(false)
    }
  }

  // ─── Buka Hari ───────────────────────────────────────────────────────────
  const handleOpenDay = async () => {
    if (!profile?.store_id) {
      showToast('Gagal membuka hari: Toko tidak teridentifikasi.', 'error')
      return
    }

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

        const { error: itemsErr } = await supabase
          .from('transaction_items')
          .delete()
          .in('transaction_id', transactions.map(t => t.id))
        if (itemsErr) throw itemsErr

        const { error: trxErr } = await supabase
          .from('transactions')
          .delete()
          .eq('store_id', profile.store_id)
          .gte('created_at', today)
        if (trxErr) throw trxErr

        showToast('Hari dibuka. Transaksi direset. Penjualan baru akan diakumulasi.', 'success')
      } else {
        const { error: updateErr } = await supabase
          .from('daily_summary')
          .update({ status: 'open' })
          .eq('store_id', profile.store_id)
          .eq('date', today)

        if (updateErr) throw updateErr

        showToast('Hari dibuka kembali. Data penjualan tetap ada.', 'success')
      }

      setIsClosed(false)
      fetchTransactions()
      fetchHistory()
    } catch (err) {
      console.error("OPEN DAY ERROR:", err)
      showToast(`Terjadi kesalahan saat membuka hari: ${err.message || ''}`, 'error')
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
    if (!profile?.store_id) {
      showToast('Gagal ekspor: Toko tidak teridentifikasi.', 'error')
      return
    }

    try {
      // 1. Ambil semua transaksi pada tanggal tersebut dengan timezone-aware bounds (WIB, UTC+7)
      const startLocal = new Date(`${dateStr}T00:00:00+07:00`).toISOString()
      const endLocal = new Date(new Date(`${dateStr}T00:00:00+07:00`).getTime() + 86400000).toISOString()

      const { data: trxList, error: trxErr } = await supabase
        .from('transactions')
        .select('id, created_at, total_harga, diskon, payment_method')
        .eq('store_id', profile.store_id)
        .gte('created_at', startLocal)
        .lt('created_at', endLocal)
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
        const subModal = (item.products?.harga_modal ?? 0) * item.quantity
        const fullTrx = trxList.find(t => t.id === item.transaction_id)
        const diskonTrx = fullTrx?.diskon || 0
        const metode = fullTrx?.payment_method || 'Tunai'

        const totalKotorTrx = (fullTrx?.total_harga ?? 0) + diskonTrx
        const diskonProporsional = totalKotorTrx > 0 ? (item.subtotal / totalKotorTrx) * diskonTrx : 0
        const keuntunganBersihItem = item.subtotal - diskonProporsional - subModal

        return [
          waktu,
          item.transaction_id.slice(0, 8),
          `"${item.products?.name ?? '—'}"`,
          `"${item.products?.category || 'Umum'}"`,
          metode,
          item.products?.harga_modal ?? 0,
          item.products?.harga_jual ?? 0,
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      )}
      <ConfirmDialog confirm={confirmState} onYes={handleConfirmYes} onNo={handleConfirmNo} />

      <main className="flex min-h-screen bg-white text-slate-800 font-sans">
        <AdminSidebar />
        <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
          <div className="max-w-4xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight" style={{ color: primaryColor }}>Laporan Harian</h1>
                <p className="text-slate-400 text-xs mt-0.5">Rekap penjualan Anda hari ini</p>
              </div>
            </header>

            {/* ACTION BANNER */}
            <section className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Status Hari Operasional</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {isClosed 
                    ? 'Hari ini telah ditutup. Kasir tidak bisa melakukan transaksi baru.' 
                    : 'Hari operasional aktif. Jangan lupa untuk menutup hari saat selesai.'}
                </p>
              </div>

              <div className="flex gap-4 items-center">
                {!isClosed ? (
                  <button
                    onClick={handleCloseDay}
                    disabled={closing}
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
                    className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all active:scale-95 text-xs uppercase tracking-wider"
                  >
                    Buka Hari
                  </button>
                )}
              </div>
            </section>

            {/* TRANSACTION LIST */}
            <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Detail Transaksi Hari Ini</h3>
                {transactions.length > 0 && (
                  <button
                    onClick={() => exportDailyDetailCSV(new Date().toISOString().split('T')[0])}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Export Detail</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
                    <span className="text-xs font-medium">Memuat data...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="font-semibold text-xs text-slate-400">Belum ada transaksi hari ini.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4">Waktu</th>
                        <th className="px-6 py-4">Produk yang Dibeli</th>
                        <th className="px-6 py-4 text-center">Metode</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {transactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors align-top">
                          <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                            <p className="font-semibold text-slate-700">{formatTime(trx.created_at)}</p>
                            <p className="text-[9px] font-mono text-slate-400 mt-0.5">#{trx.id.slice(0, 8)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              {trx.transaction_items?.map((item, i) => (
                                <span key={i} className="text-xs text-slate-600">
                                  <span className="font-bold text-slate-700">{item.products?.name ?? '—'}</span>
                                  <span className="text-slate-400 font-semibold"> × {item.quantity}</span>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded ml-2 font-medium"
                                        style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                                    ({formatIDR(item.subtotal)})
                                  </span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider
                            ${trx.payment_method === 'Tunai' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {trx.payment_method || 'Tunai'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <p className="font-bold text-slate-800 text-xs">{formatIDR(trx.total_harga)}</p>
                            {trx.diskon > 0 && (
                              <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/30 inline-block mt-1">
                                Diskon -{formatIDR(trx.diskon)}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleVoidTransaction(trx)}
                              disabled={isClosed}
                              className="px-4 py-1.5 bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-30 disabled:hover:bg-rose-500 text-[9px] font-bold rounded-xl transition-colors uppercase tracking-widest shadow-sm"
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
            <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Riwayat Rekap Harian</h3>
                  <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest mt-1 inline-block border"
                        style={{ color: primaryColor, borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}08` }}>
                    Data Permanen
                  </span>
                </div>
                <button
                  onClick={exportCSV}
                  disabled={history.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Export Riwayat</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                {history.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <span className="text-xs font-semibold">Belum ada riwayat penutupan hari.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4 text-right">Penjualan</th>
                        <th className="px-6 py-4 text-right">Modal</th>
                        <th className="px-6 py-4 text-right">Untung Bersih</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {history.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => fetchDetailTransactions(item.date)}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer select-none group"
                          title="Klik untuk melihat detail transaksi hari ini"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                              {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </p>
                            <p className="text-[9px] text-slate-400 font-mono">#{item.jumlah_transaksi} Trx</p>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600 font-bold text-xs">{formatIDR(item.total_penjualan)}</td>
                          <td className="px-6 py-4 text-right text-slate-400 text-xs">{formatIDR(item.total_modal)}</td>
                          <td className="px-6 py-4 text-right font-black text-xs" style={{ color: primaryColor }}>{formatIDR(item.keuntungan_bersih)}</td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                exportDailyDetailCSV(item.date)
                              }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-extrabold transition-all active:scale-95 flex items-center gap-1 mx-auto shadow-sm"
                              title="Export detail transaksi hari ini"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              <span>Export Detail</span>
                            </button>
                          </td>
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
      <DetailTransaksiModal
        date={selectedHistoryDate}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedHistoryDate(null)
          setDetailTransactions([])
        }}
        transactions={detailTransactions}
        loading={loadingDetail}
        formatIDR={formatIDR}
        primaryColor={primaryColor}
      />
    </>
  )
}
