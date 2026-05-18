'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getUserProfile } from '../../lib/auth'
import { useRouter } from 'next/navigation'
import AdminSidebar from '../../components/AdminSidebar'

export default function KasirManagement() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [cashiers, setCashiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const userProfile = await getUserProfile()
      if (!userProfile || userProfile.role !== 'admin') {
        router.replace('/login')
        return
      }
      setProfile(userProfile)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const fetchCashiers = useCallback(async () => {
    if (!profile?.store_id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, role, store_id, status')
      .eq('store_id', profile.store_id)
      .eq('role', 'kasir')

    if (error) {
        console.error(error)
    } else {
      setCashiers(data || [])
    }
    setLoading(false)
  }, [profile?.store_id])

  const handleUpdateStatus = async (userId, newStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('user_id', userId)

    if (error) {
      alert('Gagal memperbarui status')
    } else {
      fetchCashiers()
    }
  }

  const handleDeleteCashier = async (userId) => {
    if (!confirm('Yakin ingin menghapus kasir ini? Akses mereka akan dicabut.')) return
    
    // Kita set status ke 'revoked' atau hapus profilnya
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId)

    if (error) {
      alert('Gagal menghapus kasir')
    } else {
      fetchCashiers()
    }
  }

  const handleCopyCode = () => {
    if (!profile?.store_id) return
    navigator.clipboard.writeText(profile.store_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    fetchCashiers()
  }, [fetchCashiers])

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" style={{ borderColor: 'transparent', borderBottomColor: profile?.primary_color || '#ec4899' }}></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-pink-500 tracking-tighter">Manajemen Kasir</h1>
          <p className="text-gray-500">Kelola akun kasir yang terhubung dengan toko Anda</p>
        </header>

        <section className="grid md:grid-cols-2 gap-8">
          {/* INFO CARD */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Kode Registrasi Kasir
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Berikan kode di bawah ini kepada calon kasir Anda. Mereka harus memasukkan kode ini saat mendaftar di halaman pendaftaran kasir.
            </p>
            <div className="bg-pink-50 border-2 border-dashed border-pink-200 rounded-2xl p-6 text-center relative group">
              <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">Kode Registrasi Toko</p>
              <code className="text-xl font-black text-pink-600 tracking-wider break-all block mb-4">
                {profile?.store_id}
              </code>
              <button
                onClick={handleCopyCode}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                  ${copied ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-pink-600 border border-pink-200 hover:bg-pink-100'}`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Tersalin!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Salin Kode
                  </>
                )}
              </button>
            </div>
            <div className="mt-8 p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Panduan Pendaftaran
              </h4>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Salin dan kirimkan <strong>Kode Registrasi</strong> di atas kepada calon kasir Anda.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Arahkan mereka untuk mengakses halaman pendaftaran khusus kasir di sistem ini.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Kasir mendaftar menggunakan email mereka dan memasukkan kode tersebut untuk terhubung.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* LIST CARD */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <h3 className="font-bold text-gray-700">Daftar Kasir Terdaftar</h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-400">Loading...</div>
              ) : cashiers.length === 0 ? (
                <div className="p-12 text-center text-gray-300">
                  <p>Belum ada kasir yang terdaftar.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                      <th className="px-6 py-4">ID Kasir</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cashiers.map((ksr) => (
                      <tr key={ksr.user_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-mono text-xs text-gray-600">{ksr.user_id.slice(0, 8)}...</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest
                            ${ksr.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {ksr.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            {ksr.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(ksr.user_id, 'approved')}
                                className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-all shadow-sm"
                              >
                                SETUJUI
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteCashier(ksr.user_id)}
                              className="px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-all"
                            >
                              HAPUS
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
