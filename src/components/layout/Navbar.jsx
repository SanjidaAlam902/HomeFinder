import { Heart, Menu, UserRound, X } from "lucide-react"
import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

const linkClass = ({ isActive }) =>
  `rounded-full px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-brand-700 text-white" : "text-stone-700 hover:bg-white/80"
  }`

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const dashboardPath =
    currentUser?.role === "admin" ? "/admin" : currentUser?.role === "owner" ? "/dashboard" : "/saved"

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-sm font-bold text-white">
            HF
          </span>
          <span>
            <span className="block font-display text-lg leading-none text-ink">HomeFinder</span>
            <span className="text-xs text-muted">Bashundhara, Dhaka</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/browse" className={linkClass}>
            Browse
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {currentUser ? (
            <>
              {currentUser.role === "seeker" && (
                <Link to="/saved" className="rounded-full p-2 text-stone-600 hover:bg-white" aria-label="Saved homes">
                  <Heart className="h-5 w-5" />
                </Link>
              )}
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium shadow-sm"
              >
                <UserRound className="h-4 w-4" />
                {currentUser.name.split(" ")[0]}
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate("/")
                }}
                className="rounded-full px-3 py-2 text-sm text-muted hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-white">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-stone-200 px-4 py-3 md:hidden">
          <NavLink to="/" className={linkClass} end onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/browse" className={linkClass} onClick={() => setOpen(false)}>
            Browse
          </NavLink>
          <NavLink to="/about" className={linkClass} onClick={() => setOpen(false)}>
            About
          </NavLink>
          {currentUser ? (
            <>
              <Link to={dashboardPath} className="block rounded-full px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <button
                type="button"
                className="block px-3 py-2 text-sm text-muted"
                onClick={() => {
                  logout()
                  setOpen(false)
                  navigate("/")
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1 rounded-full bg-white py-2 text-center text-sm" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-full bg-brand-700 py-2 text-center text-sm text-white"
                onClick={() => setOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
