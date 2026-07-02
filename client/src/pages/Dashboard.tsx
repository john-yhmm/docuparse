import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import NavBar from '../components/NavBar'

interface DashboardData {
  total_spend: number
  invoice_count: number
  top_vendors: { vendor_name: string; total: number }[]
  monthly_breakdown: { month: string; total: number }[]
}

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function formatMonth(yyyyMM: string) {
  const [year, month] = yyyyMM.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

function BarChart({ data }: { data: { month: string; total: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-gray-400">No data yet.</p>

  const max = Math.max(...data.map((d) => d.total))
  const chartH = 120
  const barW = 32
  const gap = 12
  const labelH = 20
  const totalW = data.length * (barW + gap) - gap

  return (
    <svg width={totalW} height={chartH + labelH} className="overflow-visible">
      {data.map((d, i) => {
        const barH = max > 0 ? Math.max(4, (d.total / max) * chartH) : 4
        const x = i * (barW + gap)
        const y = chartH - barH
        return (
          <g key={d.month}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} className="fill-blue-500" />
            <text
              x={x + barW / 2}
              y={chartH + labelH - 4}
              textAnchor="middle"
              className="fill-gray-500 text-[10px]"
              fontSize={10}
            >
              {formatMonth(d.month)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient
      .get<DashboardData>('/api/dashboard')
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load dashboard data.'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
            {error}
          </p>
        )}

        {!data && !error && (
          <p className="text-sm text-gray-400">Loading…</p>
        )}

        {data && (
          <div className="space-y-8">
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Spend</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.total_spend)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Invoices Processed</p>
                <p className="text-3xl font-bold text-gray-900">{data.invoice_count}</p>
              </div>
            </div>

            {/* Monthly breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-5">Monthly Spend</h3>
              <div className="overflow-x-auto">
                <BarChart data={data.monthly_breakdown} />
              </div>
            </div>

            {/* Top vendors */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Vendors</h3>
              {data.top_vendors.length === 0 ? (
                <p className="text-sm text-gray-400">No vendor data yet.</p>
              ) : (
                <ul className="space-y-3">
                  {data.top_vendors.map((v, i) => {
                    const maxTotal = data.top_vendors[0].total
                    const pct = maxTotal > 0 ? (v.total / maxTotal) * 100 : 0
                    return (
                      <li key={v.vendor_name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">
                            <span className="text-gray-400 mr-2">{i + 1}.</span>
                            {v.vendor_name}
                          </span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(v.total)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
