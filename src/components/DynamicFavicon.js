'use client'

import { useEffect } from 'react'
import { useTheme } from '../lib/ThemeContext'
import { usePathname } from 'next/navigation'

export default function DynamicFavicon() {
  const { primaryColor, storeName } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    // 1. Update Tab Title based on active page or storeName
    if (pathname === '/login') {
      document.title = 'NextStore - Login'
    } else if (pathname === '/register') {
      document.title = 'NextStore - Register Admin'
    } else if (pathname === '/register-kasir') {
      document.title = 'NextStore - Register Kasir'
    } else if (storeName) {
      document.title = storeName
    } else {
      document.title = 'NextStore'
    }
  }, [storeName, pathname])

  if (!primaryColor) return null

  // Get the first letter of storeName for the icon
  const initial = (storeName || 'N').charAt(0).toUpperCase()

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="${primaryColor}cc"/>
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#bg)"/>
    <text x="32" y="44" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="36" fill="white">${initial}</text>
  </svg>`

  const encoded = `data:image/svg+xml,${encodeURIComponent(svg)}`

  return (
    <link rel="icon" type="image/svg+xml" href={encoded} />
  )
}
