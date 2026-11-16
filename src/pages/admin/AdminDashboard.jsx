import { Building2, Clock, Flag, Users } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAppData } from "../../context/AppDataContext"
import { useAuth } from "../../context/AuthContext"
import { formatBdt } from "../../lib/format"

export default function AdminDashboard() {
  const { users, updateUser } = useAuth()
  const { listings, reports, updateListing, updateReport } = useAppData()
  const [tab, setTab] = useState("listings")
  const [rejectId, setRejectId] = useState("")
  const [reason, setReason] = useState("")

  const stats = [
    { label: "Total users", value: users.length, icon: Users },
    { label: "Total listings", value: listings.length, icon: Building2 },
    {
      label: "Pending approvals",
      value: listings.filter((item) => item.status === "pending").length,
      icon: Clock,
    },
    { label: "Open reports", value: reports.filter((item) => item.status === "open").length, icon: Flag },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl">Admin portal</h1>
      <p className="text-sm text-muted">Review listings, users, and reported content</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl bg-paper p-4 ring-1 ring-stone-200">
            <item.icon className="mb-2 h-5 w-5 text-brand-700" />
            <p className="font-display text-3xl">{item.value}</p>
            <p className="text-sm text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-2">
        {["listings", "users", "reports"].map((item) => (
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

      {tab === "listings" && (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-paper ring-1 ring-stone-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-sand/70">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th>Block</th>
                <th>Rent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/property/${item.id}`} className="font-medium hover:text-brand-700">
                      {item.title}
                    </Link>
                  </td>
                  <td>{item.block}</td>
                  <td>{formatBdt(item.rent)}</td>
                  <td className="capitalize">{item.status}</td>
                  <td className="space-x-2 py-3">
                    {item.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => updateListing(item.id, { status: "approved", available: true })}
                        className="text-brand-700"
                      >
                        Approve
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button type="button" onClick={() => setRejectId(item.id)} className="text-rose-700">
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectId && (
        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <p className="text-sm font-medium">Reject listing with a reason</p>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                updateListing(rejectId, { status: "rejected", available: false, rejectReason: reason })
                setRejectId("")
                setReason("")
              }}
              className="rounded-xl bg-rose-700 px-3 py-1.5 text-sm text-white"
            >
              Confirm reject
            </button>
            <button type="button" onClick={() => setRejectId("")} className="text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-paper ring-1 ring-stone-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-sand/70">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{user.name}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td>{user.active ? "Active" : "Suspended"}</td>
                  <td>
                    {user.role !== "admin" && (
                      <button
                        type="button"
                        onClick={() => updateUser(user.id, { active: !user.active })}
                        className="text-xs text-brand-700"
                      >
                        {user.active ? "Suspend" : "Reactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "reports" && (
        <div className="mt-4 space-y-3">
          {reports.map((item) => {
            const listing = listings.find((row) => row.id === item.listingId)
            return (
              <article key={item.id} className="rounded-2xl bg-paper p-4 text-sm ring-1 ring-stone-200">
                <p className="font-semibold">{item.reason}</p>
                <p className="text-muted">{item.details}</p>
                <p className="mt-1 text-xs">
                  Listing: {listing ? <Link to={`/property/${listing.id}`}>{listing.title}</Link> : item.listingId} ·{" "}
                  {item.status}
                </p>
                {item.status === "open" && (
                  <button
                    type="button"
                    onClick={() => updateReport(item.id, { status: "resolved" })}
                    className="mt-2 text-brand-700"
                  >
                    Mark resolved
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
