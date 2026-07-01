import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface LineItem {
  id?: number
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id?: number
  invoice_number: string
  invoice_date: string
  due_date: string
  vendor_name: string
  vendor_address: string
  vendor_email: string
  vendor_phone: string
  customer_name: string
  customer_address: string
  customer_email: string
  customer_phone: string
  subtotal: number
  tax: number
  discount: number
  total: number
  currency: string
  notes: string
  line_items: LineItem[]
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  )
}

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const raw = location.state?.invoice as Invoice | undefined

  const [invoice, setInvoice] = useState<Invoice | null>(raw ?? null)

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No invoice data found.</p>
          <button
            onClick={() => navigate('/upload')}
            className="text-blue-600 hover:underline text-sm cursor-pointer"
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    )
  }

  function setField(key: keyof Invoice, value: string) {
    setInvoice(prev => prev ? { ...prev, [key]: value } : prev)
  }

  function setLineItem(index: number, key: keyof LineItem, value: string) {
    setInvoice(prev => {
      if (!prev) return prev
      const items = prev.line_items.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [key]: key === 'description' ? value : Number(value) }
        if (key === 'quantity' || key === 'unit_price') {
          updated.total = Number(updated.quantity) * Number(updated.unit_price)
        }
        return updated
      })
      return { ...prev, line_items: items }
    })
  }

  function addLineItem() {
    setInvoice(prev => prev ? {
      ...prev,
      line_items: [...prev.line_items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    } : prev)
  }

  function removeLineItem(index: number) {
    setInvoice(prev => prev ? {
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    } : prev)
  }

  const currency = invoice.currency || 'USD'

  function fmt(n: number | string) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">DocuParse</h1>
        <button
          onClick={() => navigate('/upload')}
          className="text-sm text-blue-600 hover:underline cursor-pointer"
        >
          ← Upload another
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Extracted Invoice</h2>
          <p className="text-sm text-gray-500 mt-1">All fields are editable. Changes stay in your browser.</p>
        </div>

        {/* Invoice meta */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Invoice Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Invoice #" value={invoice.invoice_number} onChange={v => setField('invoice_number', v)} />
            <Field label="Currency" value={invoice.currency} onChange={v => setField('currency', v)} />
            <Field label="Invoice Date" value={invoice.invoice_date} onChange={v => setField('invoice_date', v)} type="text" />
            <Field label="Due Date" value={invoice.due_date} onChange={v => setField('due_date', v)} type="text" />
          </div>
        </section>

        {/* Vendor + Customer */}
        <div className="grid sm:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vendor</h3>
            <Field label="Name" value={invoice.vendor_name} onChange={v => setField('vendor_name', v)} />
            <Field label="Address" value={invoice.vendor_address} onChange={v => setField('vendor_address', v)} />
            <Field label="Email" value={invoice.vendor_email} onChange={v => setField('vendor_email', v)} />
            <Field label="Phone" value={invoice.vendor_phone} onChange={v => setField('vendor_phone', v)} />
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Customer</h3>
            <Field label="Name" value={invoice.customer_name} onChange={v => setField('customer_name', v)} />
            <Field label="Address" value={invoice.customer_address} onChange={v => setField('customer_address', v)} />
            <Field label="Email" value={invoice.customer_email} onChange={v => setField('customer_email', v)} />
            <Field label="Phone" value={invoice.customer_phone} onChange={v => setField('customer_phone', v)} />
          </section>
        </div>

        {/* Line items */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-3 w-1/2">Description</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Qty</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Unit Price</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 px-3">Total</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.line_items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => setLineItem(i, 'description', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => setLineItem(i, 'quantity', e.target.value)}
                        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={e => setLineItem(i, 'unit_price', e.target.value)}
                        className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700 tabular-nums">
                      {currency} {fmt(item.total)}
                    </td>
                    <td className="py-2 pl-2">
                      <button
                        onClick={() => removeLineItem(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer text-lg leading-none"
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addLineItem}
            className="mt-3 text-sm text-blue-600 hover:underline cursor-pointer"
          >
            + Add line item
          </button>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-100 pt-4 space-y-2">
            {[
              { label: 'Subtotal', key: 'subtotal' as keyof Invoice },
              { label: 'Tax', key: 'tax' as keyof Invoice },
              { label: 'Discount', key: 'discount' as keyof Invoice },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-end gap-4">
                <span className="text-sm text-gray-500 w-24 text-right">{label}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-400">{currency}</span>
                  <input
                    type="number"
                    value={invoice[key] as number}
                    onChange={e => setField(key, e.target.value)}
                    className="w-28 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-end gap-4 pt-2 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700 w-24 text-right">Total</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">{currency}</span>
                <input
                  type="number"
                  value={invoice.total}
                  onChange={e => setField('total', e.target.value)}
                  className="w-28 border border-gray-200 rounded px-2 py-1 text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Notes</h3>
          <textarea
            value={invoice.notes ?? ''}
            onChange={e => setField('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </section>
      </main>
    </div>
  )
}
