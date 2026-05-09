'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

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

  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [showFullCart, setShowFullCart] = useState(false)

  // Swipe & Animation Management
  const touchStart = useRef(0)
  const touchEnd = useRef(0)
  const categoryScrollRef = useRef(null)
  const [swipeDirection, setSwipeDirection] = useState('') // 'left' or 'right'

  // Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [amountReceived, setAmountReceived] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Tunai')

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // 1. Fetch Products
  const getData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (data) {
      setProducts(data)
    } else if (error) {
      console.error("Error fetching products:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    getData()
  }, [])

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
  const VOUCHER_OPTIONS = [1000, 2000, 3000, 4000, 5000]

  const kembalian = Math.max(0, (parseInt(amountReceived) || 0) - totalTagihan)

  // 5. Finalize Checkout
  const handleFinalizeCheckout = async () => {
    if (cart.length === 0) return
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
          payment_method: paymentMethod
        }])
        .select()
        .single()

      if (trxError) throw trxError

      // Step 2: Prepare & Insert Transaction Items
      const items = cart.map(item => ({
        transaction_id: trx.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.harga_jual * item.quantity
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

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory
    return matchSearch && matchCategory
  })

  // Extract Categories
  const categoriesList = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

  // Swipe Logic Implementation
  const handleTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    const minSwipeDistance = 70
    const distance = touchStart.current - touchEnd.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = categoriesList.indexOf(selectedCategory)
      let nextIndex = currentIndex

      if (isLeftSwipe && currentIndex < categoriesList.length - 1) {
        nextIndex = currentIndex + 1
        setSwipeDirection('right') // Content moves from right
      } else if (isRightSwipe && currentIndex > 0) {
        nextIndex = currentIndex - 1
        setSwipeDirection('left') // Content moves from left
      }

      if (nextIndex !== currentIndex) {
        setSelectedCategory(categoriesList[nextIndex])

        // Reset direction after animation
        setTimeout(() => setSwipeDirection(''), 400)

        // Auto-scroll the category tab into view
        const tabElement = document.getElementById(`cat-tab-${nextIndex}`)
        if (tabElement) {
          tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      }
    }
  }

  return (
    <>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* CHECKOUT MODAL (SMART CALCULATOR) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-fade-in flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">💳 Selesaikan Pembayaran</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-300 hover:text-gray-500 text-2xl">×</button>
            </div>

            {/* Total Display */}
            <div className="bg-pink-50 rounded-3xl p-6 text-center">
              <p className="text-[10px] text-pink-400 font-bold uppercase tracking-[0.2em] mb-1">Total Harus Dibayar</p>
              <h4 className="text-4xl font-bold text-pink-500 tracking-tighter">{formatIDR(totalTagihan)}</h4>
            </div>

            {/* Payment Method */}
            <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
              {['Tunai', 'QRIS', 'Transfer'].map(m => (
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Uang Diterima (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      autoFocus
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="Ketik jumlah uang..."
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xl font-bold text-gray-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/30 transition-all"
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setAmountReceived(totalTagihan.toString())} className="py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-pink-200 transition-all">UANG PAS</button>
                  <button onClick={() => setAmountReceived('10000')} className="py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-pink-200 transition-all">10.000</button>
                  <button onClick={() => setAmountReceived('20000')} className="py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-pink-200 transition-all">20.000</button>
                  <button onClick={() => setAmountReceived('50000')} className="py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-pink-200 transition-all">50.000</button>
                  <button onClick={() => setAmountReceived('100000')} className="py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:border-pink-200 transition-all">100.000</button>
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >

          <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-md p-4 md:p-8 border-b border-gray-100/50">
            <header className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-pink-500 tracking-tight">Derashop</h1>
                  <p className="text-gray-400 text-sm mt-1">Online SmartCashier</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/produk" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all shadow-sm border border-gray-200/50">
                    📦 <span className="hidden sm:inline font-bold">Produk</span>
                  </Link>
                  <Link href="/laporan" className="flex items-center gap-2 px-4 py-2.5 bg-pink-50 text-pink-500 rounded-xl font-semibold text-sm hover:bg-pink-100 transition-all shadow-sm border border-pink-100/50">
                    📊 <span className="hidden sm:inline font-bold">Laporan</span>
                  </Link>
                </div>
              </div>

              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 group-focus-within:text-pink-500 transition-colors">🔍</span>
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-200/20 backdrop-blur-sm border border-gray-200/50 rounded-2xl text-sm focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100/30 transition-all shadow-sm font-normal"
                />
              </div>

              {/* CATEGORY TABS */}
              {categoriesList.length > 1 && (
                <div
                  ref={categoryScrollRef}
                  className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1"
                >
                  {categoriesList.map((cat, idx) => (
                    <button
                      key={cat}
                      id={`cat-tab-${idx}`}
                      onClick={() => {
                        const currentIndex = categoriesList.indexOf(selectedCategory)
                        setSwipeDirection(idx > currentIndex ? 'right' : 'left')
                        setSelectedCategory(cat)
                        setTimeout(() => setSwipeDirection(''), 400)
                      }}
                      className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all
                        ${selectedCategory === cat
                          ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-100 scale-105'
                          : 'bg-white/40 backdrop-blur-sm text-gray-400 border-gray-200 hover:border-pink-200 active:scale-95'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </header>
          </div>

          <div className={`px-4 md:px-8 pb-24 md:pb-8 pt-4 transition-all duration-300 ${swipeDirection === 'right' ? 'animate-slide-right' : swipeDirection === 'left' ? 'animate-slide-left' : ''}`}>
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
              <div key={selectedCategory} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    disabled={processing}
                    onClick={() => addToCart(product)}
                    className="flex flex-col p-5 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-50/50 transition-all active:scale-90 text-left h-44 disabled:opacity-50 group overflow-hidden relative"
                  >
                    <div className="flex flex-col gap-1.5 items-start relative z-10">
                      <span className="text-[9px] bg-pink-50 text-pink-500 px-2.5 py-0.5 rounded-full font-medium uppercase tracking-widest">
                        {product.category || 'Umum'}
                      </span>
                      <span className="font-semibold text-gray-800 text-base line-clamp-2 leading-snug group-hover:text-pink-600 transition-colors">
                        {product.name}
                      </span>
                    </div>
                    <div className="mt-auto relative z-10">
                      <span className="text-pink-500 font-bold block text-lg mb-1">{formatIDR(product.harga_jual)}</span>
                      <span className="text-[11px] text-gray-400 font-normal">Stok: {product.stock ?? 0}</span>
                    </div>
                    {/* Visual Feedback Overlay */}
                    <div className="absolute inset-0 bg-pink-500/0 group-active:bg-pink-500/5 transition-colors duration-100"></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDE: CART */}
        <section className={`
          fixed inset-0 z-[60] bg-white flex flex-col transition-all duration-300 md:static md:z-auto md:w-2/5 md:bg-white md:shadow-none md:translate-y-0
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
                      -{(v / 1000).toFixed(0)}rb
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
                  disabled={cart.length === 0 || processing}
                  onClick={() => setShowCheckoutModal(true)}
                  className={`w-full py-5 rounded-[2rem] font-bold text-lg transition-all shadow-xl active:scale-[0.98]
                    ${cart.length === 0 || processing
                      ? 'bg-gray-100 text-gray-300 shadow-none'
                      : 'bg-pink-500 text-white hover:bg-pink-600 shadow-pink-100'
                    }`}
                >
                  {processing ? 'Memproses...' : 'Metode Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MOBILE TRIGGER (ONLY IF CART) */}
      {cart.length > 0 && !showFullCart && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 animate-fade-in">
          <button
            onClick={() => setShowFullCart(true)}
            className="w-full bg-gray-900 text-white p-5 rounded-[2.5rem] shadow-2xl flex justify-between items-center ring-8 ring-white/80 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="bg-pink-500 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase font-normal tracking-widest mb-0.5">Total Bayar</p>
                <p className="font-bold text-lg leading-none">{formatIDR(totalTagihan)}</p>
              </div>
            </div>
            <span className="bg-white/10 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest">Lanjut Pembayaran →</span>
          </button>
        </div>
      )}
    </>
  )
}