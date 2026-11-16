import { BASHUNDHARA_BLOCKS, formatBdt, PROPERTY_TYPES } from "../../lib/format"

export default function FilterSidebar({ filters, setFilters, onReset }) {
  return (
    <aside className="h-fit space-y-5 rounded-2xl bg-paper p-5 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <button type="button" onClick={onReset} className="text-xs text-brand-700 hover:underline">
          Reset
        </button>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Bashundhara block</span>
        <select
          value={filters.block}
          onChange={(event) => setFilters({ ...filters, block: event.target.value })}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
        >
          <option value="">All blocks (A–I)</option>
          {BASHUNDHARA_BLOCKS.map((block) => (
            <option key={block} value={block}>
              Block {block}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Property type</span>
        <select
          value={filters.type}
          onChange={(event) => setFilters({ ...filters, type: event.target.value })}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
        >
          <option value="">All types</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-muted">Max rent</span>
          <span className="font-medium">{formatBdt(filters.maxRent)}</span>
        </div>
        <input
          type="range"
          min="5000"
          max="80000"
          step="1000"
          value={filters.maxRent}
          onChange={(event) => setFilters({ ...filters, maxRent: Number(event.target.value) })}
          className="w-full"
        />
        <p className="text-xs text-muted">Per month, BDT</p>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Bedrooms</span>
        <select
          value={filters.bedrooms}
          onChange={(event) => setFilters({ ...filters, bedrooms: event.target.value })}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Bathrooms</span>
        <select
          value={filters.bathrooms}
          onChange={(event) => setFilters({ ...filters, bathrooms: event.target.value })}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
        >
          <option value="">Any</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block text-muted">Sort</span>
        <select
          value={filters.sort}
          onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Rent: low to high</option>
          <option value="price-desc">Rent: high to low</option>
        </select>
      </label>
    </aside>
  )
}
