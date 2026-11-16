import { MapPin } from "lucide-react"
import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-xl">HomeFinder</p>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            Built for rentals in Bashundhara Residential Area — Blocks A through I, Dhaka, Bangladesh.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-muted">
            <Link to="/browse">Browse listings</Link>
            <Link to="/about">About the platform</Link>
            <Link to="/register">List a property</Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Local notes</p>
          <p className="mt-3 text-muted">
            Rents are shown in BDT (৳) per month. Always confirm service charge, gas, and security deposit with the
            owner before paying any advance.
          </p>
        </div>
      </div>
      <p className="border-t border-stone-100 py-4 text-center text-xs text-muted">
        CSE451 prototype · Not a payment or legal contract platform
      </p>
    </footer>
  )
}
