import { getTodayId, formatDateId } from './dateId'

/**
 * Mendeteksi hari-hari sebelum hari ini yang memiliki transaksi atau berstatus 'open' di daily_summary,
 * lalu menghitung rekapitulasi keuangannya dan menutup hari-hari tersebut secara otomatis.
 * 
 * @param {object} supabase - Client Supabase
 * @param {string} storeId - ID Toko
 * @returns {Promise<Array>} List hari yang berhasil ditutup otomatis beserta ringkasan keuangannya (hanya yang memiliki transaksi > 0)
 */
export async function autoClosePastDays(supabase, storeId) {
  if (!storeId) return []

  const today = getTodayId()
  // Batas awal hari ini (WIB) dalam format UTC ISOString
  const startLocalToday = new Date(`${today}T00:00:00+07:00`).toISOString()
  
  // Batasi pencarian hingga 90 hari yang lalu demi performa
  const ninetyDaysAgo = new Date(new Date(`${today}T00:00:00+07:00`).getTime() - 90 * 86400000).toISOString()

  try {
    // 1. Dapatkan semua summary yang masih berstatus 'open' sebelum hari ini
    const { data: openSummaries, error: openSumErr } = await supabase
      .from('daily_summary')
      .select('date')
      .eq('store_id', storeId)
      .eq('status', 'open')
      .lt('date', today)

    if (openSumErr) throw openSumErr

    // 2. Dapatkan semua transaksi dalam 90 hari terakhir sebelum hari ini
    const { data: trxList, error: trxErr } = await supabase
      .from('transactions')
      .select('id, created_at, total_harga, diskon')
      .eq('store_id', storeId)
      .gte('created_at', ninetyDaysAgo)
      .lt('created_at', startLocalToday)

    if (trxErr) throw trxErr

    // 3. Gabungkan semua tanggal unik yang memerlukan penutupan
    const datesToProcess = new Set()

    // Tambahkan tanggal dari open summaries
    if (openSummaries) {
      openSummaries.forEach(s => {
        if (s.date && s.date < today) {
          datesToProcess.add(s.date)
        }
      })
    }

    // Tambahkan tanggal dari transaksi yang terdeteksi
    if (trxList) {
      trxList.forEach(trx => {
        const dateObj = new Date(trx.created_at)
        const formattedDate = formatDateId(dateObj, 'Asia/Jakarta')
        if (formattedDate && formattedDate < today) {
          datesToProcess.add(formattedDate)
        }
      })
    }

    const uniqueDates = Array.from(datesToProcess).sort()
    if (uniqueDates.length === 0) return []

    // 4. Periksa data daily_summary untuk semua tanggal unik tersebut untuk mengecek status 'closed'
    const { data: currentSummaries, error: curSumErr } = await supabase
      .from('daily_summary')
      .select('date, status')
      .eq('store_id', storeId)
      .in('date', uniqueDates)

    if (curSumErr) throw curSumErr

    const closedDates = new Set(
      (currentSummaries || [])
        .filter(s => s.status === 'closed')
        .map(s => s.date)
    )

    // Tanggal yang benar-benar harus diproses adalah yang belum berstatus 'closed'
    const datesToClose = uniqueDates.filter(d => !closedDates.has(d))
    if (datesToClose.length === 0) return []

    const closedReports = []

    // 5. Proses penutupan untuk masing-masing tanggal
    for (const dateStr of datesToClose) {
      const startLocal = new Date(`${dateStr}T00:00:00+07:00`).toISOString()
      const endLocal = new Date(new Date(`${dateStr}T00:00:00+07:00`).getTime() + 86400000).toISOString()

      // Ambil transaksi khusus untuk tanggal yang bersangkutan dari daftar transaksi yang sudah kita tarik
      const trxForDate = (trxList || []).filter(t => {
        const tTime = new Date(t.created_at).getTime()
        return tTime >= new Date(startLocal).getTime() && tTime < new Date(endLocal).getTime()
      })

      const totalHariIniFresh = trxForDate.reduce((acc, t) => acc + (t.total_harga || 0), 0)
      const diskonSesi = trxForDate.reduce((acc, t) => acc + (t.diskon || 0), 0)
      const trxIds = trxForDate.map(t => t.id)

      // Ambil data carry over dari daily_summary existing jika ada
      const { data: existing } = await supabase
        .from('daily_summary')
        .select('carry_over, carry_modal, carry_diskon, carry_trx_count, total_penjualan, total_modal, total_diskon, keuntungan_bersih, jumlah_transaksi')
        .eq('store_id', storeId)
        .eq('date', dateStr)
        .maybeSingle()

      const carryPenjualan = existing?.carry_over ?? 0
      const carryModal = existing?.carry_modal ?? 0
      const carryDiskon = existing?.carry_diskon ?? 0
      const carryTrxCount = existing?.carry_trx_count ?? 0

      // Ambil modal item transaksi
      let modalSesi = 0
      if (trxIds.length > 0) {
        const { data: items, error: itemErr } = await supabase
          .from('transaction_items')
          .select('quantity, products (harga_modal)')
          .in('transaction_id', trxIds)

        if (!itemErr && items) {
          items.forEach(item => {
            modalSesi += (item.products?.harga_modal ?? 0) * item.quantity
          })
        }
      }

      const totalTrxCount = carryTrxCount + trxForDate.length

      if (totalTrxCount > 0) {
        const totalPenjualan = carryPenjualan + totalHariIniFresh
        const totalModal = carryModal + modalSesi
        const totalDiskon = carryDiskon + diskonSesi
        const keuntunganBersih = totalPenjualan - totalModal

        const upsertPayload = {
          date: dateStr,
          store_id: storeId,
          status: 'closed',
          carry_over: carryPenjualan,
          carry_modal: carryModal,
          carry_diskon: carryDiskon,
          carry_trx_count: carryTrxCount,
          total_penjualan: totalPenjualan,
          total_modal: totalModal,
          total_diskon: totalDiskon,
          keuntungan_bersih: keuntunganBersih,
          jumlah_transaksi: totalTrxCount
        }

        const { error: upsertErr } = await supabase
          .from('daily_summary')
          .upsert(upsertPayload, { onConflict: 'date, store_id' })

        if (upsertErr) {
          console.error(`Gagal melakukan auto-close untuk tanggal ${dateStr}:`, upsertErr)
          continue
        }

        closedReports.push({
          date: dateStr,
          totalPenjualan,
          keuntunganBersih,
          jumlahTrx: totalTrxCount
        })
      } else {
        // Jika tidak ada transaksi sama sekali, hapus record daily_summary yang ada untuk tanggal tersebut (jika ada yang berstatus 'open') agar tidak disimpan di grafik
        const { error: deleteErr } = await supabase
          .from('daily_summary')
          .delete()
          .eq('store_id', storeId)
          .eq('date', dateStr)

        if (deleteErr) {
          console.error(`Gagal menghapus rekap kosong untuk tanggal ${dateStr}:`, deleteErr)
        }
      }
    }

    return closedReports
  } catch (err) {
    console.error("Kesalahan fatal saat auto-close hari-hari sebelumnya:", err)
    throw err
  }
}
