import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("seeker@homefinder.bd")
  const [password, setPassword] = useState("demo123")
  const [error, setError] = useState("")

  const onSubmit = (event) => {
    event.preventDefault()
    const result = login(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const fallback =
      result.user.role === "admin" ? "/admin" : result.user.role === "owner" ? "/dashboard" : "/browse"
    navigate(location.state?.from || fallback)
  }

  return (
    <div className="grid min-h-[calc(100svh-8rem)] md:grid-cols-2">
      <div className="relative hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-800/50 p-10 text-white">
          <p className="font-display text-4xl">Welcome back to Bashundhara.</p>
          <p className="mt-3 max-w-sm text-brand-50">Log in to save flats, message owners, or manage your listings.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl bg-paper p-8 ring-1 ring-stone-200">
          <h1 className="font-display text-3xl">Login</h1>
          <p className="text-sm text-muted">
            Demo: seeker@homefinder.bd · owner@homefinder.bd · admin@homefinder.bd (password: demo123)
          </p>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            placeholder="Email"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
            placeholder="Password"
          />
          <button type="submit" className="w-full rounded-xl bg-brand-700 py-2.5 font-semibold text-white">
            Continue
          </button>
          <p className="text-center text-sm text-muted">
            New here?{" "}
            <Link to="/register" className="font-semibold text-brand-700">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
