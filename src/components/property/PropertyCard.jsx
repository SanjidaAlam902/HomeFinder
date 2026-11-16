import { Bath, BedDouble, Heart, MapPin, Maximize2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useAppData } from "../../context/AppDataContext"
import { useAuth } from "../../context/AuthContext"
import { formatBdt } from "../../lib/format"

export default function PropertyCard({ listing }) {
  const { currentUser } = useAuth()
  const { mySavedIds, toggleSaved } = useAppData()
  const saved = mySavedIds.includes(listing.id)

  return (
    <article className="group overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-stone-200/80 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <Link to={`/property/${listing.id}`}>
          <img src={listing.images[0]} alt={listing.title} className="h-48 w-full object-cover" />
        </Link>
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold">
          {listing.type}
        </span>
        {currentUser?.role === "seeker" && (
          <button
            type="button"
            onClick={() => toggleSaved(listing.id)}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95"
            aria-label={saved ? "Remove from saved" : "Save listing"}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : "text-stone-600"}`} />
          </button>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="font-display text-lg leading-snug text-ink">{formatBdt(listing.rent)}</p>
          <p className="text-xs text-muted">
            Per month · {listing.serviceChargeIncluded ? "Service charge included" : "Service charge excluded"}
          </p>
        </div>
        <Link to={`/property/${listing.id}`} className="block font-semibold leading-snug hover:text-brand-700">
          {listing.title}
        </Link>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="h-4 w-4" />
          Block {listing.block} · Bashundhara R/A
        </p>
        <div className="flex gap-4 text-xs text-stone-600">
          <span className="flex items-center gap-1">
            <BedDouble className="h-4 w-4" /> {listing.bedrooms} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-4 w-4" /> {listing.bathrooms} bath
          </span>
          <span className="flex items-center gap-1">
            <Maximize2 className="h-4 w-4" /> {listing.sizeSqft} sft
          </span>
        </div>
      </div>
    </article>
  )
}
