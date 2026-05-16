'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../lib/ThemeContext'
import Link from 'next/link'

export default function RegisterKasir() {
  const { primaryColor } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registrationCode, setRegistrationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const trimmedCode = registrationCode.trim()
      
      // 1. Validate Registration Code (Store ID)
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('id', trimmedCode)
        .single()

      if (storeError) {
        console.error('Store validation error:', storeError)
        throw new Error('Maaf, Kode Toko tidak ditemukan. Pastikan kodenya sudah benar atau hubungi Admin Anda.')
      }

      // 2. Sign Up User with metadata for the Trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'kasir',
            store_id: store.id
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat akun kasir.')

      // Step 3: Profile is now handled by the Database Trigger!
      // No need to insert manually anymore.

      // Step 4: Sign out to prevent auto-login redirect
      await supabase.auth.signOut()

      // Success
      router.push('/login?registered=true&as=kasir')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: primaryColor + '20' }}></div>
      </div>

      <div className="relative max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-10 md:p-12 border border-gray-100 animate-fade-in">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg mx-auto mb-5"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 10px 25px ${primaryColor}40`
              }}>
              🧑‍💻
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter">Daftar Kasir</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1.5" style={{ color: primaryColor }}>
              Hubungkan ke Toko Anda
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
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Kode Registrasi Toko</label>
              <input
                type="text"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
                required
                placeholder="Masukkan kode dari Admin..."
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none transition-all text-gray-700 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Kasir</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="kasir@email.com"
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
                placeholder="••••••••"
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
              {loading ? 'Mendaftarkan Kasir...' : 'Daftar Kasir'}
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
