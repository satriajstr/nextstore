'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SYSTEM_NAME = 'NextStore'
const SYSTEM_COLOR = '#6366f1' // Indigo-500

export default function Register() {
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
      // - Set status to 'active'
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
              Daftar Admin Toko
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

          {/* Form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            {/* Nama Lengkap */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Nama lengkap Anda"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
                onFocus={e => { e.target.style.borderColor = SYSTEM_COLOR; e.target.style.boxShadow = `0 0 0 4px ${SYSTEM_COLOR}20` }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Nama Toko */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Nama Toko
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                placeholder="Nama toko yang ingin dibuat"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
                onFocus={e => { e.target.style.borderColor = SYSTEM_COLOR; e.target.style.boxShadow = `0 0 0 4px ${SYSTEM_COLOR}20` }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>

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
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-medium text-sm"
                onFocus={e => { e.target.style.borderColor = SYSTEM_COLOR; e.target.style.boxShadow = `0 0 0 4px ${SYSTEM_COLOR}20` }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
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
                  <span>Mendaftarkan Toko...</span>
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-gray-400 text-xs font-medium">
              Sudah punya akun? <Link href="/login" className="font-bold hover:underline" style={{ color: SYSTEM_COLOR }}>Masuk</Link>
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
      `}
      </style>
    </main>
  )
}

