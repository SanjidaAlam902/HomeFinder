import { LayoutGrid, Map } from "lucide-react"
import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import PropertyMap from "../components/map/PropertyMap"
import FilterSidebar from "../components/property/FilterSidebar"
import PropertyCard from "../components/property/PropertyCard"
import { useAppData } from "../context/AppDataContext"

const defaultFilters = {
  block: "",
  type: "",
  maxRent: 80000,
  bedrooms: "",
  bathrooms: "",
  sort: "newest",
}

export default function Browse() {
  const { publicListings } = useAppData()
  const [params] = useSearchParams()
  const [view, setView] = useState("grid")
  const [filters, setFilters] = useState({
    ...defaultFilters,
    block: params.get("block") ?? "",
    type: params.get("type") ?? "",
    maxRent: Number(params.get("maxRent") ?? 80000),
    bedrooms: params.get("bedrooms") ?? "",
  })

  const results = useMemo(() => {
    const next = publicListings.filter((listing) => {
      if (filters.block && listing.block !== filters.block) return false
      if (filters.type && listing.type !== filters.type) return false
      if (listing.rent > filters.maxRent) return false
      if (filters.bedrooms && listing.bedrooms < Number(filters.bedrooms)) return false
      if (filters.bathrooms && listing.bathrooms < Number(filters.bathrooms)) return false
      return true
    })
    if (filters.sort === "price-asc") next.sort((a, b) => a.rent - b.rent)
    if (filters.sort === "price-desc") next.sort((a, b) => b.rent - a.rent)
    return next
  }, [publicListings, filters])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Browse Bashundhara rentals</h1>
          <p className="text-sm text-muted">{results.length} approved listings match your filters</p>
        </div>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-stone-200">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
              view === "grid" ? "bg-brand-700 text-white" : "text-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> Grid
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
              view === "map" ? "bg-brand-700 text-white" : "text-muted"
            }`}
          >
            <Map className="h-4 w-4" /> Map
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <FilterSidebar filters={filters} setFilters={setFilters} onReset={() => setFilters(defaultFilters)} />
        {view === "map" ? (
          <PropertyMap listings={results} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {results.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
            {results.length === 0 && (
              <p className="col-span-full rounded-2xl bg-white p-8 text-center text-muted">
                No listings in this range. Try another block or raise the max rent.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}