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

const MapComponent = forwardRef(({ capturedPhotos = [], onDeleteLastPhoto, onDeletePhoto }, ref) => {
  const [markers, setMarkers] = useState([])
  const [selectedType, setSelectedType] = useState("crack")
  const [mapCenter] = useState([19.125, 72.9])
  const mapRef = useRef()

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    flyToLocation: (location) => {
      if (mapRef.current) {
        mapRef.current.setView(location, 16)
      }
    },
  }))

  // Custom icons
  const crackIcon = L.divIcon({
    className: "custom-icon",
    html: '<div style="color: #2ecc71; font-size: 32px;">🚧</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

  const potholeIcon = L.divIcon({
    className: "custom-icon",
    html: '<div style="color: #e74c3c; font-size: 32px;">⚠️</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

  const photoIcon = L.divIcon({
    className: "custom-icon",
    html: '<div style="color: #3498db; font-size: 32px;">📷</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })

  // Handle map click
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const newMarker = {
          position: [e.latlng.lat, e.latlng.lng],
          type: selectedType,
          id: Date.now(),
        }
        setMarkers((prev) => [...prev, newMarker])
      },
    })
    return null
  }

  // Handle search results
  const handleSearchResult = (coords, displayName) => {
    const map = mapRef.current
    map.setView(coords, 16)

    // Add temporary marker
    const tempMarker = L.marker(coords, {
      icon: L.divIcon({
        className: "search-marker",
        html: '<div style="color: #3498db; font-size: 32px;">📍</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    }).addTo(map)

    tempMarker.bindPopup(`<b>Search Result:</b><br>${displayName}`).openPopup()

    // Remove after 5 seconds
    setTimeout(() => map.removeLayer(tempMarker), 5000)
  }

  // Delete markers functions
  const deleteMarker = useCallback((id) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id))
  }, [])

  const deleteLastMarker = useCallback(() => {
    // If there are photo markers, delete the last one first
    if (capturedPhotos.length > 0) {
      onDeleteLastPhoto()
    } else {
      // Otherwise delete the last regular marker
      setMarkers((prev) => prev.slice(0, -1))
    }
  }, [capturedPhotos.length, onDeleteLastPhoto])

  const deleteAllMarkers = useCallback(() => {
    setMarkers([])
  }, [])

  return (
    <div className="map-container">
      <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} tap={false} ref={mapRef}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <MapClickHandler />

        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position} icon={marker.type === "crack" ? crackIcon : potholeIcon}>
            <Popup>
              <b>{marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}</b>
              <button onClick={() => deleteMarker(marker.id)}>Delete</button>
            </Popup>
          </Marker>
        ))}

        {/* Photo markers */}
        {capturedPhotos.map((photo) => (
          <Marker key={`photo-${photo.id}`} position={photo.location} icon={photoIcon}>
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

      {/* Controls */}
      <div className="map-controls">
        <SearchLocation onSearch={handleSearchResult} />
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ marginBottom: "10px" }}>
          <option value="crack">🚧 Crack</option>
          <option value="pothole">⚠️ Pothole</option>
        </select>
        <button onClick={deleteLastMarker}>🗑️ Delete Last</button>
        <button onClick={deleteAllMarkers}>🧹 Clear All</button>
      </div>
    </div>
  )
})
export default MapComponent