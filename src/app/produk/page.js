'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { getUserProfile, getRole } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '../../components/AdminSidebar'
import { useTheme } from '../../lib/ThemeContext'
import { getTodayId } from '../../lib/dateId'

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed top-6 right-6 z-50 max-w-sm w-full shadow-2xl rounded-2xl p-5 flex items-start gap-4 animate-fade-in
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

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductModal({ mode, product, categories, onSave, onClose, saving }) {
  const { primaryColor } = useTheme()
  const [isManualCategory, setIsManualCategory] = useState(false)
  const [form, setForm] = useState({
    name: product?.name ?? '',
    harga_modal: product?.harga_modal ?? '',
    harga_jual: product?.harga_jual ?? '',
    stock: product?.stock ?? '',
    category: product?.category ?? (categories.length > 0 ? categories[0] : 'Umum'),
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'category_select') {
      if (value === 'ADD_NEW') {
        setIsManualCategory(true)
        setForm(prev => ({ ...prev, category: '' }))
      } else {
        setIsManualCategory(false)
        setForm(prev => ({ ...prev, category: value }))
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      name: form.name.trim(),
      harga_modal: parseInt(form.harga_modal) || 0,
      harga_jual: parseInt(form.harga_jual) || 0,
      stock: parseInt(form.stock) || 0,
      category: form.category.trim() || 'Umum',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col gap-6 animate-fade-in my-auto">
        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'add' ? 'Tambah Produk' : 'Edit Produk'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              {mode === 'add' ? 'Masukkan data produk baru' : `Mengedit: ${product?.name}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Kategori (Smart Dropdown) */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Kategori Produk</label>
            <div className="relative">
              {!isManualCategory && categories.length > 0 ? (
                <div className="relative">
                  <select
                    name="category_select"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-gray-700 text-sm transition-all shadow-sm font-bold appearance-none bg-white cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="ADD_NEW" className="font-bold" style={{ color: primaryColor }}>+ Tambah Kategori Baru...</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    name="category"
                    autoFocus
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Ketik kategori baru..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-gray-700 text-sm transition-all shadow-sm font-medium"
                  />
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsManualCategory(false)}
                      className="px-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition-all text-xs font-bold"
                      title="Kembali ke daftar"
                    >
                      Batal
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nama Produk */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Nama Produk *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Contoh: Strap 10, Gelang 10 ..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-gray-700 text-sm transition-all shadow-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Harga Modal */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Harga Modal</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
                <input
                  name="harga_modal"
                  type="number"
                  min="0"
                  value={form.harga_modal}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-gray-700 text-sm transition-all font-medium"
                />
              </div>
            </div>

            {/* Harga Jual */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Harga Jual</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rp</span>
                <input
                  name="harga_jual"
                  type="number"
                  min="0"
                  value={form.harga_jual}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-gray-700 text-sm transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Stok */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Stok Awal</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-gray-700 text-sm transition-all font-medium"
            />
          </div>



          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl text-white font-bold transition-all active:scale-95 disabled:opacity-50 text-sm shadow-md"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}20` }}
            >
              {saving ? 'Menyimpan...' : mode === 'add' ? 'Tambah Produk' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Produk() {
  const { primaryColor } = useTheme()
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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortByStock, setSortByStock] = useState('none')
  const [filterCategory, setFilterCategory] = useState('Semua')
  const [criticalThreshold, setCriticalThreshold] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('critical_stock_threshold')
      return saved ? parseInt(saved) || 3 : 3
    }
    return 3
  })
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Sync threshold to localStorage
  useEffect(() => {
    localStorage.setItem('critical_stock_threshold', criticalThreshold)
  }, [criticalThreshold])

  // Reset pagination to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterCategory, sortByStock, filterCriticalOnly])

  const [modal, setModal] = useState(null) // { mode: 'add'|'edit', product?: {} }
  const [saving, setSaving] = useState(false)
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

  const handleConfirmYes = () => { confirmState?.resolve(true); setConfirmState(null) }
  const handleConfirmNo = () => { confirmState?.resolve(false); setConfirmState(null) }

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!profile?.store_id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', profile.store_id)
      .order('name', { ascending: true })
    if (error) {
      showToast('Gagal memuat data produk.', 'error')
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }, [profile?.store_id])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ─── CREATE ─────────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    setSaving(true)
    const { error } = await supabase.from('products').insert([{
      ...formData,
      store_id: profile.store_id
    }])
    if (error) {
      showToast('Gagal menambah produk.', 'error')
    } else {
      showToast(`Produk "${formData.name}" berhasil ditambahkan.`)
      setModal(null)
      fetchProducts()
    }
    setSaving(false)
  }

  // ─── UPDATE ─────────────────────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    setSaving(true)
    const { error } = await supabase
      .from('products')
      .update(formData)
      .eq('store_id', profile.store_id)
      .eq('id', modal.product.id)
    if (error) {
      showToast('Gagal menyimpan perubahan.', 'error')
    } else {
      showToast(`Produk "${formData.name}" berhasil diperbarui.`)
      setModal(null)
      fetchProducts()
    }
    setSaving(false)
  }

  // ─── DELETE ─────────────────────────────────────────────────────────────────
  const handleDelete = async (product) => {
    const confirmed = await showConfirm({
      icon: '🗑️',
      title: 'Hapus Produk?',
      message: `"${product.name}" akan dihapus secara permanen.\nData ini tidak bisa dikembalikan.`,
      labelYes: 'Hapus',
      labelNo: 'Batal',
      danger: true,
    })
    if (!confirmed) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('store_id', profile.store_id)
      .eq('id', product.id)
    if (error) {
      showToast('Gagal menghapus produk.', 'error')
    } else {
      showToast(`Produk "${product.name}" berhasil dihapus.`)
      fetchProducts()
    }
  }

  // ─── Helpers & Filter ────────────────────────────────────────────────────────
  const formatIDR = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount ?? 0)

  const filtered = products
    .filter(p => filterCategory === 'Semua' || p.category === filterCategory)
    .filter(p => {
      const searchTerms = search.toLowerCase().split(/\s+/).filter(Boolean)
      if (searchTerms.length === 0) return true

      const searchString = `${p.name} ${p.category || ''}`.toLowerCase()
      return searchTerms.every(term => searchString.includes(term))
    })
    .sort((a, b) => {
      const term = search.toLowerCase().trim()
      let scoreDiff = 0

      if (term) {
        const getScore = (p) => {
          let score = 0
          const name = p.name.toLowerCase()
          const cat = (p.category || '').toLowerCase()

          if (name === term) score += 100
          else if (name.startsWith(term)) score += 50
          else if (name.includes(` ${term} `) || name.endsWith(` ${term}`)) score += 30
          else if (name.includes(term)) score += 10

          if (cat === term) score += 20
          else if (cat.includes(term)) score += 5

          return score
        }
        scoreDiff = getScore(b) - getScore(a)
      }

      if (scoreDiff !== 0) return scoreDiff // Urutkan berdasarkan relevansi pencarian dulu

      if (sortByStock === 'asc') return (a.stock || 0) - (b.stock || 0)
      if (sortByStock === 'desc') return (b.stock || 0) - (a.stock || 0)

      return a.name.localeCompare(b.name) // Default abjad
    })

  const displayedProducts = filtered.filter(p => !filterCriticalOnly || (p.stock ?? 0) <= criticalThreshold)

  // Pagination Logic
  const totalPages = Math.ceil(displayedProducts.length / itemsPerPage)
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const startIndex = (activePage - 1) * itemsPerPage
  const paginatedProducts = displayedProducts.slice(startIndex, startIndex + itemsPerPage)

  // Keep state in sync if page goes out of bounds (e.g. after deletion)
  useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [displayedProducts.length, totalPages, currentPage])

  // Helper for rendering pagination page numbers with smart ellipsis (...)
  const getPageNumbers = () => {
    const delta = 1 // Number of pages to show before and after current page
    const range = []
    const rangeWithDots = []
    let l

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= activePage - delta && i <= activePage + delta)) {
        range.push(i)
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (i - l > 2) {
          rangeWithDots.push('...')
        }
      }
      rangeWithDots.push(i)
      l = i
    }

    return rangeWithDots
  }

  // ─── EXPORT CSV ─────────────────────────────────────────────────────────────
  const exportProductsCSV = () => {
    if (displayedProducts.length === 0) return

    try {
      const headers = ['Nama Produk', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok']
      const rows = displayedProducts.map(p => {
        return [
          `"${p.name}"`,
          `"${p.category || 'Umum'}"`,
          p.harga_modal,
          p.harga_jual,
          p.stock || 0
        ]
      })

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dateStr = getTodayId()
      link.href = url
      link.download = `daftar-produk-${dateStr}.csv`
      link.click()
      URL.revokeObjectURL(url)
      showToast(`Export berhasil: daftar-produk-${dateStr}.csv`, 'success')
    } catch (err) {
      console.error('EXPORT ERROR:', err)
      showToast('Gagal mengekspor data produk.', 'error')
    }
  }

  const handleSave = modal?.mode === 'add' ? handleAdd : handleEdit

  // Ambil daftar kategori unik untuk saran
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)))

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {checkingAuth && (
        <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      )}
      <ConfirmDialog confirm={confirmState} onYes={handleConfirmYes} onNo={handleConfirmNo} />
      {modal && (
        <ProductModal
          mode={modal.mode}
          product={modal.product}
          categories={uniqueCategories}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      <main className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
        <AdminSidebar />
        <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
          <div className="max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER (STICKY WITH GLASSMORPHISM) */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md -mx-4 md:-mx-8 px-4 md:px-8 py-6 mb-4 flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight" style={{ color: primaryColor }}>Kelola Produk</h1>
                <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest mt-1 inline-block border"
                  style={{ color: primaryColor, borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}08` }}>
                  {displayedProducts.length} Produk
                </span>
              </div>
              <div className="flex gap-2 items-start flex-wrap md:flex-nowrap">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-xs text-gray-700 bg-white transition-all shadow-sm font-bold cursor-pointer outline-none max-w-[140px] truncate"
                >
                  <option value="Semua">Semua Kategori</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={sortByStock}
                  onChange={(e) => setSortByStock(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-xs text-gray-700 bg-white transition-all shadow-sm font-bold cursor-pointer outline-none"
                >
                  <option value="none">Stok: Default</option>
                  <option value="asc">Stok: Terkecil</option>
                  <option value="desc">Stok: Terbesar</option>
                </select>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama atau kategori..."
                  className="px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 text-sm text-gray-700 bg-white w-40 md:w-56 transition-all shadow-sm font-medium"
                />
                <button
                  onClick={() => setModal({ mode: 'add' })}
                  className="px-4 py-2.5 text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 text-sm whitespace-nowrap flex items-center gap-1.5 shadow-md"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}20` }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Tambah</span>
                </button>
              </div>
            </header>

            {/* SUMMARY STATS */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 pt-4">
              {[
                { label: 'Total Produk', value: filtered.length, type: 'total' },
                { label: `Stok Kritis (≤${criticalThreshold})`, value: filtered.filter(p => (p.stock ?? 0) <= criticalThreshold).length, type: 'critical' },
                { label: 'Total Nilai Stok', value: formatIDR(filtered.reduce((a, p) => a + (p.harga_modal * (p.stock ?? 0)), 0)), type: 'value' },
              ].map((stat) => {
                const getStatIcon = (type) => {
                  if (type === 'total') {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    )
                  }
                  if (type === 'critical') {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    )
                  }
                  if (type === 'value') {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M3 13.75h18" />
                      </svg>
                    )
                  }
                  return null
                }
                return (
                  <div
                    key={stat.label}
                    onClick={() => {
                      if (stat.type === 'critical') {
                        setFilterCriticalOnly(!filterCriticalOnly)
                      }
                    }}
                    className={`bg-white rounded-[2rem] p-6 border-2 shadow-sm transition-all hover:shadow-md cursor-pointer
                      ${stat.type === 'critical' && filterCriticalOnly ? 'border-amber-500 bg-amber-50/20' : 'hover:border-slate-300'}`}
                    style={stat.type !== 'critical' || !filterCriticalOnly ? { borderColor: `${primaryColor}20`, boxShadow: `0 4px 20px -2px rgba(148, 163, 184, 0.08)` } : { boxShadow: `0 4px 20px -2px rgba(245, 158, 11, 0.08)` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="mb-2">{getStatIcon(stat.type)}</div>
                      {stat.type === 'critical' && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border transition-all ${filterCriticalOnly ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                          {filterCriticalOnly ? 'Filter Aktif' : 'Klik untuk Filter'}
                        </span>
                      )}
                    </div>
                    {stat.type === 'critical' ? (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Stok Kritis(&lt;=)</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setCriticalThreshold(prev => Math.max(0, prev - 1))}
                              className="w-5 h-5 flex items-center justify-center rounded-lg bg-white hover:bg-slate-100 text-slate-500 border border-slate-200/40 hover:text-slate-700 font-bold transition-all active:scale-90 text-[10px]"
                              title="Kurangi ambang batas"
                            >
                              −
                            </button>
                            <span className="text-xs font-extrabold text-slate-700 w-4 text-center select-none" title="Ambang batas stok saat ini">
                              {criticalThreshold}
                            </span>
                            <button
                              onClick={() => setCriticalThreshold(prev => Math.min(100, prev + 1))}
                              className="w-5 h-5 flex items-center justify-center rounded-lg bg-white hover:bg-slate-100 text-slate-500 border border-slate-200/40 hover:text-slate-700 font-bold transition-all active:scale-90 text-[10px]"
                              title="Tambah ambang batas"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* PRODUCT TABLE */}
            <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Daftar Produk</h3>
                {products.length > 0 && (
                  <button
                    onClick={exportProductsCSV}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Export Data</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-16 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
                    Memuat produk...
                  </div>
                ) : displayedProducts.length === 0 ? (
                  <div className="p-16 text-center text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <p className="font-medium text-gray-400">Belum ada produk yang cocok, nih.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">
                        <th className="px-6 py-5 text-center w-12">No</th>
                        <th className="px-6 py-5">Produk & Kategori</th>
                        <th className="px-6 py-5 text-right">Harga Modal</th>
                        <th className="px-6 py-5 text-right">Harga Jual</th>
                        <th className="px-6 py-5 text-center">Stok</th>
                        <th className="px-6 py-5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {paginatedProducts.map((product, index) => {

                        const isLowStock = (product.stock ?? 0) <= criticalThreshold
                        return (
                          <tr key={product.id} className="hover:bg-slate-50/40 transition-colors group">
                            <td className="px-6 py-5 text-center text-xs font-semibold text-slate-400 w-12">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-semibold text-slate-700 leading-tight mb-1.5 text-xs">{product.name}</p>
                              <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest"
                                style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                                {product.category || 'Umum'}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right text-slate-400 text-xs font-semibold">
                              {formatIDR(product.harga_modal)}
                            </td>
                            <td className="px-6 py-5 text-right font-black text-xs" style={{ color: primaryColor }}>
                              {formatIDR(product.harga_jual)}
                            </td>

                            <td className="px-6 py-5 text-center">
                              <span className={`text-sm font-semibold px-3 py-1 rounded-lg flex items-center justify-center gap-1 w-fit mx-auto
                              ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                {isLowStock && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                  </svg>
                                )}
                                {product.stock ?? 0}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex gap-2 justify-center transition-all">
                                <button
                                  onClick={() => setModal({ mode: 'edit', product })}
                                  className="px-3.5 py-2 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-xl hover:bg-blue-100 transition-all uppercase tracking-widest border border-blue-100/50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(product)}
                                  className="px-3.5 py-2 bg-rose-50 text-rose-500 text-[10px] font-bold rounded-xl hover:bg-rose-100 transition-all uppercase tracking-widest border border-rose-100/50"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* PAGINATION CONTROLS */}
              {displayedProducts.length > 0 && (
                <div className="px-6 py-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 font-medium">
                    Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> - <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, displayedProducts.length)}</span> dari <span className="font-bold text-slate-700">{displayedProducts.length}</span> produk
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      {/* Prev Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={activePage === 1}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-95 disabled:scale-100 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                        title="Halaman Sebelumnya"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>

                      {/* Page Numbers */}
                      {getPageNumbers().map((num, i) => {
                        if (num === '...') {
                          return (
                            <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-xs font-bold text-slate-400">
                              ...
                            </span>
                          )
                        }
                        const isActive = num === activePage
                        return (
                          <button
                            key={`page-${num}`}
                            onClick={() => setCurrentPage(num)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer
                              ${isActive ? 'text-white shadow-md' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            style={isActive ? { backgroundColor: primaryColor, boxShadow: `0 4px 10px ${primaryColor}20` } : {}}
                          >
                            {num}
                          </button>
                        )
                      })}

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={activePage === totalPages}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-all active:scale-95 disabled:scale-100 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                        title="Halaman Selanjutnya"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
