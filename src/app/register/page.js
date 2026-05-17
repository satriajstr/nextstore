'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../lib/ThemeContext'
import Link from 'next/link'

export default function Register() {
  const { primaryColor } = useTheme()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Sign Up Admin
      // The Database Trigger will automatically:
      // - Create the Store with the name provided in metadata
      // - Create the Admin Profile linked to that store
      // - Set status to 'approved'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
            store_name: storeName.trim(),
            full_name: fullName.trim()
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal mendaftarkan akun.')

      // 2. Sign out to prevent auto-login issues during dev
      await supabase.auth.signOut()

      // Success - redirect to login
      router.push('/login?registered=true')
    } catch (err) {
      console.error(err)
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: primaryColor + '20' }}></div>
      </div>

      <div className="relative max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-10 md:p-12 border border-gray-100 animate-fade-in">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg mx-auto mb-5"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 10px 25px ${primaryColor}40`
              }}>
              🏪
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Daftar Admin Toko</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1.5" style={{ color: primaryColor }}>
              Satu langkah menuju bisnis modern
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-medium flex items-center gap-3">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Misal: Ahmad Fauzi"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Nama Toko Anda</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                placeholder="Misal: Toko Berkah"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Admin</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email Anda"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password Anda"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 8px 20px ${primaryColor}40`
              }}
            >
              {loading ? 'Mendaftarkan Toko...' : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-gray-400 text-xs font-medium">
              Sudah punya akun? <Link href="/login" className="font-bold hover:underline" style={{ color: primaryColor }}>Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
