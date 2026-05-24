'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, getUserProfile } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'
import { useState, useEffect } from 'react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/produk',
    label: 'Kelola Produk',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    href: '/laporan',
    label: 'Laporan Penjualan',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    href: '/kustomisasi',
    label: 'Pengaturan Toko',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    href: '/kasir-management',
    label: 'Manajemen Kasir',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-2.533-4.656 6.858 6.858 0 00-2.993-1.548M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: '/owner/assistant-ai',
    label: 'Asisten AI',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
]

const STORE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
  </svg>
)

/** Flyout ikon + label saat sidebar collapsed + hover */
function CollapsedFlyout({ label, sublabel, accent, active, icon }) {
  return (
    <span
      className={`
        pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-[80]
        flex items-center gap-2.5 pl-2 pr-4 py-2.5 rounded-2xl border min-w-[140px]
        shadow-lg
        opacity-0 scale-[0.92] -translate-x-3
        group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0
        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${active ? 'text-white border-transparent' : 'bg-white text-slate-700 border-slate-100'}
      `}
      style={active ? {
        backgroundColor: accent,
        boxShadow: `0 10px 28px ${accent}50`,
      } : undefined}
    >
      {icon && (
        <span
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={active
            ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }
            : { backgroundColor: `${accent}18`, color: accent }
          }
        >
          {icon}
        </span>
      )}
      <span className={`flex flex-col min-w-0 ${sublabel ? 'gap-0.5' : ''}`}>
        <span className="text-sm font-semibold truncate max-w-[160px]">{label}</span>
        {sublabel && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[160px]"
            style={{ color: active ? 'rgba(255,255,255,0.8)' : accent }}
          >
            {sublabel}
          </span>
        )}
      </span>
    </span>
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const { storeName, primaryColor } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [hasCriticalStock, setHasCriticalStock] = useState(false)

  useEffect(() => {
    const checkCriticalStock = async () => {
      try {
        const profile = await getUserProfile()
        if (!profile?.store_id) return

        const savedThreshold = typeof window !== 'undefined'
          ? parseInt(localStorage.getItem('critical_stock_threshold')) || 3
          : 3

        const { data, error } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', profile.store_id)
          .lte('stock', savedThreshold)
          .limit(1)

        if (error) throw error
        setHasCriticalStock(data && data.length > 0)
      } catch (err) {
        console.error('Error checking critical stock in sidebar:', err)
      }
    }

    checkCriticalStock()
    const interval = setInterval(checkCriticalStock, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar_collapsed', String(!prev))
      return !prev
    })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'Password minimal 6 karakter.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Password dan konfirmasi tidak cocok.' })
      return
    }
    setPwLoading(true)
    setPwMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) throw new Error('Password lama salah.')

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPwMessage({ type: 'success', text: 'Password berhasil diubah!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => { setShowChangePassword(false); setPwMessage(null) }, 2000)
    } catch (err) {
      setPwMessage({ type: 'error', text: err.message })
    } finally {
      setPwLoading(false)
    }
  }

  const iconBtnCollapsed = 'group relative w-11 h-11 mx-auto flex items-center justify-center rounded-2xl transition-all duration-300 ease-out'
  const iconBtnExpanded = 'flex items-center gap-3 w-full rounded-2xl font-semibold text-sm transition-all duration-300 ease-out px-4 py-3'

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {STORE_ICON}
          </div>
          <span className="font-black text-gray-800 tracking-tight text-base">{storeName}</span>
        </div>
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 transition-all duration-200"
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-white border-r border-gray-100 shadow-xl
          transition-[width,transform] duration-300 ease-in-out
          md:sticky md:top-0 md:h-screen md:shadow-none md:z-auto md:shrink-0 md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-[72px] overflow-visible' : 'w-64'}
        `}
      >
        {/* Brand / Store */}
        <div
          className={`group relative border-b border-gray-50 flex items-center transition-all duration-300 ease-out
            ${collapsed ? 'p-4 justify-center' : 'p-5'}`}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}50` }}
          >
            {STORE_ICON}
          </div>

          {!collapsed && (
            <div className="ml-3 min-w-0 overflow-hidden transition-all duration-300 ease-out opacity-100 translate-x-0">
              <h1 className="font-black text-gray-800 tracking-tight leading-none text-lg truncate">{storeName}</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mt-0.5" style={{ color: primaryColor }}>
                Admin Panel
              </p>
            </div>
          )}

          {collapsed && (
            <CollapsedFlyout
              label={storeName}
              sublabel="Admin Panel"
              accent={primaryColor}
              icon={STORE_ICON}
            />
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-2 overflow-visible' : 'px-2 overflow-y-auto overflow-x-hidden'}`}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative z-10 ${collapsed ? iconBtnCollapsed : iconBtnExpanded}
                  ${collapsed && !isActive ? 'hover:bg-slate-50' : ''}`}
                style={
                  isActive
                    ? {
                      backgroundColor: primaryColor,
                      color: '#fff',
                      boxShadow: `0 4px 12px ${primaryColor}40`,
                    }
                    : { color: '#6b7280' }
                }
                onMouseEnter={(e) => {
                  if (!isActive && !collapsed) e.currentTarget.style.backgroundColor = primaryColor + '15'
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !collapsed) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span
                  className={`relative z-10 flex-shrink-0 transition-all duration-300 group-hover:scale-110
                    ${collapsed && !isActive ? 'text-slate-400 group-hover:text-slate-600' : ''}`}
                  style={isActive ? { color: '#fff' } : collapsed ? undefined : { color: '#9ca3af' }}
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <>
                    <span className="whitespace-nowrap transition-opacity duration-300">{item.label}</span>
                    {item.href === '/produk' && hasCriticalStock && (
                      <span className={`ml-auto flex h-2.5 w-2.5 relative shrink-0 ${isActive ? 'mr-1' : ''}`}>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    )}
                    {isActive && !(item.href === '/produk' && hasCriticalStock) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                    )}
                  </>
                )}

                {collapsed && item.href === '/produk' && hasCriticalStock && (
                  <span className="absolute top-2 right-2 flex h-2 w-2 z-20">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}

                {collapsed && (
                  <CollapsedFlyout
                    label={item.label}
                    sublabel={item.href === '/produk' && hasCriticalStock ? 'Stok Kritis' : undefined}
                    accent={item.href === '/produk' && hasCriticalStock ? '#f43f5e' : primaryColor}
                    active={isActive}
                    icon={item.icon}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className={`px-2 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={toggleCollapsed}
            className={`relative z-10 ${collapsed ? `${iconBtnCollapsed} hover:bg-slate-50 text-slate-400` : `${iconBtnExpanded} text-slate-400 hover:text-slate-600 hover:bg-slate-50 !py-2.5`}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ease-out ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {!collapsed && <span className="whitespace-nowrap">Collapse</span>}
            {collapsed && (
              <CollapsedFlyout label="Perluas Navigasi" accent={primaryColor} />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className={`border-t border-gray-50 space-y-1 transition-all duration-300 ${collapsed ? 'p-2 overflow-visible' : 'p-3'}`}>
          <button
            onClick={() => setShowChangePassword(true)}
            className={`relative z-10 ${collapsed
              ? `${iconBtnCollapsed} text-amber-500 hover:bg-amber-50 hover:text-amber-600`
              : `${iconBtnExpanded} text-amber-500 hover:bg-amber-50 hover:text-amber-600 !py-2.5`
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            {!collapsed && <span className="whitespace-nowrap">Ganti Password</span>}
            {collapsed && (
              <CollapsedFlyout
                label="Ganti Password"
                accent="#f59e0b"
                icon={(
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
              />
            )}
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`relative z-10 ${collapsed
              ? `${iconBtnCollapsed} text-red-400 hover:bg-red-50 hover:text-red-600`
              : `${iconBtnExpanded} text-red-400 hover:bg-red-50 hover:text-red-600`
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!collapsed && <span className="whitespace-nowrap">Logout</span>}
            {collapsed && (
              <CollapsedFlyout
                label="Logout"
                accent="#f87171"
                icon={(
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                )}
              />
            )}
          </button>
        </div>
      </aside>

      {/* Modals unchanged */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 flex flex-col gap-5 animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Ganti Password Admin</h3>
              <button onClick={() => { setShowChangePassword(false); setPwMessage(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }} className="text-gray-300 hover:text-gray-500 text-2xl">×</button>
            </div>
            {pwMessage && (
              <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${pwMessage.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {pwMessage.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                )}
                <span>{pwMessage.text}</span>
              </div>
            )}
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Password Lama</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Password saat ini" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Password Baru</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Minimal 6 karakter" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm font-medium transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Konfirmasi Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Ketik ulang password baru" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-gray-700 text-sm font-medium transition-all" />
              </div>
              <button type="submit" disabled={pwLoading} className="w-full py-3 rounded-xl text-white font-bold transition-all active:scale-95 shadow-lg disabled:opacity-50 text-sm" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}40` }}>
                {pwLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 flex flex-col gap-5 animate-fade-in text-center">
            <div className="mx-auto text-red-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Keluar dari Admin Panel?</h3>
            <p className="text-gray-500 text-sm">Anda akan logout dari sesi admin. Pastikan semua perubahan sudah tersimpan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition-all text-sm">Batal</button>
              <button onClick={() => { setShowLogoutConfirm(false); signOut() }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100 text-sm">Ya, Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
