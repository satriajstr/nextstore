const DEFAULT_TIMEZONE = 'Asia/Jakarta'

/**
 * Format a Date into YYYY-MM-DD in a specific IANA time zone (default: WIB / Asia/Jakarta).
 * Avoids UTC drift from Date.toISOString().split('T')[0].
 */
export function formatDateId(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value

  if (!y || !m || !d) return ''
  return `${y}-${m}-${d}`
}

export function getTodayId(timeZone = DEFAULT_TIMEZONE) {
  return formatDateId(new Date(), timeZone)
}

