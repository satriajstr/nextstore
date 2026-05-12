'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getRole } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import { useTheme, THEME_DEFAULTS } from '../../lib/ThemeContext'
import AdminSidebar from '../../components/AdminSidebar'

const COLOR_PRESETS = [
  { name: 'Mawar Pink', value: '#ec4899', emoji: '🌸' },
  { name: 'Ungu', value: '#8b5cf6', emoji: '💜' },
  { name: 'Biru', value: '#3b82f6', emoji: '💙' },
  { name: 'Sky', value: '#0ea5e9', emoji: '🩵' },
  { name: 'Tosca', value: '#14b8a6', emoji: '🌿' },
  { name: 'Hijau', value: '#22c55e', emoji: '💚' },
  { name: 'Oranye', value: '#f97316', emoji: '🟠' },
  { name: 'Merah', value: '#ef4444', emoji: '❤️' },
  { name: 'Rose', value: '#f43f5e', emoji: '🌹' },
  { name: 'Abu', value: '#64748b', emoji: '🩶' },
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export default function Kustomisasi() {
  const router = useRouter()
  const { storeName: currentName, primaryColor: currentColor, saveTheme } = useTheme()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [storeName, setStoreName] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [saved, setSaved] = useState(false)

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const userRole = await getRole()
      if (userRole === 'kasir') { router.replace('/'); return }
      if (userRole !== 'admin') { await supabase.auth.signOut(); router.replace('/login'); return }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  // Sync from context after it loads
  useEffect(() => {
    if (!checkingAuth) {
      setStoreName(currentName)
      setSelectedColor(currentColor)
      setCustomColor(currentColor)
    }
  }, [checkingAuth, currentName, currentColor])

  const activeColor = selectedColor || currentColor

  const handleSave = () => {
    if (!storeName.trim()) return
    saveTheme({ storeName: storeName.trim(), primaryColor: activeColor })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setStoreName(THEME_DEFAULTS.storeName)
    setSelectedColor(THEME_DEFAULTS.primaryColor)
    setCustomColor(THEME_DEFAULTS.primaryColor)
  }

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <AdminSidebar />

      <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden">
        <div className="max-w-2xl mx-auto p-4 md:p-8">

          {/* Header */}
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-pink-500 tracking-tighter" style={{ color: activeColor }}>
              Kustomisasi Toko
            </h1>
            <p className="text-gray-400 text-sm mt-1">Sesuaikan tampilan dan identitas toko Anda</p>
          </header>

          <div className="space-y-6">

            {/* ── Store Name ──────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: activeColor + '20' }}>
                  🏪
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-base">Nama Toko</h2>
                  <p className="text-gray-400 text-xs">Ditampilkan di semua halaman</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Nama Toko
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  maxLength={30}
                  placeholder="Contoh: DeraShop"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-800 font-semibold text-sm"
                  style={{ '--tw-ring-color': activeColor + '40' }}
                  onFocus={e => e.target.style.borderColor = activeColor}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <p className="text-[10px] text-gray-400 text-right">{storeName.length}/30 karakter</p>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-2">Preview</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-md"
                    style={{ backgroundColor: activeColor }}>
                    🛍️
                  </div>
                  <div>
                    <p className="font-black text-gray-800 leading-none text-base">{storeName || 'Nama Toko'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                      style={{ color: activeColor }}>Admin Panel</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Primary Color ────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: activeColor + '20' }}>
                  🎨
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-base">Warna Utama</h2>
                  <p className="text-gray-400 text-xs">Diterapkan pada tombol, highlight, dan aksen</p>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">
                  Pilih Warna
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => { setSelectedColor(preset.value); setCustomColor(preset.value) }}
                      title={preset.name}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all group ${selectedColor === preset.value
                          ? 'border-gray-800 scale-105'
                          : 'border-transparent hover:border-gray-200'
                        }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-lg"
                        style={{ backgroundColor: preset.value }}
                      >
                        {selectedColor === preset.value && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 text-center leading-tight">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom color picker */}
              <div className="mt-6">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">
                  Warna Kustom
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={customColor}
                      onChange={e => { setCustomColor(e.target.value); setSelectedColor(e.target.value) }}
                      className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-gray-200 p-1 bg-white"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customColor}
                      onChange={e => {
                        const v = e.target.value
                        setCustomColor(v)
                        if (/^#[0-9A-Fa-f]{6}$/.test(v)) setSelectedColor(v)
                      }}
                      placeholder="#ec4899"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono focus:outline-none transition-all"
                      onFocus={e => e.target.style.borderColor = activeColor}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Format: #RRGGBB</p>
                  </div>
                  {/* Live preview swatch */}
                  <div className="w-14 h-14 rounded-2xl shadow-lg flex-shrink-0 transition-all"
                    style={{ backgroundColor: activeColor }}>
                  </div>
                </div>
              </div>

              {/* Color preview bar */}
              <div className="mt-6 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview Warna</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md" style={{ backgroundColor: activeColor }}>
                    Tombol Utama
                  </span>
                  <span className="px-4 py-2 rounded-xl text-xs font-bold border" style={{ color: activeColor, borderColor: activeColor + '40', backgroundColor: activeColor + '15' }}>
                    Tombol Outline
                  </span>
                  <span className="px-4 py-2 rounded-xl text-xs font-bold" style={{ color: activeColor }}>
                    Teks Link
                  </span>
                </div>
              </div>
            </div>

            {/* ── Save Button ──────────────────────────────── */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!storeName.trim()}
                className="flex-1 py-4 rounded-2xl text-white font-black text-sm tracking-widest uppercase transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                style={{ backgroundColor: activeColor, boxShadow: `0 8px 20px ${activeColor}40` }}
              >
                {saved ? '✅ Tersimpan!' : 'Simpan Perubahan'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Reset
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 pb-8">
              Perubahan disimpan di browser ini. Reload halaman untuk melihat efek penuh.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
