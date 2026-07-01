import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB = 10

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setToken } = useAuth()
  const navigate = useNavigate()

  function validate(f: File): string {
    if (!ACCEPTED_TYPES.includes(f.type)) return 'Only JPEG, PNG, WEBP, and PDF files are allowed.'
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB}MB.`
    return ''
  }

  function pickFile(f: File) {
    const err = validate(f)
    if (err) { setError(err); return }
    setError('')
    setFile(f)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) pickFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const form = new FormData()
      form.append('invoice', file)
      const { data } = await apiClient.post('/api/upload', form)
      navigate('/results', { state: { invoice: data.data } })
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      setError(msg ?? 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setToken(null)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">DocuParse</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload Invoice</h2>
        <p className="text-sm text-gray-500 mb-8">
          Drop a file below or click to browse. We support JPEG, PNG, WEBP, and PDF (max 10 MB).
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {file ? (
              <div>
                <p className="text-sm font-medium text-blue-600">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700">Drag & drop your invoice here</p>
                <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? 'Extracting data…' : 'Extract Invoice Data'}
        </button>

        {loading && (
          <p className="mt-3 text-xs text-gray-500 text-center">
            This may take a few seconds while Claude analyzes your invoice.
          </p>
        )}
      </main>
    </div>
  )
}
