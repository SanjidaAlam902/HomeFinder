import L from "leaflet"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import { Link } from "react-router-dom"
import { formatBdt, MAP_CENTER } from "../../lib/format"

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function PropertyMap({ listings, heightClass = "h-[520px]" }) {
  return (
    <div className={`${heightClass} overflow-hidden rounded-2xl ring-1 ring-stone-200`}>
      <MapContainer center={MAP_CENTER} zoom={14} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((listing) => (
          <Marker key={listing.id} position={listing.coords} icon={defaultIcon}>
            <Popup>
              <strong>{listing.title}</strong>
              <div>Block {listing.block}</div>
              <div>{formatBdt(listing.rent)} / month</div>
              <Link to={`/property/${listing.id}`}>View details</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
