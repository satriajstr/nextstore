'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { getUserProfile, signOut } from '../lib/auth'
import { useRouter } from 'next/navigation'
import { useTheme } from '../lib/ThemeContext'
import { getStoreHoursStatus } from '../lib/storeHours'
import { getTodayId } from '../lib/dateId'

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  
  if (isSuccess) {
    return (
      <div className="fixed top-6 right-6 z-50 shadow-xl rounded-2xl py-3 px-5 bg-green-50 border border-green-200 text-green-700 font-bold text-sm flex items-center gap-2 animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span>{toast.message}</span>
      </div>
    )
  }

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full shadow-2xl rounded-2xl p-5 flex items-start gap-4 animate-fade-in bg-red-50 border border-red-200">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
      <div className="flex-1">
        <p className="font-semibold text-sm text-red-800">Gagal</p>
        <p className="text-sm mt-0.5 text-red-700">{toast.message}</p>
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
        setRole(userProfile.status === 'disabled' ? 'disabled_kasir' : 'pending_kasir')
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
  const [cartFx, setCartFx] = useState(null) // { id, type: 'add' | 'remove' }
  const [exitingCartIds, setExitingCartIds] = useState([])

  // Customization States
  const [gridCols, setGridCols] = useState(3)
  const [itemFontSize, setItemFontSize] = useState(16)
  const [showSettings, setShowSettings] = useState(false)
  const [enableManualInput, setEnableManualInput] = useState(true)

  const toggleManualInput = (val) => {
    setEnableManualInput(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_enable_manual_input', val ? 'true' : 'false')
    }
  }

  // Logout & Password States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState(null)

  // Category Filter States
  const [showCategoryFilter, setShowCategoryFilter] = useState(true)

  const toggleCategoryFilter = (val) => {
    setShowCategoryFilter(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_show_category_filter', val ? 'true' : 'false')
    }
  }

  // Load settings from localStorage on client-side mount to prevent hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedManual = localStorage.getItem('pos_enable_manual_input')
      if (storedManual !== null) {
        setEnableManualInput(storedManual !== 'false')
      }
      const storedCategory = localStorage.getItem('pos_show_category_filter')
      if (storedCategory !== null) {
        setShowCategoryFilter(storedCategory !== 'false')
      }
    }
  }, [])

  // Swipe & Animation Management
  const touchStart = useRef(0)
  // Checkout Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [amountReceived, setAmountReceived] = useState('')
  const [selectedQuickCash, setSelectedQuickCash] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Tunai')
  const [isClosed, setIsClosed] = useState(false)
  const [outsideHours, setOutsideHours] = useState(false)
  const [operatingHours, setOperatingHours] = useState({ open: '', close: '' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    const duration = type === 'success' ? 1000 : 4000
    setTimeout(() => setToast(null), duration)
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

  // 1.1 Check Store Closed Status & Jam Operasional
  const checkStatus = useCallback(async () => {
    if (!profile?.store_id) return
    const today = getTodayId()
    const [{ data: summary }, { data: store }] = await Promise.all([
      supabase
        .from('daily_summary')
        .select('status')
        .eq('store_id', profile.store_id)
        .eq('date', today)
        .maybeSingle(),
      supabase
        .from('stores')
        .select('open_time, close_time')
        .eq('id', profile.store_id)
        .single(),
    ])
    setIsClosed(summary?.status === 'closed')

    const hoursStatus = getStoreHoursStatus(store?.open_time, store?.close_time)
    setOutsideHours(hoursStatus.hasHours && !hoursStatus.isOpen)
    setOperatingHours({ open: hoursStatus.openTime, close: hoursStatus.closeTime })
  }, [profile?.store_id])

  useEffect(() => {
    getData()
    checkStatus()
    const interval = setInterval(checkStatus, 60_000)
    return () => clearInterval(interval)
  }, [getData, checkStatus])

  const triggerCartFx = (id, type) => {
    setCartFx({ id, type })
    setTimeout(() => setCartFx(null), 600)
  }

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

  const CART_ROW_TRANSITION_MS = 550

  const removeCartItemCompletely = (productId) => {
    triggerCartFx(productId, 'remove')
    setExitingCartIds((prev) => [...prev, productId])
    setTimeout(() => {
      setCart((prev) => prev.filter((item) => item.id !== productId))
      setExitingCartIds((prev) => prev.filter((id) => id !== productId))
    }, CART_ROW_TRANSITION_MS)
  }

  // 3. Remove/Decrease from Cart
  const removeFromCart = (productId) => {
    const existingItem = cart.find((item) => item.id === productId)
    if (!existingItem) return

    triggerCartFx(productId, 'remove')

    if (existingItem.quantity === 1) {
      setExitingCartIds((prev) => [...prev, productId])
      setTimeout(() => {
        setCart((prev) => prev.filter((item) => item.id !== productId))
        setExitingCartIds((prev) => prev.filter((id) => id !== productId))
      }, CART_ROW_TRANSITION_MS)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      )
    )
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
    if (outsideHours) {
      showToast('Di luar jam operasional toko. Transaksi tidak diperbolehkan.', 'error')
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
      setSearchTerm('')
      setSelectedCategory('Semua')
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

  const handleLogout = () => setShowLogoutConfirm(true)
  const confirmLogout = () => { setShowLogoutConfirm(false); signOut() }
  const cancelLogout = () => setShowLogoutConfirm(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password minimal 6 karakter.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' })
      return
    }
    setPwLoading(true)
    setPwMessage(null)
    try {
      // 1. Dapatkan user email
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')

      // 2. Verifikasi password saat ini
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('Password lama salah.')
      }

      // 3. Update ke password baru
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPwMessage({ type: 'success', text: 'Password berhasil diubah!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => { setShowChangePassword(false); setPwMessage(null) }, 2000)
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message })
    } finally {
      setPwLoading(false)
    }
  }



  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {checkingAuth && (
        <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 flex flex-col gap-5 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Keluar dari Kasir?</h3>
            <p className="text-gray-500 text-sm">Anda akan logout dari sesi kasir ini. Pastikan semua transaksi sudah diselesaikan.</p>
            <div className="flex gap-3">
              <button onClick={cancelLogout} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all text-sm">Batal</button>
              <button onClick={confirmLogout} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100 text-sm">Ya, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 flex flex-col gap-5 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Ganti Password</h3>
              <button onClick={() => { setShowChangePassword(false); setPwMessage(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }} className="text-gray-300 hover:text-gray-500 text-2xl">×</button>
            </div>
            {pwMessage && (
              <div className={`p-3 rounded-xl text-sm font-medium ${pwMessage.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                <span className="flex items-center gap-1.5">
                  {pwMessage.type === 'success' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  )}
                  <span>{pwMessage.text}</span>
                </span>
              </div>
            )}
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Password Lama</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Password saat ini" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Password Baru</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Minimal 6 karakter" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Konfirmasi Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Ketik ulang password baru" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm font-medium transition-all" />
              </div>
              <button type="submit" disabled={pwLoading} className="w-full py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 transition-all active:scale-95 shadow-lg shadow-pink-100 disabled:opacity-50 text-sm">
                {pwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      {role === 'pending_kasir' && (
        <div className="fixed inset-0 z-[150] bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-fade-in border border-gray-100">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
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

      {role === 'disabled_kasir' && (
        <div className="fixed inset-0 z-[150] bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-fade-in border border-gray-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">Akun Dinonaktifkan</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Akun kasir Anda telah <strong>dinonaktifkan</strong> oleh Admin toko. Anda tidak dapat mengakses sistem hingga Admin mengaktifkan kembali akun Anda.
            </p>
            <button onClick={signOut} className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all active:scale-95 text-sm uppercase tracking-widest">
              Keluar / Logout
            </button>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="fixed inset-0 z-[150] bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-fade-in border border-gray-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
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

      {!isClosed && outsideHours && (
        <div className="fixed inset-0 z-[150] bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center animate-fade-in border border-gray-100">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3 tracking-tight">Di Luar Jam Operasional</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Toko <strong>{storeName}</strong> hanya membuka akses kasir pada jam operasional yang ditetapkan Admin.
            </p>
            <p className="text-sm font-bold text-amber-700 bg-amber-50 rounded-2xl py-3 px-4 mb-8">
              Jam operasional: {operatingHours.open} – {operatingHours.close} WIB
            </p>
            <button onClick={signOut} className="w-full py-4 bg-amber-50 text-amber-700 rounded-2xl font-bold hover:bg-amber-100 transition-all active:scale-95 text-sm uppercase tracking-widest">
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
              <h3 className="text-xl font-bold text-gray-800">Selesaikan Pembayaran</h3>
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
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Uang Diterima</label>
                    <button
                      onClick={() => toggleManualInput(!enableManualInput)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-pink-500 transition-colors uppercase tracking-widest"
                    >
                      <span>Input Manual</span>
                      <span className={`w-7 h-4 rounded-full transition-colors flex items-center p-0.5 ${enableManualInput ? 'bg-pink-500 justify-end' : 'bg-gray-200 justify-start'}`}>
                        <span className="w-3 h-3 bg-white rounded-full shadow-sm"></span>
                      </span>
                    </button>
                  </div>
                  {enableManualInput ? (
                    <div className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="text-gray-400 text-sm font-bold">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={amountReceived ? parseInt(amountReceived).toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '')
                          setAmountReceived(rawValue)
                          setSelectedQuickCash(null)
                        }}
                        placeholder="0"
                        className="flex-1 bg-transparent text-right outline-none focus:ring-0 w-full tabular-nums border-none p-0 font-bold text-2xl text-gray-800"
                      />
                    </div>
                  ) : (
                    <div className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-2xl font-bold text-gray-800 flex items-center justify-between">
                      <span className="text-gray-400 text-sm font-bold">Rp</span>
                      <span className="tabular-nums">{amountReceived ? parseInt(amountReceived).toLocaleString('id-ID') : '0'}</span>
                    </div>
                  )}
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
              disabled={
                processing || 
                (paymentMethod === 'Tunai' && (parseInt(amountReceived) || 0) < totalTagihan)
              }
              onClick={handleFinalizeCheckout}
              className={`w-full py-5 rounded-[2rem] font-bold text-lg transition-all shadow-xl active:scale-[0.98]
                ${processing || 
                  (paymentMethod === 'Tunai' && (parseInt(amountReceived) || 0) < totalTagihan)
                  ? 'bg-gray-100 text-gray-300 shadow-none pointer-events-none'
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
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div>
                  <p className="font-bold text-sm">Status Toko: HARI DITUTUP</p>
                  <p className="text-xs text-amber-700">Toko telah melakukan penutupan hari. Transaksi baru tidak diperbolehkan hingga hari dibuka kembali oleh Admin.</p>
                </div>
              </div>
            )}
            <header className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 text-white"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}50` }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-black text-gray-800 tracking-tight leading-none text-xl truncate">{storeName}</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-1.5" style={{ color: primaryColor }}>
                      {profile?.full_name ? `Kasir: ${profile.full_name}` : 'Cashier Panel'}
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

                          {/* Category Filter Toggle */}
                          <div className="space-y-2 pt-4 border-t border-gray-100 mt-3">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-bold text-gray-600 block">Tampilkan Kategori</label>
                              <button
                                onClick={() => toggleCategoryFilter(!showCategoryFilter)}
                                className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${showCategoryFilter ? 'bg-pink-500 justify-end' : 'bg-gray-200 justify-start'}`}
                              >
                                <span className="w-5 h-5 bg-white rounded-full shadow-sm"></span>
                              </button>
                            </div>
                            <p className="text-[9px] text-gray-400 font-medium leading-normal">Menampilkan tab filter kategori di bawah bar pencarian</p>
                          </div>
                        </div>


                        {/* Change Password in Settings */}
                        <div className="pt-4 border-t border-gray-100 mt-1 space-y-2">
                          <button
                            onClick={() => { setShowChangePassword(true); setShowSettings(false) }}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            <span>Ganti Password</span>
                          </button>
                          <button
                            onClick={() => { setShowSettings(false); handleLogout() }}
                            className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400 group-focus-within:text-pink-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                </svg>
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

              {showCategoryFilter && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 mt-1">
                  {categoriesList.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-[11px] font-bold transition-all whitespace-nowrap active:scale-95 border shadow-sm
                        ${selectedCategory === cat
                          ? 'bg-pink-500 text-white border-pink-500 shadow-pink-100'
                          : 'bg-white text-gray-500 border-gray-100 active:bg-gray-50'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

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
                        <span className="text-pink-500 font-bold text-lg animate-cart-float">+1</span>
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
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 tracking-tight">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span>Keranjang</span>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-300 mb-4 opacity-25" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  <p className="font-semibold text-sm text-gray-400 uppercase tracking-widest">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className={`relative flex justify-between items-center group gap-2 border-b border-gray-100/50 pb-4 last:border-b-0 last:pb-0 overflow-hidden transition-all duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)]
                      ${exitingCartIds.includes(item.id)
                        ? 'opacity-0 translate-y-8 scale-[0.96] max-h-0 !pb-0 !mb-0 pointer-events-none'
                        : 'opacity-100 translate-y-0 scale-100 max-h-24 animate-slide-in'}`}
                  >
                    {cartFx?.id === item.id && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-pink-500/10 rounded-2xl animate-cart-ping">
                        <span className="text-pink-500 font-bold text-lg animate-cart-float">
                          {cartFx.type === 'remove' ? '-1' : '+1'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        disabled={processing}
                        onClick={() => removeCartItemCompletely(item.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg flex-shrink-0"
                        title="Hapus item dari keranjang"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                      <div className="w-px h-6 bg-gray-100 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-1 truncate">{item.name}</h4>
                        <p className="text-xs text-pink-500 font-semibold">
                          {formatIDR(item.harga_jual)} × {item.quantity}
                        </p>
                      </div>
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
                        onClick={() => {
                          triggerCartFx(item.id, 'add')
                          addToCart(item)
                        }}
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
                <div className="flex items-center gap-1.5 mb-4 px-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.141-5.141a2.25 2.25 0 0 0 0-3.181l-9.58-9.581A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
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
                  {isClosed ? 'Hari Sudah Ditutup' : processing ? 'Memproses...' : 'Metode Pembayaran'}
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
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}
