'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const ThemeContext = createContext({})

export const THEME_DEFAULTS = {
  storeName: 'NextStore',
  primaryColor: '#ec4899', // pink-500
}

// Converts hex color to "r, g, b" string for rgba() usage
function hexToRgbStr(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

// Darken a hex color by a factor (0-1)
function darken(hex, factor = 0.15) {
  let r = parseInt(hex.slice(1, 3), 16)
  let g = parseInt(hex.slice(3, 5), 16)
  let b = parseInt(hex.slice(5, 7), 16)
  r = Math.max(0, Math.round(r * (1 - factor)))
  g = Math.max(0, Math.round(g * (1 - factor)))
  b = Math.max(0, Math.round(b * (1 - factor)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function ThemeProvider({ children }) {
  const [storeName, setStoreName] = useState(THEME_DEFAULTS.storeName)
  const [primaryColor, setPrimaryColor] = useState(THEME_DEFAULTS.primaryColor)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Sinkronisasi instan di browser sesaat setelah mount untuk mencegah text & style mismatch
    try {
      const saved = localStorage.getItem('nextstore_theme')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.storeName) setStoreName(parsed.storeName)
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor)
      }
    } catch (e) {}

    const loadTheme = async () => {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession()

      // 2. If NOT logged in, use Local Storage or Defaults
      if (!session) {
        try {
          const saved = localStorage.getItem('nextstore_theme')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.storeName) setStoreName(parsed.storeName)
            if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor)
          } else {
            // Reset to defaults if no session and no saved theme
            setStoreName(THEME_DEFAULTS.storeName)
            setPrimaryColor(THEME_DEFAULTS.primaryColor)
          }
        } catch (e) { /* ignore */ }
        setLoaded(true)
        return
      }

      // 3. If Logged in, fetch fresh data from Database
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_id')
        .eq('user_id', session.user.id)
        .single()

      if (profile?.store_id) {
        const { data: store } = await supabase
          .from('stores')
          .select('name, primary_color')
          .eq('id', profile.store_id)
          .single()

        if (store) {
          setStoreName(store.name)
          if (store.primary_color) setPrimaryColor(store.primary_color)
          
          // Sync to local storage so it persists for the session
          localStorage.setItem('nextstore_theme', JSON.stringify({ 
            storeName: store.name, 
            primaryColor: store.primary_color || primaryColor 
          }))
        }
      }
      setLoaded(true)
    }

    loadTheme()

    // Listen for auth changes (Login/Logout) to refresh theme
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadTheme()
    })

    return () => subscription.unsubscribe()
  }, [])

  const saveTheme = ({ storeName: name, primaryColor: color }) => {
    setStoreName(name)
    setPrimaryColor(color)
    localStorage.setItem('nextstore_theme', JSON.stringify({ storeName: name, primaryColor: color }))
  }

  const rgb = hexToRgbStr(primaryColor)
  const darker = darken(primaryColor, 0.12)
  const primaryLight = `rgba(${rgb}, 0.12)`
  const primaryLighter = `rgba(${rgb}, 0.06)`
  const primaryBorder = `rgba(${rgb}, 0.25)`
  const primaryShadow = `rgba(${rgb}, 0.28)`

  // This CSS overrides ALL Tailwind pink-* classes to follow --primary variable.
  // Using !important to beat specificity of compiled Tailwind.
  const themeCSS = `
    :root {
      --primary: ${primaryColor};
      --primary-dark: ${darker};
      --primary-light: ${primaryLight};
      --primary-lighter: ${primaryLighter};
      --primary-rgb: ${rgb};
    }

    /* ── Text colors ─────────────────────────────────── */
    .text-pink-500  { color: ${primaryColor} !important; }
    .text-pink-600  { color: ${darker} !important; }
    .text-pink-400  { color: ${primaryColor} !important; opacity: 0.8; }

    /* ── Background colors ───────────────────────────── */
    .bg-pink-500               { background-color: ${primaryColor} !important; }
    .bg-pink-600               { background-color: ${darker} !important; }
    .bg-pink-50                { background-color: ${primaryLighter} !important; }
    .bg-pink-100               { background-color: ${primaryLight} !important; }

    /* ── Hover backgrounds ───────────────────────────── */
    .hover\\:bg-pink-500:hover  { background-color: ${primaryColor} !important; }
    .hover\\:bg-pink-600:hover  { background-color: ${darker} !important; }
    .hover\\:bg-pink-100:hover  { background-color: ${primaryLight} !important; }
    .hover\\:bg-pink-50:hover   { background-color: ${primaryLighter} !important; }
    .hover\\:text-pink-500:hover { color: ${primaryColor} !important; }
    .hover\\:text-pink-600:hover { color: ${darker} !important; }
    .hover\\:border-pink-200:hover { border-color: ${primaryBorder} !important; }
    .hover\\:border-pink-300:hover { border-color: ${primaryColor} !important; opacity: 0.6; }

    /* ── Border colors ───────────────────────────────── */
    .border-pink-100           { border-color: ${primaryBorder} !important; }
    .border-pink-200           { border-color: ${primaryBorder} !important; }
    .border-pink-300           { border-color: ${primaryColor} !important; opacity: 0.5; }
    .border-pink-400           { border-color: ${primaryColor} !important; opacity: 0.7; }
    .border-pink-500           { border-color: ${primaryColor} !important; }

    /* ── Focus ring / border ─────────────────────────── */
    .focus\\:border-pink-300:focus  { border-color: ${primaryColor} !important; }
    .focus\\:border-pink-400:focus  { border-color: ${primaryColor} !important; }
    .focus\\:ring-pink-50:focus     { --tw-ring-color: ${primaryLighter} !important; }
    .focus\\:ring-pink-100:focus    { --tw-ring-color: ${primaryLight} !important; }
    .focus\\:ring-pink-200:focus    { --tw-ring-color: ${primaryLight} !important; }

    /* ── Group hover ─────────────────────────────────── */
    .group:hover .group-hover\\:text-pink-600 { color: ${darker} !important; }
    .group:hover .group-hover\\:text-pink-500 { color: ${primaryColor} !important; }

    /* ── Shadow colors ───────────────────────────────── */
    .shadow-pink-100           { --tw-shadow-color: ${primaryShadow} !important; }
    .shadow-pink-200           { --tw-shadow-color: ${primaryShadow} !important; }

    /* ── Ring decoration (bounce badge on cart) ──────── */
    .ring-pink-100             { --tw-ring-color: ${primaryLight} !important; }

    /* ── Scrollbar thumb ─────────────────────────────── */
    .custom-scrollbar::-webkit-scrollbar-thumb { background: ${primaryColor} !important; opacity: 0.5; }

    /* ── Accent utility ──────────────────────────────── */
    .accent-pink-500           { accent-color: ${primaryColor} !important; }
  `

  const themeScript = `
    (function() {
      try {
        var saved = localStorage.getItem('nextstore_theme');
        if (saved) {
          var parsed = JSON.parse(saved);
          var color = parsed.primaryColor;
          if (color) {
            document.documentElement.style.setProperty('--primary', color);
            
            // Hex to RGB conversion
            var r = parseInt(color.slice(1, 3), 16);
            var g = parseInt(color.slice(3, 5), 16);
            var b = parseInt(color.slice(5, 7), 16);
            var rgb = r + ', ' + g + ', ' + b;
            document.documentElement.style.setProperty('--primary-rgb', rgb);
            
            // Darken conversion
            var factor = 0.12;
            var dr = Math.max(0, Math.round(r * (1 - factor)));
            var dg = Math.max(0, Math.round(g * (1 - factor)));
            var db = Math.max(0, Math.round(b * (1 - factor)));
            var darker = '#' + dr.toString(16).padStart(2, '0') + dg.toString(16).padStart(2, '0') + db.toString(16).padStart(2, '0');
            document.documentElement.style.setProperty('--primary-dark', darker);
            
            document.documentElement.style.setProperty('--primary-light', 'rgba(' + rgb + ', 0.12)');
            document.documentElement.style.setProperty('--primary-lighter', 'rgba(' + rgb + ', 0.06)');
          }
        }
      } catch (e) {}
    })()
  `;

  return (
    <ThemeContext.Provider value={{ storeName, primaryColor, primaryLight, primaryLighter, primaryShadow, saveTheme, loaded }}>
      <style suppressHydrationWarning>{themeCSS}</style>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

