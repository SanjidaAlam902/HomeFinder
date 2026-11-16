import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "seeker",
  })

  const onSubmit = (event) => {
    event.preventDefault()
    if (form.password.length < 6) {
      setError("Use at least 6 characters for the password.")
      return
    }
    const result = register(form)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(result.user.role === "owner" ? "/dashboard" : "/browse")
  }

  return (
    <div className="grid min-h-[calc(100svh-8rem)] md:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl bg-paper p-8 ring-1 ring-stone-200">
          <h1 className="font-display text-3xl">Create an account</h1>
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
          />
          <input
            required
            placeholder="Mobile number"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
          />
          <fieldset className="space-y-2 rounded-xl bg-sand p-3 text-sm">
            <legend className="px-1 font-medium">I am a</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={form.role === "seeker"}
                onChange={() => setForm({ ...form, role: "seeker" })}
              />
              Property seeker (student, job holder, or family)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                checked={form.role === "owner"}
                onChange={() => setForm({ ...form, role: "owner" })}
              />
              Owner / agent
            </label>
          </fieldset>
          <button type="submit" className="w-full rounded-xl bg-brand-700 py-2.5 font-semibold text-white">
            Register
          </button>
          <p className="text-center text-sm text-muted">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-brand-700">
              Login
            </Link>
          </p>
        </form>
      </div>
      <div className="relative hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-950/45 p-10 text-white">
          <p className="font-display text-4xl">List a flat or find a seat in Bashundhara.</p>
        </div>
      </div>
    </div>
  )
}
