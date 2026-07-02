import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import NavBar from '../components/NavBar'

interface Invoice {
  id: number
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  vendor_name: string | null
  customer_name: string | null
  subtotal: number | null
  tax: number | null
  discount: number | null
  total: number
  currency: string | null
  created_at: string
}

interface Filters {
  vendor: string
  date_from: string
  date_to: string
  amount_min: string
  amount_max: string
}

const EMPTY_FILTERS: Filters = {
  vendor: '',
  date_from: '',
  date_to: '',
  amount_min: '',
  amount_max: '',
}

function formatCurrency(n: number | null, currency?: string | null) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 2,
  })
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return s
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    fetchInvoices(applied)
  }, [applied])

  async function fetchInvoices(f: Filters) {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (f.vendor) params.vendor = f.vendor
      if (f.date_from) params.date_from = f.date_from
      if (f.date_to) params.date_to = f.date_to
      if (f.amount_min) params.amount_min = f.amount_min
      if (f.amount_max) params.amount_max = f.amount_max

      const { data } = await apiClient.get<Invoice[]>('/api/invoices', { params })
      setInvoices(data)
    } catch {
      setError('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (applied.vendor) params.vendor = applied.vendor
      if (applied.date_from) params.date_from = applied.date_from
      if (applied.date_to) params.date_to = applied.date_to
      if (applied.amount_min) params.amount_min = applied.amount_min
      if (applied.amount_max) params.amount_max = applied.amount_max

      const { data } = await apiClient.get('/api/invoices/export', {
        params,
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'invoices.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setApplied({ ...filters })
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
  }

  const hasFilters = Object.values(applied).some(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Invoices</h2>

        {/* Filters */}
        <form
          onSubmit={handleApply}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          <input
            type="text"
            placeholder="Vendor"
            value={filters.vendor}
            onChange={(e) => setFilters((f) => ({ ...f, vendor: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="From date"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="To date"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Min amount"
            value={filters.amount_min}
            min={0}
            onChange={(e) => setFilters((f) => ({ ...f, amount_min: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max amount"
            value={filters.amount_max}
            min={0}
            onChange={(e) => setFilters((f) => ({ ...f, amount_max: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="col-span-2 sm:col-span-3 lg:col-span-5 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Apply filters
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <p className="text-sm text-gray-400 px-6 py-8">Loading…</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-gray-400 px-6 py-8">
              {hasFilters ? 'No invoices match your filters.' : 'No invoices yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice #</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600">{inv.invoice_number || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{inv.vendor_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {exporting ? 'Exporting…' : 'Export CSV'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
