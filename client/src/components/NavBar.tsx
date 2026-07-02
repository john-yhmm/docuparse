import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Upload', path: '/upload' },
  { label: 'Invoices', path: '/invoices' },
]

export default function NavBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { setToken } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    setToken(null)
    navigate('/login')
  }

  function handleNav(path: string) {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-lg font-semibold text-gray-800">DocuParse</span>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`text-sm transition-colors cursor-pointer ${
                  pathname === path
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="hidden md:block text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Sign out
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-1 text-gray-500 hover:text-gray-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 px-6 py-2 flex flex-col">
          {NAV_LINKS.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`text-left py-2.5 text-sm transition-colors cursor-pointer ${
                pathname === path
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="text-left py-2.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer border-t border-gray-100 mt-1"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
