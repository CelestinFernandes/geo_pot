"use client"
import { useState, useRef } from "react"
import MapComponent from "./components/MapComponent"
import CameraComponent from "./components/CameraComponent"
import PhotoGallery from "./components/PhotoGallery"
import "./App.css"

function App() {
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const mapRef = useRef(null)

  const handlePhotoCapture = (photoData, location, detectedType) => {
    const newPhoto = {
      id: Date.now(),
      image: photoData,
      location,
      timestamp: new Date().toLocaleString(),
      type: detectedType || 'photo',
    }

    setCapturedPhotos((prev) => [...prev, newPhoto])

    // Focus on new location
    if (mapRef.current && location) {
      mapRef.current.flyToLocation(location)
    }
  }

  return (
    <div className="app-container">
      <div className="map-section">
        <MapComponent
          ref={mapRef}
          capturedPhotos={capturedPhotos}
          onDeleteLastPhoto={() => setCapturedPhotos((prev) => prev.slice(0, -1))}
          onDeletePhoto={(photoId) => setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== photoId))}
        />
      </div>

      <div className="content-section">
        <h2>Capture Location & Photo</h2>
        <p>Take a photo to mark your current location on the map</p>
        <CameraComponent onPhotoCapture={handlePhotoCapture} />
        <PhotoGallery
          photos={capturedPhotos}
          onDeletePhoto={(photoId) => setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== photoId))}
        />
      </div>
    </div>
  )
}
export default App