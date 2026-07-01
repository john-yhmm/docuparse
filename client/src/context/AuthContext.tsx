import { createContext, useContext, useState, ReactNode } from 'react'
import apiClient from '../api/client'

interface AuthContextType {
  token: string | null
  setToken: (token: string | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)

  function setToken(t: string | null) {
    setTokenState(t)
    if (t) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${t}`
    } else {
      delete apiClient.defaults.headers.common['Authorization']
    }
  }

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
