# HomeFinder — Bashundhara, Dhaka

Frontend prototype for a rental search platform focused on **Bashundhara Residential Area** (Blocks A–I). Built for CSE451 (Software Engineering) as a working UI for seekers, owners/agents, and admins.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- React Router
- Lucide icons
- Leaflet / React-Leaflet (OpenStreetMap), centered on Bashundhara

Data is stored in `localStorage` so dashboards, approvals, and inquiries work without a backend.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Property seeker | `seeker@homefinder.bd` | `demo123` |
| Owner / agent | `owner@homefinder.bd` | `demo123` |
| Admin | `admin@homefinder.bd` | `demo123` |

## Pages

- `/` — landing + block search
- `/browse` — filters, grid/map toggle
- `/property/:id` — gallery, utilities, deposit, inquiry form
- `/login` · `/register` — role selection
- `/saved` — seeker saved homes & inquiry history
- `/dashboard` — owner listings + add-property wizard
- `/admin` — stats, approve/reject, users, reports

Rents are shown in **BDT (৳) per month**, with service charge included/excluded language used throughout.
