'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUserProfile } from '../lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SYSTEM_NAME = 'NextStore'
const SYSTEM_COLOR = '#6366f1' // Indigo-500
const SECONDARY_COLOR = '#8b5cf6' // Violet-500

export default function LandingPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null)

  // 1. Logika Pemeriksaan Sesi & Auto-Redirect Pintar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsLoggedIn(true)
          const profile = await getUserProfile()
          if (profile) {
            setUserRole(profile.role)
            if (profile.role === 'admin') {
              router.replace('/dashboard')
              return
            } else if (profile.role === 'kasir') {
              router.replace('/kasir')
              return
            }
          }
        }
      } catch (err) {
        console.error('Gagal memeriksa sesi awal:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkSession()
  }, [router])

  // Loader transisi yang cantik saat memeriksa sesi
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        {/* Background decorative blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-50 blur-3xl" style={{ backgroundColor: SYSTEM_COLOR + '20' }}></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-70 blur-3xl" style={{ backgroundColor: SECONDARY_COLOR + '15' }}></div>
        </div>

        <div className="relative text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-2"
            style={{
              animation: 'floatBounce 2s ease-in-out infinite',
              background: `linear-gradient(135deg, ${SYSTEM_COLOR}, ${SECONDARY_COLOR})`,
              boxShadow: `0 10px 25px ${SYSTEM_COLOR}40`
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">{SYSTEM_NAME}</h2>
          <div className="w-8 h-1 rounded-full bg-indigo-500 overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-violet-500 w-1/2 rounded-full animate-loader"></div>
          </div>
        </div>

        <style>{`
          @keyframes floatBounce {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-6px); }
          }
          @keyframes loader {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .animate-loader {
            animation: loader 1.5s infinite linear;
          }
        `}</style>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 font-sans relative overflow-x-hidden">

      {/* Background blobs senada halaman login */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-40 blur-3xl" style={{ backgroundColor: SYSTEM_COLOR + '18' }}></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-50 blur-3xl" style={{ backgroundColor: SECONDARY_COLOR + '12' }}></div>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-100/60 px-6 py-4 md:px-12 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo dengan gradient senada login */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${SYSTEM_COLOR}, ${SECONDARY_COLOR})`,
                boxShadow: `0 4px 12px ${SYSTEM_COLOR}30`
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
              </svg>
            </div>
            <span className="text-xl font-black text-gray-800 tracking-tighter transition-colors group-hover:text-indigo-600">{SYSTEM_NAME}</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-500">
            <a href="#fitur" className="hover:text-indigo-600 transition-colors">Fitur Utama</a>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md active:scale-95 transition-all"
              style={{
                background: `linear-gradient(135deg, ${SYSTEM_COLOR}, ${SECONDARY_COLOR})`,
                boxShadow: `0 4px 14px ${SYSTEM_COLOR}30`
              }}
            >
              Masuk / Daftar
            </Link>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 md:px-12 md:pt-24 flex flex-col items-center text-center">

        {/* Badge Intro */}
        <div className="mb-6 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black tracking-widest uppercase animate-pulse">
          Point of Sale Cerdas bertenaga AI ⚡
        </div>

        {/* Title */}
        <h1 className="max-w-4xl text-4xl md:text-6xl font-black text-gray-800 tracking-tight leading-[1.1] mb-6">
          Kelola Toko Lebih Mudah & <br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${SYSTEM_COLOR}, ${SECONDARY_COLOR})` }}>
            Tumbuhkan Omzet Bisnis Anda
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-gray-500 text-base md:text-lg font-medium leading-relaxed mb-10">
          NextStore adalah sistem kasir (POS) modern & komprehensif yang dirancang khusus untuk mempermudah transaksi kasir, pencatatan otomatis, memantau persediaan produk secara realtime, dan memaksimalkan laba bersih toko Anda.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 font-black rounded-2xl text-white shadow-xl active:scale-[0.98] transition-all text-sm tracking-wider uppercase"
            style={{
              background: `linear-gradient(135deg, ${SYSTEM_COLOR}, ${SECONDARY_COLOR})`,
              boxShadow: `0 8px 24px ${SYSTEM_COLOR}40`
            }}
          >
            Mulai Sekarang (Gratis)
          </Link>
          <a
            href="#fitur"
            className="w-full sm:w-auto px-8 py-4 font-bold rounded-2xl bg-white border border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all text-sm tracking-wider uppercase text-center"
          >
            Pelajari Fitur
          </a>
        </div>

        {/* Premium Dashboard & UI Mockup (Interactive CSS) */}
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 md:p-8 overflow-hidden animate-fade-slide-in">

          {/* Windows / Mac OS top dots */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
            <span className="w-3 h-3 rounded-full bg-red-400"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="ml-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">NEXTSTORE POS INTERFACE MOCKUP</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Sidebar Mockup */}
            <div className="hidden md:flex flex-col gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="h-8 w-full bg-gray-200/60 rounded-xl"></div>
              <div className="h-8 w-11/12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center px-3 text-xs font-bold gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Dashboard
              </div>
              <div className="h-8 w-10/12 bg-gray-200/30 rounded-xl"></div>
              <div className="h-8 w-9/12 bg-gray-200/30 rounded-xl"></div>
              <div className="h-8 w-10/12 bg-gray-200/30 rounded-xl"></div>
            </div>

            {/* Content Mockup */}
            <div className="md:col-span-2 flex flex-col gap-6 text-left">

              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100/30">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Total Penjualan Hari Ini</span>
                  <span className="text-xl md:text-2xl font-black text-indigo-600">Rp 4.750.000</span>
                </div>
                <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-100/30">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">Laba Bersih</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-600">Rp 1.820.000</span>
                </div>
              </div>

              {/* Chart Mockup */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Grafik Penjualan Terakhir</span>
                  <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">7 Hari Terakhir</span>
                </div>
                <div className="h-32 w-full flex items-end gap-3 pt-4 border-b border-gray-200 pb-1">
                  <div className="w-full bg-indigo-300 rounded-t-lg h-[40%] hover:bg-indigo-500 transition-all duration-300"></div>
                  <div className="w-full bg-indigo-300 rounded-t-lg h-[55%] hover:bg-indigo-500 transition-all duration-300"></div>
                  <div className="w-full bg-indigo-300 rounded-t-lg h-[45%] hover:bg-indigo-500 transition-all duration-300"></div>
                  <div className="w-full bg-indigo-300 rounded-t-lg h-[70%] hover:bg-indigo-500 transition-all duration-300"></div>
                  <div className="w-full bg-indigo-300 rounded-t-lg h-[60%] hover:bg-indigo-500 transition-all duration-300"></div>
                  <div className="w-full bg-indigo-500 rounded-t-lg h-[90%] shadow-lg shadow-indigo-200"></div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* CORE FEATURES SECTION */}
      <section id="fitur" className="relative z-10 bg-white border-t border-b border-gray-100 py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">Fitur Andalan</h2>
            <h3 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
              Segala Fitur POS Yang <br className="hidden md:block" /> Anda Butuhkan untuk Maju
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Feature 1 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-3">Kasir Super Responsif</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Antarmuka kasir (POS) yang cepat, mendukung pencarian pintar instan, kalkulator kembalian otomatis, kustomisasi kolom, dan filter kategori.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                </svg>
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-3">Laporan Keuangan Otomatis</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Pencatatan omzet harian, keuntungan bersih, dan rekap metode pembayaran QRIS/Tunai secara instan yang siap diekspor kapan saja.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-3">Bantuan Asisten AI Cerdas</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Analisis mendalam performa toko Anda bertenaga kecerdasan buatan (AI) yang memberikan rekomendasi langkah bisnis yang taktis.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-3">Notifikasi Stok Kritis</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Pantau stok barang yang mulai menipis secara realtime. Cegah kehilangan penjualan dengan notifikasi stok kritis otomatis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-3">Multi-Kasir Terproteksi</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Kelola pendaftaran kasir, batasi hak akses dengan persetujuan admin, dan pantau performa masing-masing kasir secara objektif.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-3xl p-8 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <h4 className="text-lg font-black text-gray-800 mb-3">Kustomisasi Tema Toko</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Sesuaikan nama toko, warna aksen primer, dan jam operasional untuk menyesuaikan gaya branding toko fisik Anda yang unik.
              </p>
            </div>

          </div>

        </div>
      </section>



      {/* FOOTER */}
      <footer className="relative z-10 bg-gray-900 text-gray-400 py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 border-b border-gray-800 pb-12">

          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${SYSTEM_COLOR}, ${SECONDARY_COLOR})` }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                </svg>
              </div>
              <span className="text-lg font-black text-white tracking-tighter">{SYSTEM_NAME}</span>
            </div>
            <p className="text-xs font-medium text-gray-500 max-w-sm">
              Sistem kasir toko (POS) & manajemen keuangan modern yang mudah, aman, dan realtime.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-xs font-bold">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <Link href="/login" className="hover:text-white transition-colors">Masuk Sistem</Link>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-600 font-semibold gap-4">
          <p>© 2026 {SYSTEM_NAME} · Point of Sale System · Sistem Manajemen Toko Modern.</p>
          <p>Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </footer>

      {/* GLOBAL CSS ANIMATIONS */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-in {
          animation: fadeSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </main>
  )
}
