import { createContext, useContext, useMemo, useState } from "react"
import { seedInquiries, seedListings, seedReports } from "../data/seed"
import { useAuth } from "./AuthContext"

const STORAGE_LISTINGS = "hf_listings"
const STORAGE_INQUIRIES = "hf_inquiries"
const STORAGE_REPORTS = "hf_reports"
const STORAGE_SAVED = "hf_saved"

const AppDataContext = createContext(null)

function load(key, seed) {
  const raw = localStorage.getItem(key)
  if (raw) return JSON.parse(raw)
  localStorage.setItem(key, JSON.stringify(seed))
  return seed
}

export function AppDataProvider({ children }) {
  const { currentUser } = useAuth()
  const [listings, setListings] = useState(() => load(STORAGE_LISTINGS, seedListings))
  const [inquiries, setInquiries] = useState(() => load(STORAGE_INQUIRIES, seedInquiries))
  const [reports, setReports] = useState(() => load(STORAGE_REPORTS, seedReports))
  const [savedIds, setSavedIds] = useState(() => {
    const map = load(STORAGE_SAVED, {})
    return map
  })

  const persistListings = (next) => {
    setListings(next)
    localStorage.setItem(STORAGE_LISTINGS, JSON.stringify(next))
  }

  const publicListings = listings.filter((item) => item.status === "approved" && item.available)

  const addListing = (payload) => {
    const listing = {
      ...payload,
      id: crypto.randomUUID(),
      ownerId: currentUser.id,
      status: "pending",
      available: true,
      featured: false,
    }
    persistListings([listing, ...listings])
    return listing
  }

  const updateListing = (id, patch) => {
    persistListings(listings.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const deleteListing = (id) => {
    persistListings(listings.filter((item) => item.id !== id))
  }

  const addInquiry = (payload) => {
    const inquiry = {
      id: crypto.randomUUID(),
      ...payload,
      seekerId: currentUser?.id ?? null,
      createdAt: new Date().toISOString(),
      reply: "",
      replyAt: null,
    }
    const next = [inquiry, ...inquiries]
    setInquiries(next)
    localStorage.setItem(STORAGE_INQUIRIES, JSON.stringify(next))
    return inquiry
  }

  const replyToInquiry = (id, reply) => {
    const next = inquiries.map((item) =>
      item.id === id ? { ...item, reply, replyAt: new Date().toISOString() } : item,
    )
    setInquiries(next)
    localStorage.setItem(STORAGE_INQUIRIES, JSON.stringify(next))
  }

  const addReport = (payload) => {
    const report = {
      id: crypto.randomUUID(),
      ...payload,
      reporterId: currentUser?.id ?? null,
      status: "open",
      createdAt: new Date().toISOString(),
    }
    const next = [report, ...reports]
    setReports(next)
    localStorage.setItem(STORAGE_REPORTS, JSON.stringify(next))
  }

  const updateReport = (id, patch) => {
    const next = reports.map((item) => (item.id === id ? { ...item, ...patch } : item))
    setReports(next)
    localStorage.setItem(STORAGE_REPORTS, JSON.stringify(next))
  }

  const toggleSaved = (listingId) => {
    if (!currentUser) return
    const mine = savedIds[currentUser.id] ?? []
    const nextMine = mine.includes(listingId) ? mine.filter((id) => id !== listingId) : [...mine, listingId]
    const next = { ...savedIds, [currentUser.id]: nextMine }
    setSavedIds(next)
    localStorage.setItem(STORAGE_SAVED, JSON.stringify(next))
  }

  const mySavedIds = currentUser ? (savedIds[currentUser.id] ?? []) : []

  const value = useMemo(
    () => ({
      listings,
      publicListings,
      inquiries,
      reports,
      mySavedIds,
      addListing,
      updateListing,
      deleteListing,
      addInquiry,
      replyToInquiry,
      addReport,
      updateReport,
      toggleSaved,
    }),
    [listings, inquiries, reports, savedIds, currentUser],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider")
  return ctx
}
