'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SYSTEM_NAME = 'NextStore'
const SYSTEM_COLOR = '#6366f1'

function normalizeInviteCode(code) {
  return String(code || '').trim().toUpperCase()
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.')
  return data
}

export default function RegisterKasir() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const code = normalizeInviteCode(inviteCode)
      const name = fullName.trim()

      const { invite } = await postJson('/api/cashier-invites/validate', { inviteCode: code })

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: 'kasir',
            store_id: invite.store_id,
            status: 'active',
            full_name: name,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Gagal membuat akun kasir.')

      await postJson('/api/cashier-invites/redeem', {
        inviteCode: code,
        userId: authData.user.id,
        fullName: name,
      })

      await supabase.auth.signOut()
      router.push('/login?registered=true&as=kasir')
    } catch (err) {
      setError(err.message === 'User already registered' ? 'Email sudah terdaftar.' : err.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="relative max-w-md w-full">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/80 p-10 md:p-12 border border-gray-100">
          <div className="text-center mb-10">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-5"
              style={{
                background: `linear-gradient(135deg, ${SYSTEM_COLOR}, #8b5cf6)`,
                boxShadow: `0 10px 25px ${SYSTEM_COLOR}40`,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter">{SYSTEM_NAME}</h1>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mt-1.5" style={{ color: SYSTEM_COLOR }}>
              Daftar Kasir Toko
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl font-medium flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
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
                placeholder="Nama lengkap Anda"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none text-gray-700 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none text-gray-700 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none text-gray-700 font-medium text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Kode Kasir</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
                required
                placeholder="KSR-XA82-PQ91"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:outline-none text-gray-700 font-black tracking-widest text-sm uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-widest uppercase"
              style={{
                background: `linear-gradient(135deg, ${SYSTEM_COLOR}, #8b5cf6)`,
                boxShadow: `0 8px 20px ${SYSTEM_COLOR}40`,
              }}
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Kasir'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-gray-400 text-xs font-medium">
              Sudah punya akun? <Link href="/login" className="font-bold hover:underline" style={{ color: SYSTEM_COLOR }}>Masuk</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
