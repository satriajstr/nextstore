'use client'

import { useState } from 'react'

export default function HourlySalesChart({ data, primaryColor, formatIDR, height = 120 }) {
  const [hovered, setHovered] = useState(null)

  if (!data || data.length === 0) return null

  const W = 520
  const H = height
  const padX = 18
  const padY = 14
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const maxVal = Math.max(...data.map((d) => d.total), 1)
  const denom = Math.max(data.length - 1, 1)

  const px = (i) => padX + (i / denom) * innerW
  const py = (v) => padY + innerH - (v / maxVal) * innerH

  const salesPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.total)}`).join(' ')
  const areaPath = `${salesPath} L${px(data.length - 1)},${H} L${padX},${H} Z`
  const tooltipLeft = (i) => `${(px(i) / W) * 100}%`

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H, overflow: 'visible' }}>
        <defs>
          <linearGradient id="hourlySalesAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.14" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hourlySalesAreaGrad)" />
        <path d={salesPath} fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.hour} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            <circle cx={px(i)} cy={py(d.total)} r={12} fill="transparent" />
            <circle cx={px(i)} cy={py(d.total)} r={hovered === i ? 5 : 3} fill="white" stroke={primaryColor} strokeWidth="2" />
          </g>
        ))}
      </svg>

      {hovered !== null && (
        <div
          className="absolute -top-16 pointer-events-none z-10"
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
            <div>{data[hovered].hour}</div>
            <div className="mt-0.5">{formatIDR(data[hovered].total)}</div>
            <div className="text-emerald-400 font-semibold mt-0.5">{data[hovered].count} transaksi</div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-1 gap-0.5">
        {data.map((d) => (
          <span key={d.hour} className="text-[8px] text-slate-400 font-semibold truncate max-w-[3rem] sm:max-w-none text-center flex-1">
            {d.hour}
          </span>
        ))}
      </div>
    </div>
  )
}

