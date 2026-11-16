import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAppData } from "../../context/AppDataContext"
import { useAuth } from "../../context/AuthContext"
import { formatBdt } from "../../lib/format"
import AddPropertyModal from "./AddPropertyModal"

const tabs = ["active", "pending", "rejected", "inquiries"]

export default function OwnerDashboard() {
  const { currentUser } = useAuth()
  const { listings, inquiries, addListing, deleteListing, replyToInquiry } = useAppData()
  const [tab, setTab] = useState("active")
  const [showAdd, setShowAdd] = useState(false)
  const [replies, setReplies] = useState({})

  const mine = listings.filter((item) => item.ownerId === currentUser.id)
  const byStatus = useMemo(
    () => ({
      active: mine.filter((item) => item.status === "approved"),
      pending: mine.filter((item) => item.status === "pending"),
      rejected: mine.filter((item) => item.status === "rejected"),
    }),
    [mine],
  )
  const myListingIds = new Set(mine.map((item) => item.id))
  const myInquiries = inquiries.filter((item) => myListingIds.has(item.listingId))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Owner dashboard</h1>
          <p className="text-sm text-muted">Manage Bashundhara listings and tenant inquiries</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Add new property
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              tab === item ? "bg-brand-700 text-white" : "bg-white ring-1 ring-stone-200"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab !== "inquiries" && (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-paper ring-1 ring-stone-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-sand/70">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th>Block</th>
                <th>Rent</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {byStatus[tab].map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/property/${item.id}`} className="font-medium hover:text-brand-700">
                      {item.title}
                    </Link>
                    {item.rejectReason && <p className="text-xs text-rose-700">{item.rejectReason}</p>}
                  </td>
                  <td>{item.block}</td>
                  <td>{formatBdt(item.rent)}</td>
                  <td className="capitalize">{item.status}</td>
                  <td>
                    <button type="button" onClick={() => deleteListing(item.id)} className="text-xs text-rose-700">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {byStatus[tab].length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No listings in this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "inquiries" && (
        <div className="mt-6 space-y-4">
          {myInquiries.map((item) => {
            const listing = listings.find((row) => row.id === item.listingId)
            return (
              <article key={item.id} className="rounded-2xl bg-paper p-4 ring-1 ring-stone-200">
                <p className="font-semibold">{listing?.title}</p>
                <p className="text-xs text-muted">
                  {item.name} · {item.phone} · {item.email}
                </p>
                <p className="mt-2 text-sm">{item.message}</p>
                {item.reply ? (
                  <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm">{item.reply}</p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={replies[item.id] ?? ""}
                      onChange={(event) => setReplies({ ...replies, [item.id]: event.target.value })}
                      placeholder="Write a reply"
                      className="flex-1 rounded-xl border px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => replyToInquiry(item.id, replies[item.id])}
                      className="rounded-xl bg-brand-700 px-3 py-2 text-sm text-white"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </article>
            )
          })}
          {myInquiries.length === 0 && <p className="text-muted">No inquiries yet.</p>}
        </div>
      )}

      {showAdd && (
        <AddPropertyModal
          onClose={() => setShowAdd(false)}
          onSubmit={(payload) => {
            addListing(payload)
            setShowAdd(false)
            setTab("pending")
          }}
        />
      )}
    </div>
  )
}
