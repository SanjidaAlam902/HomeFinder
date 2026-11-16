import { ArrowRight, Building2, ShieldCheck, MapPinned } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import PropertyCard from "../components/property/PropertyCard"
import { useAppData } from "../context/AppDataContext"
import { BASHUNDHARA_BLOCKS, PROPERTY_TYPES } from "../lib/format"

export default function Home() {
  const navigate = useNavigate()
  const { publicListings } = useAppData()
  const featured = publicListings.filter((item) => item.featured)
  const [search, setSearch] = useState({
    block: "",
    type: "",
    maxRent: "",
    bedrooms: "",
  })

  const onSearch = (event) => {
    event.preventDefault()
    const params = new URLSearchParams()
    Object.entries(search).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    navigate(`/browse?${params.toString()}`)
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1800&q=80"
          alt="Residential buildings"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/55 to-stone-950/25" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-200">
            Bashundhara Residential Area
          </p>
          <h1 className="max-w-2xl font-display text-4xl text-white md:text-6xl">
            Find a flat, sub-let, or room that actually fits your life in Dhaka.
          </h1>
          <p className="mt-4 max-w-xl text-stone-200">
            Search Blocks A–I with rent in BDT, bedroom count, and property type — built for students, job holders, and
            families.
          </p>

          <form
            onSubmit={onSearch}
            className="mt-8 grid gap-3 rounded-2xl bg-white/95 p-4 shadow-xl md:grid-cols-5 md:items-end"
          >
            <label className="text-sm">
              <span className="mb-1 block text-muted">Block</span>
              <select
                value={search.block}
                onChange={(event) => setSearch({ ...search, block: event.target.value })}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
              >
                <option value="">All blocks</option>
                {BASHUNDHARA_BLOCKS.map((block) => (
                  <option key={block} value={block}>
                    Block {block}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Type</span>
              <select
                value={search.type}
                onChange={(event) => setSearch({ ...search, type: event.target.value })}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
              >
                <option value="">Any</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Max rent (BDT)</span>
              <input
                type="number"
                min="0"
                placeholder="e.g. 25000"
                value={search.maxRent}
                onChange={(event) => setSearch({ ...search, maxRent: event.target.value })}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Bedrooms</span>
              <select
                value={search.bedrooms}
                onChange={(event) => setSearch({ ...search, bedrooms: event.target.value })}
                className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-xl bg-brand-700 py-2.5 font-semibold text-white hover:bg-brand-800"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        {[
          {
            icon: MapPinned,
            title: "Block-level search",
            text: "Filter by Bashundhara blocks A–I and see listings on an OpenStreetMap view.",
          },
          {
            icon: Building2,
            title: "Local listing types",
            text: "Flats, family apartments, sub-lets, bachelor accommodation, and single rooms.",
          },
          {
            icon: ShieldCheck,
            title: "Verified before it goes live",
            text: "Owner listings stay pending until an admin approves them for public search.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl bg-paper p-5 ring-1 ring-stone-200">
            <item.icon className="mb-3 h-6 w-6 text-brand-700" />
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl">Featured in Bashundhara</h2>
            <p className="text-sm text-muted">Approved listings with rent shown per month in BDT</p>
          </div>
          <Link to="/browse" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  )
}
