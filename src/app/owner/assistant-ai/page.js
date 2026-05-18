'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getUserProfile } from '../../../lib/auth'
import AdminSidebar from '../../../components/AdminSidebar'
import { useTheme } from '../../../lib/ThemeContext'

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n ?? 0)

// ─── Client-side analytics engine (sama pola dengan produk page) ───────────────
async function fetchAnalytics(storeId) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const d7 = new Date(now); d7.setDate(now.getDate() - 7)
  const d30 = new Date(now); d30.setDate(now.getDate() - 30)
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // 1. Fetch products — persis seperti produk page
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('name', { ascending: true })

  // 2. Today transactions
  const { data: todayTrx } = await supabase
    .from('transactions')
    .select('id, total_harga, payment_method')
    .eq('store_id', storeId)
    .gte('created_at', todayStr)

  // 3. 7-day transaction IDs
  const { data: trx7d } = await supabase
    .from('transactions')
    .select('id')
    .eq('store_id', storeId)
    .gte('created_at', d7.toISOString())

  // 4. 30-day transaction IDs
  const { data: trx30d } = await supabase
    .from('transactions')
    .select('id')
    .eq('store_id', storeId)
    .gte('created_at', d30.toISOString())

  const ids7d = (trx7d || []).map(t => t.id)
  const ids30d = (trx30d || []).map(t => t.id)

  // 5. Items for 7 days
  let items7d = []
  if (ids7d.length > 0) {
    const { data } = await supabase
      .from('transaction_items')
      .select('product_id, quantity, subtotal, products(name, category)')
      .in('transaction_id', ids7d)
    items7d = data || []
  }

  // 6. Items for 30 days
  let items30d = []
  if (ids30d.length > 0) {
    const { data } = await supabase
      .from('transaction_items')
      .select('product_id, quantity')
      .in('transaction_id', ids30d)
    items30d = data || []
  }

  // 7. Daily summaries 7 days
  const { data: dailySummaries } = await supabase
    .from('daily_summary')
    .select('date, total_penjualan, jumlah_transaksi, keuntungan_bersih')
    .eq('store_id', storeId)
    .gte('date', d7.toISOString().split('T')[0])
    .order('date', { ascending: false })

  // 8. Yesterday summary
  const { data: yday } = await supabase
    .from('daily_summary')
    .select('total_penjualan')
    .eq('store_id', storeId)
    .eq('date', yesterdayStr)
    .maybeSingle()

  // ── Compute aggregates ──────────────────────────────────────────────────────
  const salesMap7d = {}
  for (const item of items7d) {
    const pid = item.product_id
    if (!salesMap7d[pid]) salesMap7d[pid] = { name: item.products?.name ?? '?', category: item.products?.category ?? 'Umum', qty: 0, revenue: 0 }
    salesMap7d[pid].qty += item.quantity
    salesMap7d[pid].revenue += item.subtotal
  }

  const soldQty30d = {}
  for (const item of items30d) {
    soldQty30d[item.product_id] = (soldQty30d[item.product_id] || 0) + item.quantity
  }

  const ranked7d = Object.entries(salesMap7d).sort((a, b) => b[1].qty - a[1].qty)

  const todaySalesRaw = (todayTrx || []).reduce((s, t) => s + (t.total_harga || 0), 0)
  const todayTrxCount = (todayTrx || []).length
  const avgTrx = todayTrxCount > 0 ? Math.round(todaySalesRaw / todayTrxCount) : 0
  const ydaySales = yday?.total_penjualan ?? 0
  const salesChangePct = ydaySales > 0 ? Math.round(((todaySalesRaw - ydaySales) / ydaySales) * 100) : null
  const salesChangeStr = salesChangePct !== null ? `${salesChangePct >= 0 ? '+' : ''}${salesChangePct}% vs kemarin` : 'belum ada data kemarin'

  const topSelling = ranked7d.slice(0, 8).map(([pid, v]) => ({
    name: v.name, category: v.category, qty7d: v.qty,
    revenue7d: fmt(v.revenue),
    currentStock: (products || []).find(p => p.id === pid)?.stock ?? 0,
  }))

  const potentialProducts = ranked7d
    .filter(([pid, v]) => v.qty >= 2)
    .slice(0, 5)
    .map(([pid, v]) => ({
      name: v.name, category: v.category, qty7d: v.qty,
      revenue7d: fmt(v.revenue),
      currentStock: (products || []).find(p => p.id === pid)?.stock ?? 0,
    }))

  const lowStock = (products || [])
    .filter(p => p.stock !== null && p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8)
    .map(p => ({ name: p.name, category: p.category ?? 'Umum', stock: p.stock, soldLast7d: salesMap7d[p.id]?.qty ?? 0 }))

  const deadStock = (products || [])
    .filter(p => (p.stock ?? 0) > 5 && !soldQty30d[p.id])
    .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
    .slice(0, 8)
    .map(p => ({ name: p.name, category: p.category ?? 'Umum', stock: p.stock }))

  const slowMoving = (products || [])
    .filter(p => (p.stock ?? 0) > 3 && soldQty30d[p.id] && soldQty30d[p.id] < 3)
    .slice(0, 5)
    .map(p => ({ name: p.name, category: p.category ?? 'Umum', stock: p.stock, soldLast30d: soldQty30d[p.id] }))

  const catMap = {}
  for (const [, v] of Object.entries(salesMap7d)) {
    catMap[v.category] = (catMap[v.category] || 0) + v.qty
  }
  const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, qty]) => ({ cat, qty }))

  const weekTotal = (dailySummaries || []).reduce((s, d) => s + (d.total_penjualan || 0), 0)
  const weekTrx   = (dailySummaries || []).reduce((s, d) => s + (d.jumlah_transaksi || 0), 0)
  const weekProfit = (dailySummaries || []).reduce((s, d) => s + (d.keuntungan_bersih || 0), 0)

  const categories = [...new Set((products || []).map(p => p.category).filter(Boolean))]

  return {
    store: { totalProducts: (products || []).length, categories },
    today: { sales: fmt(todaySalesRaw), salesRaw: todaySalesRaw, trxCount: todayTrxCount, avgTrx: fmt(avgTrx), salesChangeStr, salesChangePct },
    week: { total: fmt(weekTotal), trxCount: weekTrx, profit: fmt(weekProfit), days: (dailySummaries || []).map(d => ({ date: d.date, sales: fmt(d.total_penjualan), trx: d.jumlah_transaksi })) },
    potentialProducts, topSelling, lowStock, deadStock, slowMoving, topCategories,
    allProducts: (products || []).map(p => ({
      name: p.name, category: p.category ?? 'Umum', stock: p.stock ?? 0,
      hargaJual: fmt(p.harga_jual),
      soldLast7d: salesMap7d[p.id]?.qty ?? 0,
      soldLast30d: soldQty30d[p.id] ?? 0,
    })),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function renderText(text) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

function InsightCard({ emoji, title, value, sub, accent, loading }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 transition-all duration-200 cursor-default"
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.07),0 0 0 1.5px ${accent}30`; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${accent}15` }}>{emoji}</div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${accent}12`, color: accent }}>{loading ? '…' : 'Live'}</span>
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{title}</p>
        {loading ? <div className="h-4 bg-gray-100 rounded animate-pulse w-4/5" /> : <p className="font-bold text-gray-800 text-sm leading-snug">{value}</p>}
        {sub && !loading && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function ChatBubble({ msg, primaryColor }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end animate-ai-in">
        <div className="max-w-[75%] px-5 py-3.5 rounded-2xl rounded-tr-sm text-white text-sm leading-relaxed shadow-md" style={{ backgroundColor: primaryColor }}>
          {msg.text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-3 animate-ai-in">
      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md mt-0.5" style={{ backgroundColor: primaryColor }}>✦</div>
      <div className="max-w-[82%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>AI Assistant</p>
        {msg.error
          ? <p className="text-sm text-red-500">{msg.text}</p>
          : <div className="text-sm text-gray-700 leading-relaxed">{renderText(msg.text)}</div>}
      </div>
    </div>
  )
}

function TypingIndicator({ primaryColor }) {
  return (
    <div className="flex items-start gap-3 animate-ai-in">
      <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ backgroundColor: primaryColor }}>✦</div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center">
          {[0, 160, 320].map(d => <span key={d} className="w-2 h-2 rounded-full animate-typing-dot" style={{ backgroundColor: primaryColor, animationDelay: `${d}ms` }} />)}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssistantAIPage() {
  const router = useRouter()
  const { primaryColor } = useTheme()

  const [profile, setProfile]           = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [storeName, setStoreName]       = useState('')
  const [analytics, setAnalytics]       = useState(null)
  const [cardsLoading, setCardsLoading] = useState(true)
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [isTyping, setIsTyping]         = useState(false)

  const chatEndRef = useRef(null)
  const inputRef   = useRef(null)

  // ── Auth + initial fetch (sama persis pola produk page) ─────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const userProfile = await getUserProfile()
      if (!userProfile || userProfile.role !== 'admin') {
        await supabase.auth.signOut()
        router.replace('/login')
        return
      }
      setProfile(userProfile)
      setCheckingAuth(false)

      // Fetch store name
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', userProfile.store_id)
        .single()
      setStoreName(store?.name ?? 'Toko Anda')
    }
    checkAuth()
  }, [router])

  // ── Fetch analytics setelah profile tersedia ─────────────────────────────────
  useEffect(() => {
    if (!profile?.store_id) return
    const load = async () => {
      setCardsLoading(true)
      try {
        const data = await fetchAnalytics(profile.store_id)
        setAnalytics(data)
      } catch (e) { console.error('Analytics error:', e) }
      finally { setCardsLoading(false) }
    }
    load()
  }, [profile?.store_id])

  // ── Auto scroll ──────────────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || isTyping || !analytics) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: trimmed, id: Date.now() }])
    setIsTyping(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
          analytics,
          storeName,
        }),
      })
      const data = await res.json()
      setIsTyping(false)

      if (!res.ok || data.error) {
        // Show actual Gemini error message if available
        const errMsg = data.error || 'AI tidak merespons.'
        setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${errMsg}`, error: true, id: Date.now() + 1 }])
        return
      }

      if (!data.reply) {
        setMessages(prev => [...prev, { role: 'ai', text: '⚠️ AI mengembalikan respons kosong. Coba lagi.', error: true, id: Date.now() + 1 }])
        return
      }

      setMessages(prev => [...prev, { role: 'ai', text: data.reply, id: Date.now() + 1 }])
    } catch (err) {
      setIsTyping(false)
      console.error('sendMessage error:', err)
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Koneksi bermasalah. Coba lagi.', error: true, id: Date.now() + 1 }])
    }
    inputRef.current?.focus()
  }, [input, isTyping, analytics, storeName, messages])

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }

  // ── Insight cards dari data real ─────────────────────────────────────────────
  const insightCards = [
    {
      emoji: '🔥', title: 'Produk Potensial', accent: primaryColor,
      value: analytics?.topSelling?.[0]?.name ?? (analytics ? 'Belum ada transaksi' : '—'),
      sub:   analytics?.topSelling?.[0] ? `${analytics.topSelling[0].qty7d} unit terjual (7 hari)` : null,
    },
    {
      emoji: '⚠️', title: 'Low Stock Alert', accent: '#f59e0b',
      value: analytics ? (analytics.lowStock.length > 0 ? `${analytics.lowStock.length} produk stok ≤ 3` : 'Stok aman semua') : '—',
      sub:   analytics?.lowStock?.[0] ? `${analytics.lowStock[0].name} — ${analytics.lowStock[0].stock} unit` : null,
    },
    {
      emoji: '📈', title: 'Penjualan Hari Ini', accent: '#10b981',
      value: analytics?.today.sales ?? '—',
      sub:   analytics ? `${analytics.today.salesChangeStr} · ${analytics.today.trxCount} transaksi` : null,
    },
    {
      emoji: '🧠', title: 'Insight AI', accent: '#8b5cf6',
      value: analytics ? (analytics.deadStock.length > 0 ? `${analytics.deadStock.length} dead stock` : 'Semua produk aktif') : '—',
      sub:   analytics?.deadStock.length > 0 ? 'Tidak terjual 30+ hari' : (analytics ? 'Tidak ada dead stock' : null),
    },
  ]

  const suggestions = [
    'Bagaimana kondisi toko hari ini?',
    'Produk apa yang paling potensial?',
    'Barang mana yang perlu direstock?',
    'Apa produk dead stock saya?',
    'Performa penjualan minggu ini?',
    'Rekomendasikan strategi promo!',
  ]

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes aiIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .animate-ai-in { animation: aiIn 0.28s ease-out forwards; }
        @keyframes typingDot { 0%,80%,100%{transform:scale(0.65);opacity:0.35} 40%{transform:scale(1);opacity:1} }
        .animate-typing-dot { display:inline-block; animation:typingDot 1.2s infinite ease-in-out; }
      `}</style>

      <main className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
        <AdminSidebar />
        <div className="flex-1 pt-16 md:pt-0 overflow-x-hidden flex flex-col">
          <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">

            {/* HEADER */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 6px 20px ${primaryColor}45` }}>✦</div>
                <div>
                  <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-none">AI Business Assistant</h1>
                  <p className="text-sm text-gray-500 mt-1">{storeName ? `Analisa real-time untuk ${storeName}` : 'Memuat data toko…'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Data Real-time
                </span>
                <span className="text-[11px] font-bold px-3 py-1.5 rounded-full border"
                  style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30`, color: primaryColor }}>
                  ✦ Gemini AI
                </span>
              </div>
            </header>

            {/* INSIGHT CARDS */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {insightCards.map((card, i) => <InsightCard key={i} {...card} loading={cardsLoading} />)}
            </section>

            {/* CHAT SECTION */}
            <section className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[480px]">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg,${primaryColor}08,transparent)` }}>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-semibold text-gray-700">Chat dengan AI Business Assistant</span>
                </div>
                <span className="text-xs text-gray-400">{messages.length} pesan</span>
              </div>

              {/* Suggestion chips */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} disabled={isTyping || !analytics}
                      className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 whitespace-nowrap transition-all duration-150 disabled:opacity-40"
                      onMouseEnter={e => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.color = primaryColor }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = '' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 custom-scrollbar min-h-[280px]">
                {messages.length === 0 && !isTyping && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${primaryColor}12` }}>🧠</div>
                    <div>
                      <p className="font-bold text-gray-700 text-base">Tanyakan apa saja tentang bisnis Anda</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {cardsLoading ? 'Sedang memuat data toko dari database…' : 'AI membaca langsung data database toko Anda.'}
                      </p>
                    </div>
                  </div>
                )}
                {messages.map(msg => <ChatBubble key={msg.id} msg={msg} primaryColor={primaryColor} />)}
                {isTyping && <TypingIndicator primaryColor={primaryColor} />}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 transition-all duration-200"
                  onFocus={e => e.currentTarget.style.borderColor = `${primaryColor}60`}
                  onBlur={e => e.currentTarget.style.borderColor = ''}>
                  <textarea ref={inputRef} rows={1} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={cardsLoading ? 'Menunggu data toko dimuat…' : 'Tanyakan kondisi bisnis, produk, stok… (Enter kirim)'}
                    disabled={isTyping || cardsLoading}
                    className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 resize-none outline-none leading-relaxed disabled:opacity-50"
                    style={{ maxHeight: '120px' }} />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || isTyping || cardsLoading}
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-30"
                    style={{ backgroundColor: (!input.trim() || isTyping || cardsLoading) ? '#e5e7eb' : primaryColor, color: (!input.trim() || isTyping || cardsLoading) ? '#9ca3af' : '#fff' }}
                    aria-label="Kirim">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-2">
                  Didukung Gemini AI · Semua jawaban berbasis data real database toko Anda
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
