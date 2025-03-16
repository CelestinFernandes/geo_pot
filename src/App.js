"use client"
import { useState, useRef } from "react"
import MapComponent from "./components/MapComponent"
import CameraComponent from "./components/CameraComponent"
import PhotoGallery from "./components/PhotoGallery"
import "./App.css"

function App() {
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const mapRef = useRef(null)

  const handlePhotoCapture = (photoData, location) => {
    const newPhoto = {
      id: Date.now(),
      image: photoData,
      location: location,
      timestamp: new Date().toLocaleString(),
    }

    setCapturedPhotos((prev) => [...prev, newPhoto])

    // Scroll to map + focus on new location
    if (mapRef.current && location) {
      mapRef.current.flyToLocation(location)
    }
  }

  const handleDeleteLastPhoto = () => {
    setCapturedPhotos((prev) => prev.slice(0, -1))
  }

  const handleDeletePhoto = (photoId) => {
    setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
  }

  return (
    <div className="app-container">
      <div className="map-section">
        <MapComponent
          ref={mapRef}
          capturedPhotos={capturedPhotos}
          onDeleteLastPhoto={handleDeleteLastPhoto}
          onDeletePhoto={handleDeletePhoto}
        />
      </div>

      <div className="content-section">
        <h2>Capture Location & Photo</h2>
        <p>Take a photo to mark your current location on the map</p>

        <CameraComponent onPhotoCapture={handlePhotoCapture} />

        <PhotoGallery photos={capturedPhotos} onDeletePhoto={handleDeletePhoto} />
      </div>
    </div>
  )
}
export default App