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

  function handleLogout() {
    setToken(null)
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <span className="text-lg font-semibold text-gray-800">DocuParse</span>
        <nav className="flex items-center gap-6">
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
      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
      >
        Sign out
      </button>
    </header>
  )
}
