"use client"
import { useState, useRef, useEffect } from "react"

const CameraComponent = ({ onPhotoCapture }) => {
  const [hasPermission, setHasPermission] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [annotatedImage, setAnnotatedImage] = useState(null) // State for storing annotated image
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Get current location
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by this browser.")
        return
      }

      setLocationError(null)
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation([position.coords.latitude, position.coords.longitude]),
        (error) => setLocationError("Unable to retrieve your location. Please enable location services."),
        { enableHighAccuracy: true },
      )
    }

    getLocation()
    const locationInterval = setInterval(getLocation, 10000)
    return () => clearInterval(locationInterval)
  }, [])

  // Handle video stream initialization
  useEffect(() => {
    const initializeVideo = async () => {
      if (!isCameraActive || !videoRef.current || videoRef.current.srcObject) return

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })

        streamRef.current = stream
        videoRef.current.srcObject = stream
        videoRef.current.play().catch((error) => console.error("Error playing video stream:", error))
      } catch (err) {
        console.error("Error accessing camera:", err)
        setHasPermission(false)
        setIsCameraActive(false)
      }
    }

    initializeVideo()
  }, [isCameraActive])

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const startCamera = () => {
    if (hasPermission === false) return

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsCameraActive(true)
    setHasPermission(null)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
    setHasPermission(null)
  }

  const capturePhoto = async () => {
    if (!currentLocation) {
      alert("Location not available. Please enable location services and try again.")
      return
    }

    if (!videoRef.current || !streamRef.current) {
      alert("Camera not ready. Please try again.")
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
    const base64Image = imageDataUrl.split(",")[1]; // Get base64 string

    // Send photo to backend for detection
    try {
      const response = await fetch('http://localhost:5000/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      const result = await response.json();
      console.log(result.detections); // Log the detections to see results

      // Set the annotated image to display it
      setAnnotatedImage(`data:image/jpeg;base64,${result.annotated_image}`);

      // After getting results, you can display them or handle further
      onPhotoCapture(imageDataUrl, currentLocation);

      const successMessage = document.createElement("div")
      successMessage.className = "capture-success"
      successMessage.textContent = "Photo captured successfully!"
      document.body.appendChild(successMessage)

      setTimeout(() => {
        document.body.removeChild(successMessage)
        setIsCapturing(false)
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      alert("Failed to send photo for detection.");
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <div className="camera-component">
      {locationError && <div className="location-error">{locationError}</div>}

      {!isCameraActive ? (
        <div className="camera-inactive">
          <button className="camera-button" onClick={startCamera}> 📷 Open Camera </button>
          <p className="camera-info">Click to open camera and capture your current location</p>
        </div>
      ) : (
        <div className="camera-active">
          <video ref={videoRef} autoPlay playsInline className="camera-preview" muted />
          <div className="camera-controls">
            <button className="capture-button" onClick={capturePhoto} disabled={isCapturing || !currentLocation}>
              {isCapturing ? "Processing..." : "Take Photo"}
            </button>
            <button className="close-camera" onClick={stopCamera}> Close Camera </button>
          </div>
          {currentLocation && (
            <div className="location-info">
              <p> Current Location: {currentLocation[0].toFixed(15)}, {currentLocation[1].toFixed(15)} </p>
            </div>
          )}
        </div>
      )}
      {/* Display the annotated image if available */}
      {annotatedImage && (
        <div className="annotated-image-container">
          <h3>Detection Results:</h3>
          <img src={annotatedImage} alt="Annotated Result" className="annotated-image" />
        </div>
      )}
    </div>
  )
}

export default CameraComponent