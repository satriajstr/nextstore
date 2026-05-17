'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { getUserProfile, signOut } from '../lib/auth'
import { useRouter } from 'next/navigation'
import { useTheme } from '../lib/ThemeContext'

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed top-6 right-6 z-50 max-w-sm w-full shadow-2xl rounded-2xl p-5 flex items-start gap-4 animate-fade-in
      ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <span className="text-2xl">{isSuccess ? '✅' : '❌'}</span>
      <div className="flex-1">
        <p className={`font-semibold text-sm ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
          {isSuccess ? 'Berhasil' : 'Gagal'}
        </p>
        <p className={`text-sm mt-0.5 ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
          {toast.message}
        </p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>
  )
}

export default function Home() {
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

      if (userProfile.role === 'admin') {
        router.replace('/produk')
        return
      }

      if (userProfile.role !== 'kasir') {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }

      if (userProfile.status !== 'approved') {
        setRole('pending_kasir')
        setCheckingAuth(false)
        return
      }

      setProfile(userProfile)
      setRole(userProfile.role)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const { storeName, primaryColor } = useTheme()
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [showFullCart, setShowFullCart] = useState(false)
  const [tappedProductId, setTappedProductId] = useState(null)

  // Customization States
  const [gridCols, setGridCols] = useState(3)
  const [itemFontSize, setItemFontSize] = useState(16)
  const [showSettings, setShowSettings] = useState(false)

  // Swipe & Animation Management
  const touchStart = useRef(0)
  // Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [amountReceived, setAmountReceived] = useState('')
  const [selectedQuickCash, setSelectedQuickCash] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [isClosed, setIsClosed] = useState(false)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // 1. Fetch Products
  const getData = useCallback(async () => {
    if (!profile?.store_id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', profile.store_id)
      .order('name', { ascending: true })

    if (data) {
      setProducts(data)
    } else if (error) {
      console.error("Error fetching products:", error)
    }
    setLoading(false)
  }, [profile?.store_id])

  // 1.1 Check Store Closed Status
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
    getData()
    checkStatus()
  }, [getData, checkStatus])

  // 2. Add to Cart Logic
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          harga_jual: product.harga_jual,
          quantity: 1
        }
      ]
    })
  }

  // 3. Remove/Decrease from Cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId)
      if (!existingItem) return prevCart
      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId)
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      )
    })
  }

  // 4. Calculations & Formatter
  const totalHarga = cart.reduce((acc, item) => acc + (item.harga_jual * item.quantity), 0)

  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const [processing, setProcessing] = useState(false)
  const [voucher, setVoucher] = useState(0)

  const totalTagihan = Math.max(0, totalHarga - voucher)
  const VOUCHER_OPTIONS = [500, 1000, 2000, 3000, 4000, 5000]

  const kembalian = Math.max(0, (parseInt(amountReceived) || 0) - totalTagihan)

  // 5. Finalize Checkout
  const handleFinalizeCheckout = async () => {
    if (cart.length === 0) return
    if (isClosed) {
      showToast('Toko sudah tutup hari ini! Transaksi baru tidak diperbolehkan.', 'error')
      return
    }
    if (paymentMethod === 'Tunai' && (parseInt(amountReceived) || 0) < totalTagihan) {
      showToast('Uang diterima kurang dari total tagihan!', 'error')
      return
    }

    setProcessing(true)

    try {
      // Step 1: Insert Transaction Header
      const { data: trx, error: trxError } = await supabase
        .from('transactions')
        .insert([{
          total_harga: totalTagihan,
          diskon: voucher,
          payment_method: paymentMethod,
          store_id: profile.store_id
        }])
        .select()
        .single()

      if (trxError) throw trxError

      // Step 2: Prepare & Insert Transaction Items
      const items = cart.map(item => ({
        transaction_id: trx.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.harga_jual * item.quantity,
        store_id: profile.store_id
      }))

      const { error: itemError } = await supabase
        .from('transaction_items')
        .insert(items)

      if (itemError) throw itemError

      // Step 3: Update Product Stock
      const stockUpdates = cart.map(async (item) => {
        const product = products.find(p => p.id === item.id)
        const newStock = (product.stock || 0) - item.quantity

        return supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.id)
      })

      await Promise.all(stockUpdates)

      // Success Flow
      setCart([])
      setVoucher(0)
      setAmountReceived('')
      setSelectedQuickCash(null)
      setShowCheckoutModal(false)
      setShowFullCart(false)
      await getData()
      showToast('Transaksi berhasil!', 'success')

    } catch (error) {
      console.error("CHECKOUT ERROR:", error)
      showToast('Gagal memproses transaksi.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  // Filter & Sort Logic (Strict Keyword Match & Relevance Scoring)
  const filteredProducts = products.filter(p => {
    // 1. Filter Kategori
    const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory
    if (!matchCategory) return false

    // 2. Filter Keyword (Semua kata yang diketik harus ada di nama/kategori)
    const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean)
    if (searchTerms.length === 0) return true

    const searchString = `${p.name} ${p.category || ''}`.toLowerCase()
    return searchTerms.every(term => searchString.includes(term))
  }).sort((a, b) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return 0

    // Fungsi Pemberian Nilai (Scoring) agar yang paling cocok naik ke atas
    const getScore = (p) => {
      let score = 0
      const name = p.name.toLowerCase()
      const cat = (p.category || '').toLowerCase()

      if (name === term) score += 100 // Cocok persis
      else if (name.startsWith(term)) score += 50 // Berawalan kata tersebut
      else if (name.includes(` ${term} `) || name.endsWith(` ${term}`)) score += 30 // Kata terpisah utuh
      else if (name.includes(term)) score += 10 // Bagian dari kata lain

      if (cat === term) score += 20
      else if (cat.includes(term)) score += 5

      return score
    }

    const scoreA = getScore(a)
    const scoreB = getScore(b)

    if (scoreA === scoreB) {
      return a.name.localeCompare(b.name)
    }
    return scoreB - scoreA
  })

  // Extract Categories
  const categoriesList = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]



  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {checkingAuth && (
        <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      )}

      {role === 'pending_kasir' && (
        <div className="fixed inset-0 z-[150] bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-fade-in border border-gray-100">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">⏳</div>
            <h2 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">Akun Sedang Diverifikasi</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Pendaftaran Anda berhasil! Namun, Admin toko perlu <strong>menyetujui</strong> akun Anda sebelum Anda bisa mulai bertransaksi.
            </p>
            <button onClick={signOut} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95 text-sm uppercase tracking-widest">
              Keluar
            </button>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="fixed inset-0 z-[150] bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-fade-in border border-gray-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🔒</div>
            <h2 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">Hari Kerja Ditutup</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Toko <strong>{storeName}</strong> telah menutup operasional hari ini. Anda tidak dapat membuka kasir atau memproses transaksi baru hingga hari kerja dibuka kembali oleh Admin.
            </p>
            <button onClick={signOut} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all active:scale-95 text-sm uppercase tracking-widest">
              Keluar / Logout
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL (SMART CALCULATOR) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-fade-in flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">💳 Selesaikan Pembayaran</h3>
              <button onClick={() => { setShowCheckoutModal(false); setAmountReceived(''); setSelectedQuickCash(null); }} className="text-gray-300 hover:text-gray-500 text-2xl">×</button>
            </div>

            {/* Total Display */}
            <div className="bg-pink-50 rounded-3xl p-6 text-center">
              <p className="text-[10px] text-pink-400 font-bold uppercase tracking-[0.2em] mb-1">Total Harus Dibayar</p>
              <h4 className="text-4xl font-bold text-pink-500 tracking-tighter">{formatIDR(totalTagihan)}</h4>
            </div>

            {/* Payment Method */}
            <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
              {['Tunai', 'QRIS'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all
                    ${paymentMethod === m ? 'bg-white text-pink-500 shadow-sm border border-pink-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {paymentMethod === 'Tunai' && (
              <div className="space-y-4">
                {/* Input Received */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Uang Diterima</label>
                  <div className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-2xl font-bold text-gray-800 flex items-center justify-between">
                    <span className="text-gray-400 text-sm font-bold">Rp</span>
                    <span className="tabular-nums">{amountReceived ? parseInt(amountReceived).toLocaleString('id-ID') : '0'}</span>
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'UANG PAS', value: totalTagihan.toString() },
                    { label: '10.000', value: '10000' },
                    { label: '20.000', value: '20000' },
                    { label: '40.000', value: '40000' },
                    { label: '50.000', value: '50000' },
                    { label: '100.000', value: '100000' }
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => {
                        setAmountReceived(btn.value)
                        setSelectedQuickCash(btn.label)
                      }}
                      className={`py-3 rounded-xl text-[10px] font-bold transition-colors duration-75 active:scale-95 border shadow-sm
                        ${selectedQuickCash === btn.label
                          ? 'bg-pink-500 text-white border-pink-500 ring-2 ring-pink-100'
                          : 'bg-white text-gray-600 border-gray-100 active:bg-gray-50'}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Change Result */}
                <div className={`p-5 rounded-2xl border transition-all flex justify-between items-center
                  ${amountReceived >= totalTagihan ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kembalian</span>
                  <span className={`text-xl font-bold ${amountReceived >= totalTagihan ? 'text-green-600' : 'text-gray-300'}`}>
                    {formatIDR(kembalian)}
                  </span>
                </div>
              </div>
            )}

            <button
              disabled={processing || (paymentMethod === 'Tunai' && (parseInt(amountReceived) || 0) < totalTagihan)}
              onClick={handleFinalizeCheckout}
              className={`w-full py-5 rounded-[2rem] font-bold text-lg transition-all shadow-xl active:scale-[0.98]
                ${processing || (paymentMethod === 'Tunai' && (parseInt(amountReceived) || 0) < totalTagihan)
                  ? 'bg-gray-100 text-gray-300 shadow-none'
                  : 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-100'
                }`}
            >
              {processing ? 'Memproses...' : 'Konfirmasi & Simpan'}
            </button>
          </div>
        </div>
      )}

      <main className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-900 font-sans relative">

        {/* LEFT SIDE: PRODUCT LIST */}
        <section
          className="w-full md:w-3/5 border-r border-gray-200"
        >

          <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-md p-4 md:p-8 border-b border-gray-100/50">
            {isClosed && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 animate-pulse">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-bold text-sm">Status Toko: HARI DITUTUP</p>
                  <p className="text-xs text-amber-700">Toko telah melakukan penutupan hari. Transaksi baru tidak diperbolehkan hingga hari dibuka kembali oleh Admin.</p>
                </div>
              </div>
            )}
            <header className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-lg flex-shrink-0"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}50` }}>
                    🛍️
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-black text-gray-800 tracking-tight leading-none text-xl truncate">{storeName}</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1.5" style={{ color: primaryColor }}>
                      Cashier Panel
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Settings Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-600 transition-all border border-gray-100 shadow-sm"
                      title="Pengaturan Tampilan"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {showSettings && (
                      <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl z-[60] p-5 animate-fade-in origin-top-right">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Pengaturan</h4>

                        <div className="space-y-5">
                          {/* Column Setting */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-600 block">Kolom Produk (Desktop)</label>
                            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                              {[2, 3].map(cols => (
                                <button
                                  key={cols}
                                  onClick={() => setGridCols(cols)}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${gridCols === cols ? 'bg-white text-pink-500 shadow-sm shadow-pink-100' : 'text-gray-400'}`}
                                >
                                  {cols} Kolom
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Font Size Setting */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-600 block">Ukuran Font Nama ({itemFontSize}px)</label>
                            <input
                              type="range"
                              min="12"
                              max="20"
                              step="1"
                              value={itemFontSize}
                              onChange={(e) => setItemFontSize(parseInt(e.target.value))}
                              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            />
                            <div className="flex justify-between text-[9px] text-gray-400 font-bold px-1">
                              <span>KECIL</span>
                              <span>BESAR</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100 transition-all shadow-sm border border-red-100/50 uppercase tracking-widest group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>

              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 group-focus-within:text-pink-500 transition-colors">🔍</span>
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-200/20 backdrop-blur-sm border border-gray-200/50 rounded-2xl text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/30 transition-all shadow-sm font-normal"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-gray-200/50 hover:bg-gray-300/50 text-gray-500 rounded-full transition-all active:scale-90"
                    title="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

            </header>
          </div>

          <div className="px-4 md:px-8 pb-24 md:pb-8 pt-4 transition-all duration-300">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-400"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Produk tidak ditemukan</p>
                <button onClick={() => { setSearchTerm(''); setSelectedCategory('Semua') }} className="text-pink-500 text-xs font-bold mt-2 hover:underline">Reset Filter</button>
              </div>
            ) : (
              <div
                key={selectedCategory}
                className={`grid gap-4 ${gridCols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
              >
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    disabled={processing}
                    onClick={() => {
                      addToCart(product)
                      setTappedProductId(product.id)
                      setTimeout(() => setTappedProductId(null), 600)
                    }}
                    className="flex flex-col p-5 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-50/50 transition-all active:scale-95 text-left h-40 disabled:opacity-50 group overflow-hidden relative"
                  >
                    <div className="flex flex-col gap-1.5 items-start relative z-10">
                      <span className="text-[9px] bg-pink-50 text-pink-500 px-2.5 py-0.5 rounded-full font-medium uppercase tracking-widest">
                        {product.category || 'Umum'}
                      </span>
                      <span
                        className="font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-pink-600 transition-colors"
                        style={{ fontSize: `${itemFontSize}px` }}
                      >
                        {product.name}
                      </span>
                    </div>
                    <div className="mt-auto relative z-10">
                      <span className="text-pink-500 font-bold block text-lg">{formatIDR(product.harga_jual)}</span>
                    </div>
                    {/* Add-to-cart feedback overlay */}
                    {tappedProductId === product.id && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-pink-500/10 rounded-3xl animate-cart-ping">
                        <span className="text-pink-500 font-bold text-lg animate-cart-float">+1 🛒</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDE: CART */}
        <section className={`
          fixed inset-0 z-[60] bg-white flex flex-col transition-all duration-300 md:sticky md:top-0 md:h-screen md:z-auto md:w-2/5 md:bg-white md:shadow-none md:translate-y-0
          ${showFullCart ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        `}>

          <div className="flex justify-between items-center p-6 md:px-8 md:pt-8 border-b md:border-none border-gray-100">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800 tracking-tight">
              🛒 Keranjang
              <span className="bg-pink-100 text-pink-600 text-xs px-3 py-1 rounded-full font-bold animate-bounce">
                {cart.reduce((a, b) => a + b.quantity, 0)} Item
              </span>
            </h2>
            <div className="flex gap-4 items-center">
              {cart.length > 0 && (
                <button
                  disabled={processing}
                  onClick={() => setCart([])}
                  className="text-gray-400 text-xs font-semibold hover:text-pink-500 transition-colors disabled:opacity-50"
                >
                  Kosongkan
                </button>
              )}
              <button
                onClick={() => setShowFullCart(false)}
                className="md:hidden w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex flex-col h-full p-6 md:p-8 overflow-hidden">
            {/* CART LIST */}
            <div className="flex-1 overflow-y-auto space-y-5 mb-8 pr-2 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 text-gray-300 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                  <span className="text-5xl mb-4 opacity-20">🛍️</span>
                  <p className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center group animate-slide-in">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{item.name}</h4>
                      <p className="text-xs text-pink-500 font-semibold">
                        {formatIDR(item.harga_jual)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        disabled={processing}
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-gray-400 hover:text-pink-500 hover:border-pink-100 transition-all active:scale-90"
                      >
                        -
                      </button>
                      <span className="font-semibold w-4 text-center text-gray-800 text-sm">{item.quantity}</span>
                      <button
                        disabled={processing}
                        onClick={() => addToCart(item)}
                        className="w-8 h-8 flex items-center justify-center bg-pink-500 rounded-lg text-white shadow-md shadow-pink-100 hover:bg-pink-600 transition-all active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* SUMMARY */}
            <div className="mt-auto border-t border-gray-100 pt-6 space-y-6">
              {/* VOUCHER */}
              <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-5 shadow-inner">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <span className="text-amber-700 text-sm">🏷️</span>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">VOUCHER DISKON</span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {VOUCHER_OPTIONS.map(v => (
                    <button
                      key={v}
                      disabled={processing || cart.length === 0}
                      onClick={() => setVoucher(prev => prev === v ? 0 : v)}
                      className={`flex-1 min-w-[70px] py-3 rounded-xl text-xs font-bold transition-all border
                        ${voucher === v
                          ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm scale-105'
                          : 'bg-white/60 text-amber-400 border-amber-100 hover:border-amber-200 hover:text-amber-500'}`}
                    >
                      -{v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 px-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-normal">Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatIDR(totalHarga)}</span>
                </div>
                {voucher > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-amber-600 font-normal">Diskon</span>
                    <span className="font-semibold text-amber-600">-{formatIDR(voucher)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-lg font-bold text-gray-800">Total Tagihan</span>
                  <span className="text-4xl font-bold text-pink-500 tracking-tighter">
                    {formatIDR(totalTagihan)}
                  </span>
                </div>

                <button
                  disabled={cart.length === 0 || processing || isClosed}
                  onClick={() => {
                    setAmountReceived('')
                    setSelectedQuickCash(null)
                    setShowCheckoutModal(true)
                  }}
                  className={`w-full py-5 rounded-[2rem] font-bold text-lg transition-all shadow-xl active:scale-[0.98]
                    ${cart.length === 0 || processing || isClosed
                      ? 'bg-gray-100 text-gray-300 shadow-none'
                      : 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-100'
                    }`}
                >
                  {isClosed ? '🔒 Hari Sudah Ditutup' : processing ? 'Memproses...' : 'Metode Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MOBILE FLOATING CART TRIGGER */}
      {cart.length > 0 && !showFullCart && (
        <div className="md:hidden fixed bottom-5 left-4 right-4 z-50 animate-slide-in">
          <button
            onClick={() => setShowFullCart(true)}
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-black/20 flex justify-between items-center active:scale-[0.97] transition-all duration-150 border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="bg-pink-500 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg shadow-pink-500/30">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <div className="text-left">
                <p className="text-[9px] text-gray-400 uppercase font-medium tracking-widest">Total</p>
                <p className="font-bold text-base leading-tight tracking-tight">{formatIDR(totalTagihan)}</p>
              </div>
            </div>
            <span className="text-white font-bold text-sm tracking-wide">
              Bayar →
            </span>
          </button>
        </div>
      )}
    </>
  )
}