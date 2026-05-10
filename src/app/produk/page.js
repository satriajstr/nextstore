'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
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
      <button onClose={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
    </div>
  )
}

// ─── Confirm Dialog Component ─────────────────────────────────────────────────
function ConfirmDialog({ confirm, onYes, onNo }) {
  if (!confirm) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col gap-5 animate-fade-in">
        <div className="text-3xl">{confirm.icon ?? '❓'}</div>
        <div>
          <p className="font-bold text-gray-800 text-lg">{confirm.title ?? 'Konfirmasi'}</p>
          <p className="text-gray-500 text-sm mt-1 whitespace-pre-line font-medium">{confirm.message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onNo} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all">
            {confirm.labelNo ?? 'Batal'}
          </button>
          <button onClick={onYes} className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all active:scale-95 shadow-md
            ${confirm.danger ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-100'}`}>
            {confirm.labelYes ?? 'Ya'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Product Form Modal ───────────────────────────────────────────────────────
function ProductModal({ mode, product, categories, onSave, onClose, saving }) {
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
              {mode === 'add' ? '➕ Tambah Produk' : '✏️ Edit Produk'}
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm transition-all shadow-sm font-medium appearance-none bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="ADD_NEW" className="text-pink-500 font-bold">+ Tambah Kategori Baru...</option>
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
                    className="flex-1 px-4 py-3 rounded-xl border border-pink-200 bg-pink-50/30 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm transition-all shadow-sm font-medium"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm transition-all shadow-sm font-medium"
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
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm transition-all font-medium"
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
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm transition-all font-medium"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm transition-all font-medium"
            />
          </div>

          {/* Margin Preview */}
          {form.harga_modal > 0 && form.harga_jual > 0 && (
            <div className={`rounded-xl px-4 py-3 text-xs font-semibold flex justify-between
              ${form.harga_jual >= form.harga_modal ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              <span>Margin</span>
              <span>
                +Rp {(parseInt(form.harga_jual) - parseInt(form.harga_modal)).toLocaleString('id-ID')}
                {' '}({form.harga_modal > 0 ? (((form.harga_jual - form.harga_modal) / form.harga_modal) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          )}

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
              className="flex-1 py-3.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 transition-all active:scale-95 shadow-lg shadow-pink-100 disabled:opacity-50 text-sm"
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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortByStock, setSortByStock] = useState('none')
  const [filterCategory, setFilterCategory] = useState('Semua')
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
  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })
    if (error) {
      showToast('Gagal memuat data produk.', 'error')
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  // ─── CREATE ─────────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    setSaving(true)
    const { error } = await supabase.from('products').insert([formData])
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

    const { error } = await supabase.from('products').delete().eq('id', product.id)
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

  // ─── EXPORT CSV ─────────────────────────────────────────────────────────────
  const exportProductsCSV = () => {
    if (filtered.length === 0) return

    try {
      const headers = ['Nama Produk', 'Kategori', 'Harga Modal', 'Harga Jual', 'Margin (Rp)', 'Margin (%)', 'Stok']
      const rows = filtered.map(p => {
        const marginRp = p.harga_jual - p.harga_modal
        const marginPct = p.harga_modal > 0 ? ((marginRp / p.harga_modal) * 100).toFixed(2) : 0
        return [
          `"${p.name}"`,
          `"${p.category || 'Umum'}"`,
          p.harga_modal,
          p.harga_jual,
          marginRp,
          `${marginPct}%`,
          p.stock || 0
        ]
      })

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const dateStr = new Date().toISOString().split('T')[0]
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

      <main className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
        <div className="max-w-5xl mx-auto">

          {/* HEADER (STICKY WITH GLASSMORPHISM) */}
          <header className="sticky top-0 z-40 bg-gray-50/70 backdrop-blur-md -mx-4 md:-mx-8 px-4 md:px-8 py-6 mb-4 flex flex-col md:flex-row justify-between gap-4 border-b border-gray-200/50">
            <div>
              <Link href="/" className="text-pink-500 hover:underline text-[10px] mb-2 inline-block font-bold uppercase tracking-widest">
                ← Kembali ke Kasir
              </Link>
              <h1 className="text-3xl font-bold text-pink-500 tracking-tighter">Manajemen Produk</h1>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-1">{filtered.length} produk ditampilkan</p>
            </div>
            <div className="flex gap-2 items-start flex-wrap md:flex-nowrap">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-xs text-gray-700 bg-white transition-all shadow-sm font-bold cursor-pointer outline-none max-w-[140px] truncate"
              >
                <option value="Semua">Semua Kategori</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={sortByStock}
                onChange={(e) => setSortByStock(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-xs text-gray-700 bg-white transition-all shadow-sm font-bold cursor-pointer outline-none"
              >
                <option value="none">Stok: Default</option>
                <option value="asc">Stok: Terkecil</option>
                <option value="desc">Stok: Terbesar</option>
              </select>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama atau kategori..."
                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-sm text-gray-700 bg-white w-40 md:w-56 transition-all shadow-sm font-medium"
              />
              <button
                onClick={() => setModal({ mode: 'add' })}
                className="px-4 py-2.5 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all active:scale-95 shadow-lg shadow-pink-100 text-sm whitespace-nowrap"
              >
                ＋ Tambah
              </button>
            </div>
          </header>

          {/* SUMMARY STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pt-4">
            {[
              { label: 'Total Produk', value: filtered.length, icon: '📦' },
              { label: 'Stok Kritis (≤3)', value: filtered.filter(p => (p.stock ?? 0) <= 3).length, icon: '⚠️' },
              { label: 'Avg. Margin', value: filtered.length ? `${(filtered.reduce((a, p) => a + (p.harga_jual - p.harga_modal) / (p.harga_modal || 1) * 100, 0) / filtered.length).toFixed(1)}%` : '0%', icon: '📈' },
              { label: 'Total Nilai Stok', value: formatIDR(filtered.reduce((a, p) => a + (p.harga_modal * (p.stock ?? 0)), 0)), icon: '💰' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <p className="text-2xl mb-2">{stat.icon}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-gray-800 tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* PRODUCT TABLE */}
          <section className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Daftar Produk</h3>
              {products.length > 0 && (
                <button
                  onClick={exportProductsCSV}
                  className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-all shadow-md shadow-green-100 flex items-center gap-2"
                >
                  ⬇ Export CSV
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 text-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                  Memuat produk...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-16 text-center text-gray-300">
                  <span className="text-4xl block mb-3 opacity-30">📭</span>
                  <p className="font-medium">Belum ada produk yang cocok, nih.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                      <th className="px-6 py-5">Produk & Kategori</th>
                      <th className="px-6 py-5 text-right">Harga Modal</th>
                      <th className="px-6 py-5 text-right">Harga Jual</th>
                      <th className="px-6 py-5 text-right">Margin</th>
                      <th className="px-6 py-5 text-center">Stok</th>
                      <th className="px-6 py-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((product) => {
                      const margin = product.harga_modal > 0
                        ? ((product.harga_jual - product.harga_modal) / product.harga_modal * 100).toFixed(1)
                        : 0
                      const isLowStock = (product.stock ?? 0) <= 3
                      return (
                        <tr key={product.id} className="hover:bg-gray-50/70 transition-colors group">
                          <td className="px-6 py-5">
                            <p className="font-semibold text-gray-700 leading-tight mb-1.5">{product.name}</p>
                            <span className="text-[9px] bg-pink-50 text-pink-500 px-2.5 py-0.5 rounded-full font-medium uppercase tracking-widest">
                              {product.category || 'Umum'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right text-gray-400 text-sm font-medium">
                            {formatIDR(product.harga_modal)}
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-pink-500 text-sm">
                            {formatIDR(product.harga_jual)}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tighter
                              ${margin >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {margin >= 0 ? '+' : ''}{margin}%
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`text-sm font-semibold px-3 py-1 rounded-lg
                              ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                              {isLowStock && '⚠️ '}{product.stock ?? 0}
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
          </section>
        </div>
      </main>
    </>
  )
}
