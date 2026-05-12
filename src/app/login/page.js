'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getRole } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../lib/ThemeContext'

export default function Login() {
  const { storeName, primaryColor } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Helper: redirect berdasarkan role
  const redirectByRole = async () => {
    const role = await getRole()
    if (role === 'admin') {
      router.replace('/produk')
    } else if (role === 'kasir') {
      router.replace('/')
    } else {
      // Role tidak dikenali / tidak ada di tabel profiles
      setError('Akun Anda belum memiliki role. Hubungi Admin.')
      await supabase.auth.signOut()
    }
  }

  // Jika sudah login, langsung arahkan sesuai role
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await redirectByRole()
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError

      // Login berhasil — redirect berdasarkan role, BUKAN selalu ke '/'
      await redirectByRole()
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : err.message
      )
      setLoading(false)
    }
  }

  // Tampilkan loading spinner selama cek session awal
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">

      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: primaryColor + '20' }}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-70 blur-3xl" style={{ backgroundColor: primaryColor + '10' }}></div>
      </div>

      <div className="relative max-w-md w-full">

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/80 p-10 md:p-12 border border-gray-100"
          style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg mx-auto mb-5"
              style={{
                animation: 'floatBounce 3s ease-in-out infinite',
                backgroundColor: primaryColor,
                boxShadow: `0 10px 25px ${primaryColor}40`
              }}>
              🛍️
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter">{storeName}</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1.5" style={{ color: primaryColor }}>
              Point of Sale System
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-medium flex items-center gap-3"
              style={{ animation: 'shake 0.3s ease-in-out' }}>
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nama@email.com"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
                style={{ '--tw-ring-color': primaryColor + '20' }}
                onFocus={e => { e.target.style.borderColor = primaryColor; e.target.style.boxShadow = `0 0 0 4px ${primaryColor}20` }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
                style={{ '--tw-ring-color': primaryColor + '20' }}
                onFocus={e => { e.target.style.borderColor = primaryColor; e.target.style.boxShadow = `0 0 0 4px ${primaryColor}20` }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 8px 20px ${primaryColor}40`
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memeriksa...</span>
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-50 text-center">
            <p className="text-gray-300 text-xs font-medium">
              © 2026 W Corporation · Sistem Manajemen Toko
            </p>
          </div>
        </div>


      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-6px); }
          75%       { transform: translateX(6px); }
        }
      `}</style>
    </main>
  )
}
