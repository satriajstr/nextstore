import { NextResponse } from 'next/server'

// OpenRouter — OpenAI-compatible endpoint
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
// Model gratis yang tersedia di OpenRouter
const MODEL = '~openai/gpt-latest'

// ─── System Prompt Builder ────────────────────────────────────────────────────
function buildSystemPrompt(analytics, storeName) {
  const {
    today, week,
    potentialProducts, topSelling, lowStock, deadStock, slowMoving,
    topCategories, allProducts, store,
  } = analytics

  const date = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const list = (arr, fn, empty) =>
    arr && arr.length > 0 ? arr.map(fn).join('\n') : empty

  return `Kamu adalah AI Executive Business Assistant khusus untuk toko "${storeName}".

ATURAN ABSOLUT:
• HANYA boleh menyebut produk yang ada di daftar SEMUA PRODUK TOKO di bawah.
• DILARANG membuat nama produk sendiri atau menyebut produk dari luar database.
• DILARANG menjawab di luar konteks bisnis toko "${storeName}".
• Semua analisa WAJIB merujuk data nyata dari database di bawah.
• Jika data kosong, katakan jujur bahwa data belum tersedia.

IDENTITAS:
Business analyst + inventory assistant + sales strategist eksklusif untuk "${storeName}".
Kategori produk: ${store?.categories?.length > 0 ? store.categories.join(', ') : 'belum terklasifikasi'}.
Total produk terdaftar: ${store?.totalProducts ?? 0}.

===== DATA TOKO — ${date} =====

--- PENJUALAN HARI INI ---
Total: ${today?.sales ?? 'Rp 0'}
Jumlah transaksi: ${today?.trxCount ?? 0}
Rata-rata per transaksi: ${today?.avgTrx ?? 'Rp 0'}
Perubahan vs kemarin: ${today?.salesChangeStr ?? 'belum ada data'}

--- PERFORMA 7 HARI ---
Total penjualan: ${week?.total ?? 'Rp 0'}
Total transaksi: ${week?.trxCount ?? 0}
Total keuntungan bersih: ${week?.profit ?? 'Rp 0'}
${week?.days?.length > 0
      ? 'Rekap harian:\n' + week.days.map(d => `  ${d.date}: ${d.sales} (${d.trx} trx)`).join('\n')
      : '(Belum ada rekap harian tersimpan)'}

--- PRODUK POTENSIAL (7 HARI) ---
${list(potentialProducts,
        p => `• ${p.name} [${p.category}] — terjual ${p.qty7d} unit, revenue ${p.revenue7d}, stok: ${p.currentStock}`,
        '(Belum ada data penjualan — mungkin belum ada transaksi)')}

--- TOP SELLING (7 HARI) ---
${list(topSelling,
          (p, i) => `${i + 1}. ${p.name} — ${p.qty7d} unit (${p.revenue7d})`,
          '(Belum ada data penjualan)')}

--- LOW STOCK (STOK ≤ 3) ---
${list(lowStock,
            p => `• ${p.name} [${p.category}] — stok: ${p.stock} unit, terjual 7 hari: ${p.soldLast7d} unit`,
            '(Tidak ada produk stok kritis)')}

--- DEAD STOCK (STOK > 5, TIDAK TERJUAL 30 HARI) ---
${list(deadStock,
              p => `• ${p.name} [${p.category}] — stok menumpuk: ${p.stock} unit`,
              '(Tidak ada dead stock)')}

--- SLOW MOVING ---
${list(slowMoving,
                p => `• ${p.name} — stok: ${p.stock}, terjual ${p.soldLast30d} unit dalam 30 hari`,
                '(Tidak ada)')}

--- TOP KATEGORI (7 HARI) ---
${list(topCategories,
                  c => `• ${c.cat}: ${c.qty} unit terjual`,
                  '(Belum ada data)')}

--- SEMUA PRODUK TOKO (${allProducts?.length ?? 0} produk) ---
${allProducts?.length > 0
      ? allProducts.map(p => `• ${p.name} [${p.category}] stok:${p.stock} harga:${p.hargaJual} terjual7h:${p.soldLast7d} terjual30h:${p.soldLast30d}`).join('\n')
      : '(Database produk kosong)'}

===== CARA MENJAWAB =====
• Natural, seperti asisten bisnis nyata — tidak robotik, tidak terlalu panjang.
• SELALU sebut nama produk asli dari daftar database di atas.
• Format dengan emoji: 📈 Kondisi Bisnis | 🔥 Produk Potensial | ⚠️ Perhatian | 💡 Rekomendasi | 🎯 Tindakan Owner
• Jika tidak ada data yang relevan, katakan jujur belum ada data cukup.
• Fokus pada insight actionable dan spesifik untuk toko ini.`
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json()
    const { message, history, analytics, storeName } = body

    if (!message || !analytics || !storeName) {
      return NextResponse.json(
        { error: 'message, analytics, dan storeName wajib diisi' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY tidak dikonfigurasi di .env.local' },
        { status: 500 }
      )
    }

    // Build system prompt dari analytics
    let systemPrompt = ''
    try {
      systemPrompt = buildSystemPrompt(analytics, storeName)
    } catch (e) {
      console.error('buildSystemPrompt error:', e)
      return NextResponse.json({ error: 'Gagal membangun context AI: ' + e.message }, { status: 500 })
    }

    // Build messages array (OpenAI format)
    const messages = [
      { role: 'system', content: systemPrompt },
      // Conversation history (last 10 messages)
      ...(history || [])
        .slice(-10)
        .filter(m => m.text && m.text.trim())
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
      { role: 'user', content: message },
    ]

    console.log(`[AI Chat] Calling OpenRouter | model: ${MODEL} | messages: ${messages.length}`)

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nextstore.vercel.app',
        'X-Title': 'NextStore AI Business Assistant',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.65,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[AI Chat] OpenRouter error status:', res.status)
      console.error('[AI Chat] OpenRouter error body:', errText)
      let errMsg = `OpenRouter error (${res.status})`
      try {
        const parsed = JSON.parse(errText)
        errMsg = parsed?.error?.message ?? errMsg
      } catch (_) { }
      return NextResponse.json({ error: errMsg, detail: errText }, { status: 502 })
    }

    const data = await res.json()
    console.log('[AI Chat] OpenRouter response OK, finish_reason:', data?.choices?.[0]?.finish_reason)

    const aiText = data?.choices?.[0]?.message?.content

    if (!aiText) {
      console.error('[AI Chat] Empty response:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Respons AI kosong', detail: JSON.stringify(data) },
        { status: 502 }
      )
    }

    return NextResponse.json({ reply: aiText })

  } catch (err) {
    console.error('[AI Chat] Internal error:', err)
    return NextResponse.json({ error: 'Internal error: ' + err.message }, { status: 500 })
  }
}
