const DEFAULT_TIMEZONE = 'Asia/Jakarta'

/** Normalisasi TIME dari DB ("08:00:00") ke "08:00" */
export function formatTimeID(timeStr) {
  if (!timeStr) return ''
  const [h, m] = String(timeStr).slice(0, 5).split(':')
  return `${h}:${m}`
}

export function getCurrentMinutesInTimezone(timezone = DEFAULT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)
  return hour * 60 + minute
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null
  const [h, m] = String(timeStr).slice(0, 5).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/**
 * Cek apakah waktu sekarang (WIB) berada dalam jam operasional.
 * Jika open_time atau close_time null → tidak dibatasi (selalu buka).
 */
export function isWithinStoreHours(openTime, closeTime, timezone = DEFAULT_TIMEZONE) {
  if (!openTime || !closeTime) return true

  const openMin = parseTimeToMinutes(openTime)
  const closeMin = parseTimeToMinutes(closeTime)
  if (openMin === null || closeMin === null) return true
  if (openMin === closeMin) return false

  const nowMin = getCurrentMinutesInTimezone(timezone)

  if (openMin < closeMin) {
    return nowMin >= openMin && nowMin < closeMin
  }
  // Rentang melewati tengah malam (mis. 22:00 – 06:00)
  return nowMin >= openMin || nowMin < closeMin
}

export function getStoreHoursStatus(openTime, closeTime, timezone = DEFAULT_TIMEZONE) {
  const hasHours = Boolean(openTime && closeTime)
  const isOpen = isWithinStoreHours(openTime, closeTime, timezone)
  const openLabel = formatTimeID(openTime)
  const closeLabel = formatTimeID(closeTime)

  return {
    hasHours,
    isOpen,
    openTime: openLabel,
    closeTime: closeLabel,
    message:
      hasHours && !isOpen
        ? `Kasir hanya dapat diakses pada jam operasional (${openLabel} – ${closeLabel} WIB).`
        : null,
  }
}
