import { X } from "lucide-react"
import { useState } from "react"
import { BLOCK_COORDS, BASHUNDHARA_BLOCKS, PROPERTY_TYPES } from "../../lib/format"

const empty = {
  title: "",
  type: "Flat",
  block: "C",
  address: "",
  rent: 25000,
  serviceCharge: 2000,
  serviceChargeIncluded: false,
  depositMonths: 2,
  bedrooms: 2,
  bathrooms: 2,
  sizeSqft: 1000,
  furnishing: "Semi-furnished",
  availableFrom: "Immediate",
  gas: "Piped gas available",
  electricity: "DESCO prepaid",
  utilitiesNote: "",
  amenitiesText: "Lift, Parking, Generator",
  description: "",
  imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80",
}

export default function AddPropertyModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(empty)

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const finish = () => {
    const coords = BLOCK_COORDS[form.block]
    onSubmit({
      title: form.title,
      type: form.type,
      block: form.block,
      address: form.address || `Block ${form.block}, Bashundhara R/A, Dhaka`,
      rent: Number(form.rent),
      serviceCharge: Number(form.serviceCharge),
      serviceChargeIncluded: form.serviceChargeIncluded,
      depositMonths: Number(form.depositMonths),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      sizeSqft: Number(form.sizeSqft),
      furnishing: form.furnishing,
      availableFrom: form.availableFrom,
      gas: form.gas,
      electricity: form.electricity,
      utilitiesNote: form.utilitiesNote,
      amenities: form.amenitiesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      description: form.description,
      images: [form.imageUrl],
      coords,
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-paper p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Add new property · step {step}/4</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <input
              required
              placeholder="Listing title"
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
            />
            <select value={form.type} onChange={(event) => update({ type: event.target.value })} className="w-full rounded-xl border px-3 py-2">
              {PROPERTY_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <select value={form.block} onChange={(event) => update({ block: event.target.value })} className="w-full rounded-xl border px-3 py-2">
              {BASHUNDHARA_BLOCKS.map((block) => (
                <option key={block} value={block}>
                  Block {block}
                </option>
              ))}
            </select>
            <input
              placeholder="Street address"
              value={form.address}
              onChange={(event) => update({ address: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min="1"
                value={form.bedrooms}
                onChange={(event) => update({ bedrooms: event.target.value })}
                className="rounded-xl border px-3 py-2"
                placeholder="Beds"
              />
              <input
                type="number"
                min="1"
                value={form.bathrooms}
                onChange={(event) => update({ bathrooms: event.target.value })}
                className="rounded-xl border px-3 py-2"
                placeholder="Baths"
              />
              <input
                type="number"
                min="50"
                value={form.sizeSqft}
                onChange={(event) => update({ sizeSqft: event.target.value })}
                className="rounded-xl border px-3 py-2"
                placeholder="Sft"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block text-sm">
              Monthly rent (BDT)
              <input
                type="number"
                value={form.rent}
                onChange={(event) => update({ rent: event.target.value })}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.serviceChargeIncluded}
                onChange={(event) => update({ serviceChargeIncluded: event.target.checked })}
              />
              Service charge included
            </label>
            <input
              type="number"
              value={form.serviceCharge}
              onChange={(event) => update({ serviceCharge: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Service charge if excluded"
            />
            <input
              type="number"
              value={form.depositMonths}
              onChange={(event) => update({ depositMonths: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Security deposit (months)"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <input
              value={form.gas}
              onChange={(event) => update({ gas: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Gas status"
            />
            <input
              value={form.electricity}
              onChange={(event) => update({ electricity: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Electricity status"
            />
            <textarea
              value={form.utilitiesNote}
              onChange={(event) => update({ utilitiesNote: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Utility notes"
            />
            <input
              value={form.amenitiesText}
              onChange={(event) => update({ amenitiesText: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Amenities, comma separated"
            />
            <textarea
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
              rows={4}
              placeholder="Description"
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Paste an image URL for this prototype (file upload can connect later).</p>
            <input
              value={form.imageUrl}
              onChange={(event) => update({ imageUrl: event.target.value })}
              className="w-full rounded-xl border px-3 py-2"
            />
            {form.imageUrl && <img src={form.imageUrl} alt="" className="h-40 w-full rounded-xl object-cover" />}
            <p className="rounded-xl bg-sand p-3 text-sm">
              {form.title || "Untitled"} · Block {form.block} · ৳{Number(form.rent).toLocaleString("en-BD")} / month. It
              will be submitted as <strong>Pending</strong> until an admin approves it.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className="text-sm text-muted">
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !form.title}
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button type="button" onClick={finish} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Submit for review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
