import { Bath, BedDouble, Flag, Maximize2, Shield } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import PropertyMap from "../components/map/PropertyMap"
import ImageGallery from "../components/property/ImageGallery"
import InquiryForm from "../components/property/InquiryForm"
import { useAppData } from "../context/AppDataContext"
import { useAuth } from "../context/AuthContext"
import { formatBdt } from "../lib/format"

export default function PropertyDetails() {
  const { id } = useParams()
  const { listings, addReport } = useAppData()
  const { currentUser } = useAuth()
  const listing = listings.find((item) => item.id === id)
  const [reported, setReported] = useState(false)

  if (!listing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p>Listing not found.</p>
        <Link to="/browse" className="text-brand-700">
          Back to browse
        </Link>
      </div>
    )
  }

  if (listing.status !== "approved" && currentUser?.role !== "admin" && currentUser?.id !== listing.ownerId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p>This listing is not public yet.</p>
        <Link to="/browse" className="text-brand-700">
          Browse approved homes
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-muted">
        <Link to="/browse">Browse</Link> / Block {listing.block}
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">{listing.title}</h1>
          <p className="mt-1 text-muted">{listing.address}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl">{formatBdt(listing.rent)}</p>
          <p className="text-sm text-muted">Per month</p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <ImageGallery images={listing.images} title={listing.title} />
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-stone-200">{listing.type}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-stone-200">
              <BedDouble className="h-4 w-4" /> {listing.bedrooms} bedrooms
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-stone-200">
              <Bath className="h-4 w-4" /> {listing.bathrooms} bathrooms
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-stone-200">
              <Maximize2 className="h-4 w-4" /> {listing.sizeSqft} sft
            </span>
          </div>
          <section className="rounded-2xl bg-paper p-5 ring-1 ring-stone-200">
            <h2 className="font-semibold">About this home</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">{listing.description}</p>
          </section>
          <section className="grid gap-4 rounded-2xl bg-paper p-5 text-sm ring-1 ring-stone-200 md:grid-cols-2">
            <div>
              <p className="font-semibold">Rent & deposit</p>
              <ul className="mt-2 space-y-1 text-muted">
                <li>Monthly rent: {formatBdt(listing.rent)}</li>
                <li>
                  Service charge:{" "}
                  {listing.serviceChargeIncluded
                    ? "Included"
                    : `Excluded (${formatBdt(listing.serviceCharge)} / month)`}
                </li>
                <li>Security deposit: {listing.depositMonths} month(s) of rent</li>
                <li>Available from: {listing.availableFrom}</li>
                <li>Furnishing: {listing.furnishing}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Utilities</p>
              <ul className="mt-2 space-y-1 text-muted">
                <li>Gas: {listing.gas}</li>
                <li>Electricity: {listing.electricity}</li>
                <li>{listing.utilitiesNote}</li>
              </ul>
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((item) => (
                <span key={item} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800">
                  {item}
                </span>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Location · Block {listing.block}</h2>
            <PropertyMap listings={[listing]} heightClass="h-[320px]" />
          </section>
        </div>
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <InquiryForm listing={listing} />
          <div className="rounded-2xl bg-white p-4 text-sm ring-1 ring-stone-200">
            <p className="flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-brand-700" />
              Status: {listing.status}
            </p>
            <p className="mt-2 text-muted">Never pay a booking amount before visiting the flat in person.</p>
          </div>
          {currentUser && !reported && (
            <button
              type="button"
              onClick={() => {
                addReport({
                  listingId: listing.id,
                  reason: "User report from details page",
                  details: "Please review this listing.",
                })
                setReported(true)
              }}
              className="inline-flex items-center gap-2 text-xs text-muted hover:text-rose-700"
            >
              <Flag className="h-3.5 w-3.5" /> Report this listing
            </button>
          )}
          {reported && <p className="text-xs text-muted">Report submitted to admin.</p>}
        </div>
      </div>
    </div>
  )
}
