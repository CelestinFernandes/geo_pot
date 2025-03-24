"use client"
import { useState, useRef } from "react"
import MapComponent from "./components/MapComponent"
import CameraComponent from "./components/CameraComponent"
import PhotoGallery from "./components/PhotoGallery"
import "./App.css"

function App() {
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const mapRef = useRef(null)

  const handlePhotoCapture = (photoData, location, photoId, hasDetections) => {
    const newPhoto = {
      id: photoId,
      image: photoData,
      location,
      timestamp: new Date().toLocaleString(),
      type: 'photo',
      showMarker: !hasDetections // Show marker only if no detections
    }

    setCapturedPhotos((prev) => {
      // Prevent duplicates
      const exists = prev.some(photo => photo.id === photoId)
      return exists ? prev : [...prev, newPhoto]
    })

    if (mapRef.current && location) {
      mapRef.current.flyToLocation(location)
    }
  }

  const hideCameraMarker = (photoId) => {
    setCapturedPhotos(prev => 
      prev.map(photo => 
        photo.id === photoId ? { ...photo, showMarker: false } : photo
      )
    )
  }

  return (
    <div className="app-container">
      <div className="map-section">
        <MapComponent ref={mapRef}
          capturedPhotos={capturedPhotos.filter(photo => photo.showMarker)}
          onDeleteLastPhoto={() => setCapturedPhotos((prev) => prev.slice(0, -1))}
          onDeletePhoto={(photoId) => setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== photoId))}
        />
      </div>

      <div className="content-section">
        <h2>Capture Location & Photo</h2>
        <p>Take a photo to mark the Pothole/Type of Crack</p>
        <CameraComponent 
          onPhotoCapture={handlePhotoCapture}
          mapRef={mapRef}
          onHideCameraMarker={hideCameraMarker}
        />
        <PhotoGallery
          photos={capturedPhotos}
          onDeletePhoto={(photoId) => setCapturedPhotos((prev) => prev.filter((photo) => photo.id !== photoId))}
        />
      </div>
    </div>
  )
}
export default App