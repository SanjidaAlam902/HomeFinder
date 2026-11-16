import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAppData } from "../../context/AppDataContext"
import { useAuth } from "../../context/AuthContext"

export default function InquiryForm({ listing }) {
  const { currentUser } = useAuth()
  const { addInquiry } = useAppData()
  const navigate = useNavigate()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    message: `Assalamu alaikum. I am interested in “${listing.title}” in Block ${listing.block}. Is it still available?`,
  })

  const onSubmit = (event) => {
    event.preventDefault()
    if (!currentUser) {
      navigate("/login", { state: { from: `/property/${listing.id}` } })
      return
    }
    addInquiry({
      listingId: listing.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      message: form.message,
    })
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-brand-50 p-5 text-sm text-brand-800">
        Inquiry sent. The owner can reply from their dashboard. Check your inquiry history after you log in as a
        property seeker.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-paper p-5 shadow-sm ring-1 ring-stone-200">
      <h3 className="font-semibold">Contact owner / send inquiry</h3>
      <input
        required
        placeholder="Your name"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
      />
      <input
        required
        placeholder="Mobile (e.g. 017xx-xxxxxx)"
        value={form.phone}
        onChange={(event) => setForm({ ...form, phone: event.target.value })}
        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
      />
      <textarea
        required
        rows={4}
        value={form.message}
        onChange={(event) => setForm({ ...form, message: event.target.value })}
        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
      />
      <button type="submit" className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white">
        {currentUser ? "Send inquiry" : "Login to send inquiry"}
      </button>
    </form>
  )
}
