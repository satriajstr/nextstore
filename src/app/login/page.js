'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getRole } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Login page uses its own independent branding — NOT the store theme
const SYSTEM_NAME = 'NextStore'
const SYSTEM_COLOR = '#6366f1' // Indigo-500

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)
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

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      })
      if (error) throw error
      setResetMessage({ type: 'success', text: 'Link reset password telah dikirim ke email Anda. Silakan cek inbox atau spam.' })
    } catch (err) {
      setResetMessage({ type: 'error', text: err.message })
    } finally {
      setResetLoading(false)
    }
  }

  // Tampilkan loading spinner selama cek session awal
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: SYSTEM_COLOR }}></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">

      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: SYSTEM_COLOR + '20' }}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-70 blur-3xl" style={{ backgroundColor: '#8b5cf6' + '15' }}></div>
      </div>

      <div className="relative max-w-md w-full">

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/80 p-10 md:p-12 border border-gray-100"
          style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-5"
              style={{
                animation: 'floatBounce 3s ease-in-out infinite',
                background: `linear-gradient(135deg, ${SYSTEM_COLOR}, #8b5cf6)`,
                boxShadow: `0 10px 25px ${SYSTEM_COLOR}40`
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter">{SYSTEM_NAME}</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mt-1.5" style={{ color: SYSTEM_COLOR }}>
              Point of Sale System
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-medium flex items-center gap-3"
              style={{ animation: 'shake 0.3s ease-in-out' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword ? (
            <div className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <p className="text-lg font-bold text-gray-700">Lupa Password?</p>
              <p className="text-xs text-gray-400 mt-1">Masukkan email Anda, kami akan mengirim link reset password.</p>
            </div>

            {resetMessage && (
              <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${resetMessage.type === 'success' ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                {resetMessage.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                )}
                <span>{resetMessage.text}</span>
              </div>
            )}

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
                    onFocus={e => { e.target.style.borderColor = SYSTEM_COLOR; e.target.style.boxShadow = `0 0 0 4px ${SYSTEM_COLOR}20` }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-4 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
                  style={{ background: `linear-gradient(135deg, ${SYSTEM_COLOR}, #8b5cf6)`, boxShadow: `0 8px 20px ${SYSTEM_COLOR}40` }}
                >
                  {resetLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
              </form>
              <button
                onClick={() => { setShowForgotPassword(false); setResetMessage(null) }}
                className="text-center text-xs text-gray-400 font-medium hover:text-gray-600 transition-colors"
              >
                ← Kembali ke Login
              </button>
            </div>
          ) : (
            <>
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
                    onFocus={e => { e.target.style.borderColor = SYSTEM_COLOR; e.target.style.boxShadow = `0 0 0 4px ${SYSTEM_COLOR}20` }}
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
                    onFocus={e => { e.target.style.borderColor = SYSTEM_COLOR; e.target.style.boxShadow = `0 0 0 4px ${SYSTEM_COLOR}20` }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Forgot Password Link */}
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-bold hover:underline transition-colors"
                    style={{ color: SYSTEM_COLOR }}
                  >
                    Lupa Password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 mt-2 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
                  style={{
                    background: `linear-gradient(135deg, ${SYSTEM_COLOR}, #8b5cf6)`,
                    boxShadow: `0 8px 20px ${SYSTEM_COLOR}40`
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
              <div className="mt-10 pt-6 border-t border-gray-50 text-center flex flex-col gap-2">
                <p className="text-gray-400 text-xs font-medium">
                  Ingin mulai mengelola toko sendiri? <Link href="/register" className="font-bold hover:underline" style={{ color: SYSTEM_COLOR }}>Daftar sebagai Admin</Link>
                </p>
                <p className="text-gray-400 text-xs font-medium">
                  Punya kode akses kasir dari toko? <Link href="/register-kasir" className="font-bold hover:underline" style={{ color: SYSTEM_COLOR }}>Daftar di sini</Link>
                </p>
                <p className="text-gray-300 text-[9px] font-medium mt-2">
                  © 2026 {SYSTEM_NAME} · Sistem Manajemen Toko
                </p>
              </div>
            </>
          )}
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
      `}
      </style>
    </main>
  )
}
