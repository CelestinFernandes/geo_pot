"use client"

import { useState, useRef, useEffect } from "react"
const CameraComponent = ({ onPhotoCapture }) => {
  const [hasPermission, setHasPermission] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Get current location
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        setLocationError(null)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation([position.coords.latitude, position.coords.longitude])
          },
          (error) => {
            console.error("Error getting location:", error)
            setLocationError("Unable to retrieve your location. Please enable location services.")
          },
          { enableHighAccuracy: true },
        )
      } else {
        setLocationError("Geolocation is not supported by this browser.")
      }
    }

    getLocation()
    const locationInterval = setInterval(getLocation, 10000)

    return () => clearInterval(locationInterval)
  }, [])

  // Handle video stream when camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(error => {
        console.error("Error playing video stream:", error)
      })
    }
  }, [isCameraActive])

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })

      streamRef.current = stream
      setHasPermission(true)
      setIsCameraActive(true)
      
    } catch (err) {
      console.error("Error accessing camera:", err)
      setHasPermission(false)
    }
  }

  const startCamera = () => {
    if (hasPermission === null) {
      requestCameraPermission()
    } else if (hasPermission) {
      setIsCameraActive(true)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (!currentLocation) {
      alert("Location not available. Please enable location services and try again.")
      return
    }

    setIsCapturing(true)

    const canvas = document.createElement("canvas")
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageDataUrl = canvas.toDataURL("image/jpeg")
    onPhotoCapture(imageDataUrl, currentLocation)

    const successMessage = document.createElement("div")
    successMessage.className = "capture-success"
    successMessage.textContent = "Photo captured successfully!"
    document.body.appendChild(successMessage)

    setTimeout(() => {
      document.body.removeChild(successMessage)
      setIsCapturing(false)
    }, 2000)
  }

  return (
    <div className="camera-component">
      {locationError && <div className="location-error">{locationError}</div>}

      {!isCameraActive ? (
        <div className="camera-inactive">
          <button className="camera-button" onClick={startCamera}>
            📷 Open Camera
          </button>
          <p className="camera-info">Click to open camera and capture your current location</p>
        </div>
      ) : (
        <div className="camera-active">
          <video ref={videoRef} autoPlay playsInline className="camera-preview" />

          <div className="camera-controls">
            <button className="capture-button" onClick={capturePhoto} disabled={isCapturing || !currentLocation}>
              {isCapturing ? "Processing..." : "Take Photo"}
            </button>

            <button className="close-camera" onClick={stopCamera}>
              Close Camera
            </button>
          </div>

          {currentLocation && (
            <div className="location-info">
              <p>
                Current Location: {currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default CameraComponent