'use client'

import { useState } from 'react'

/**
 * Grafik garis rekap penjualan & keuntungan harian (sama dengan dashboard admin).
 * @param {{ data: { date: string, total_penjualan: number, keuntungan_bersih: number }[], primaryColor: string, formatIDR: (n: number) => string, height?: number }} props
 */
export default function SalesLineChart({ data, primaryColor, formatIDR, height = 110, onPointClick }) {
  const [hovered, setHovered] = useState(null)
  const W = 520
  const H = height
  const padX = 16
  const padY = 12
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const maxVal = Math.max(...data.map((d) => d.total_penjualan), 1)
  const denom = Math.max(data.length - 1, 1)

  const px = (i) => padX + (i / denom) * innerW
  const py = (v) => padY + innerH - (v / maxVal) * innerH

  const salesPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.total_penjualan)}`).join(' ')
  const profitPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(Math.max(d.keuntungan_bersih, 0))}`).join(' ')
  const areaPath = `${salesPath} L${px(data.length - 1)},${H} L${padX},${H} Z`

  const tooltipLeft = (i) => `${(px(i) / W) * 100}%`

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H, overflow: 'visible' }}>
        <defs>
          <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.12" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#salesAreaGrad)" />
        <path d={salesPath} fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={profitPath} fill="none" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.45" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g
            key={d.date}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onPointClick && onPointClick(d.date)}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={px(i)} cy={py(d.total_penjualan)} r={12} fill="transparent" />
            <circle cx={px(i)} cy={py(d.total_penjualan)} r={hovered === i ? 5 : 3} fill="white" stroke={primaryColor} strokeWidth="2" />
          </g>
        ))}
      </svg>

      {hovered !== null && (
        <div
          className="absolute -top-[4.75rem] pointer-events-none z-10 animate-ai-in"
          style={{
            left: tooltipLeft(hovered),
            transform:
              hovered === 0
                ? 'translateX(0)'
                : hovered === data.length - 1
                  ? 'translateX(-100%)'
                  : 'translateX(-50%)',
          }}
        >
          <div className="bg-slate-800 text-white rounded-xl px-3 py-2 text-[10px] font-bold whitespace-nowrap shadow-xl">
            <div className="text-slate-400 font-medium border-b border-slate-700/50 pb-0.5 mb-1 text-[8px] uppercase tracking-wider">
              {new Date(data[hovered].date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
            <div>Jual: {formatIDR(data[hovered].total_penjualan)}</div>
            <div className="text-emerald-400 font-semibold mt-0.5">Untung: {formatIDR(data[hovered].keuntungan_bersih)}</div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-1 gap-0.5">
        {data.map((d) => (
          <span key={d.date} className="text-[8px] text-slate-400 font-semibold truncate max-w-[3rem] sm:max-w-none text-center flex-1">
            {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </div>
  )
}

export const CHART_DAY_OPTIONS = [
  { value: 7, label: '7 Hari' },
  { value: 14, label: '14 Hari' },
  { value: 30, label: '30 Hari' },
  { value: 90, label: '90 Hari' },
]
