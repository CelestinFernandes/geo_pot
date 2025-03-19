"use client"
import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import SearchLocation from "./SearchLocation"

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/images/marker-icon-2x.png",
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
})

// Create custom icons
const createIcon = (emoji) =>
  L.divIcon({
    className: "custom-icon",
    html: `<div style="font-size: 32px;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

const MapComponent = forwardRef(({ capturedPhotos = [], onDeleteLastPhoto, onDeletePhoto }, ref) => {
  const [markers, setMarkers] = useState([])
  const [selectedType, setSelectedType] = useState("crack")
  const [mapCenter] = useState([19.125, 72.9])
  const mapRef = useRef()

  const icons = {
    crack: createIcon("🚧"),
    pothole: createIcon("⚠️"),
    photo: createIcon("📷"),
    search: createIcon("📍"),
  }

  useImperativeHandle(ref, () => ({
    flyToLocation: (location) => {
      if (mapRef.current) mapRef.current.setView(location, 16)
    },
  }))

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (!e.originalEvent.propagatedFromMarker) {
          setMarkers((prev) => [
            ...prev,
            {
              position: [e.latlng.lat, e.latlng.lng],
              type: selectedType,
              id: Date.now(),
            },
          ])
        }
      },
    })
    return null
  }

  const handleSearchResult = (coords, displayName) => {
    const map = mapRef.current
    map.setView(coords, 16)

    const tempMarker = L.marker(coords, { icon: icons.search })
      .addTo(map)
      .bindPopup(`<b>Search Result:</b><br>${displayName}`)
      .openPopup()

    setTimeout(() => map.removeLayer(tempMarker), 5000)
  }

  const deleteMarker = useCallback((id) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id))
  }, [])

  const deleteLastMarker = useCallback(() => {
    if (capturedPhotos.length > 0) {
      onDeleteLastPhoto()
    } else {
      setMarkers((prev) => prev.slice(0, -1))
    }
  }, [capturedPhotos.length, onDeleteLastPhoto])

  return (
    <div className="map-container">
      <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} tap={false} ref={mapRef}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <MapClickHandler />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={icons[marker.type]}
            eventHandlers={{
              click: (e) => e.originalEvent.view.L.DomEvent.stopPropagation(e),
            }}
          >
            <Popup>
              <b>{marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}</b>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.nativeEvent.stopImmediatePropagation()
                  deleteMarker(marker.id)
                }}
              >
                Delete
              </button>
            </Popup>
          </Marker>
        ))}

        {capturedPhotos.map((photo) => (
          <Marker key={`photo-${photo.id}`} position={photo.location} icon={icons.photo}>
            <Popup>
              <div className="photo-popup">
                <img
                  src={photo.image || "/placeholder.svg"}
                  alt="Captured"
                  style={{ width: "150px", height: "auto", marginBottom: "8px" }}
                />
                <p>
                  <b>Photo captured at:</b>
                </p>
                <p>Lat: {photo.location[0].toFixed(6)}</p>
                <p>Lng: {photo.location[1].toFixed(6)}</p>
                <p>{photo.timestamp}</p>
                <button onClick={() => onDeletePhoto(photo.id)}>Delete</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="map-controls">
        <SearchLocation onSearch={handleSearchResult} />
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="crack">🚧 Crack</option>
          <option value="pothole">⚠️ Pothole</option>
        </select>
        <button onClick={deleteLastMarker}>🗑️ Last</button>
        <button onClick={() => setMarkers([])}>🧹 All</button>
      </div>
    </div>
  )
})

export default MapComponent

