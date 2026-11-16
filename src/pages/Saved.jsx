import { Link } from "react-router-dom"
import PropertyCard from "../components/property/PropertyCard"
import { useAppData } from "../context/AppDataContext"
import { useAuth } from "../context/AuthContext"

export default function Saved() {
  const { currentUser } = useAuth()
  const { listings, inquiries, mySavedIds } = useAppData()
  const saved = listings.filter((item) => mySavedIds.includes(item.id) && item.status === "approved")
  const mine = inquiries.filter((item) => item.seekerId === currentUser.id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl">Saved homes & inquiries</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((listing) => (
          <PropertyCard key={listing.id} listing={listing} />
        ))}
        {saved.length === 0 && <p className="text-muted">You have not saved any listings yet.</p>}
      </div>
      <h2 className="mt-12 font-display text-2xl">Your inquiries</h2>
      <div className="mt-4 space-y-3">
        {mine.length === 0 && <p className="text-sm text-muted">No inquiries sent yet.</p>}
        {mine.map((item) => {
          const listing = listings.find((row) => row.id === item.listingId)
          return (
            <article key={item.id} className="rounded-2xl bg-paper p-4 text-sm ring-1 ring-stone-200">
              <p className="font-semibold">{listing?.title ?? "Listing"}</p>
              <p className="mt-1 text-muted">{item.message}</p>
              {item.reply && (
                <p className="mt-2 rounded-xl bg-brand-50 p-3 text-brand-900">
                  <span className="font-medium">Owner reply: </span>
                  {item.reply}
                </p>
              )}
              {listing && (
                <Link to={`/property/${listing.id}`} className="mt-2 inline-block text-brand-700">
                  Open listing
                </Link>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
