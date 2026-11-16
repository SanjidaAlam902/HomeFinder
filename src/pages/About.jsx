export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl">About HomeFinder</h1>
      <p className="mt-4 text-muted">
        HomeFinder is a CSE451 Software Engineering prototype for finding residential rentals in Bashundhara
        Residential Area, Dhaka. It focuses on search, map location, listing verification, and communication between
        seekers and owners — not on buying property or paying rent online.
      </p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-stone-700">
        <p>
          Existing platforms often mix listings from all over the city, with unclear service charges and unverified
          photos. This frontend keeps the catalogue local: Blocks A through I, prices in BDT, and familiar terms such as
          sub-let, bachelor accommodation, and security deposit.
        </p>
        <p>
          Property seekers can filter, view maps, save listings, and send inquiries. Owners submit listings that stay
          pending until an administrator approves them. Admins can also manage users and reported content.
        </p>
        <p>
          This build is frontend-only with local demo data. A later sprint can connect Node.js + Express + MySQL as
          described in the project proposal.
        </p>
      </div>
    </div>
  )
}
