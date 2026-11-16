import { createContext, useContext, useMemo, useState } from "react"
import { seedUsers } from "../data/seed"

const STORAGE_USERS = "hf_users"
const STORAGE_SESSION = "hf_session"

const AuthContext = createContext(null)

function loadUsers() {
  const raw = localStorage.getItem(STORAGE_USERS)
  if (raw) return JSON.parse(raw)
  localStorage.setItem(STORAGE_USERS, JSON.stringify(seedUsers))
  return seedUsers
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers)
  const [currentUser, setCurrentUser] = useState(() => {
    const id = localStorage.getItem(STORAGE_SESSION)
    if (!id) return null
    return loadUsers().find((user) => user.id === id) ?? null
  })

  const persistUsers = (next) => {
    setUsers(next)
    localStorage.setItem(STORAGE_USERS, JSON.stringify(next))
  }

  const login = (email, password) => {
    const user = users.find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password,
    )
    if (!user) return { ok: false, error: "Email or password is incorrect." }
    if (!user.active) return { ok: false, error: "This account has been suspended." }
    setCurrentUser(user)
    localStorage.setItem(STORAGE_SESSION, user.id)
    return { ok: true, user }
  }

  const register = (payload) => {
    if (users.some((item) => item.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, error: "An account with this email already exists." }
    }
    const user = {
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      phone: payload.phone,
      active: true,
    }
    persistUsers([...users, user])
    setCurrentUser(user)
    localStorage.setItem(STORAGE_SESSION, user.id)
    return { ok: true, user }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_SESSION)
  }

  const updateUser = (id, patch) => {
    const next = users.map((user) => (user.id === id ? { ...user, ...patch } : user))
    persistUsers(next)
    if (currentUser?.id === id) setCurrentUser({ ...currentUser, ...patch })
  }

  const value = useMemo(
    () => ({ users, currentUser, login, register, logout, updateUser }),
    [users, currentUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
