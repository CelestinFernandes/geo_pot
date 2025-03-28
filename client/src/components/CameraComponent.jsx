import { useState, useRef, useEffect } from "react"

const CameraComponent = ({ onPhotoCapture, mapRef, onHideCameraMarker }) => {
  const [hasPermission, setHasPermission] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [annotatedImage, setAnnotatedImage] = useState(null)
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [videoDetections, setVideoDetections] = useState([])
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState(null)
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const videoProcessingRef = useRef(null)
  const videoStreamRef = useRef(null)

  // Geolocation setup
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

  // Camera initialization
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

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      stopVideoProcessing()
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
    stopVideoProcessing()
  }

  // Video processing functions
  const toggleVideoMode = async () => {
    if (isVideoMode) {
      stopVideoProcessing()
    } else {
      await startVideoProcessing()
    }
    setIsVideoMode(!isVideoMode)
  }

  const startVideoProcessing = async () => {
    setIsProcessingVideo(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }
      })
      videoStreamRef.current = stream
      
      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      recordedChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(videoBlob)
        setRecordedVideo(videoUrl)
      }
      
      mediaRecorderRef.current.start()
      
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      
      videoProcessingRef.current = setInterval(async () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1]
        
        try {
          const response = await fetch('http://localhost:5000/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
          })
          
          const result = await response.json()
          setAnnotatedImage(`data:image/jpeg;base64,${result.annotated_image}`)
          setVideoDetections(result.detections)
          
          // Save video frame as image
          const photoId = Date.now()
          onPhotoCapture(
            `data:image/jpeg;base64,${result.annotated_image}`,
            currentLocation,
            `video-frame-${photoId}`,
            result.detections.length > 0
          )

          // Update map with detections
          if (result.detections.length > 0 && currentLocation) {
            result.detections.forEach((detection, index) => {
              const validTypes = ['Longitudinal', 'Transverse', 'Alligator', 'Pothole']
              if (!validTypes.includes(detection.type)) return

              const offset = index * 0.0001
              mapRef.current?.addDetectionMarker({
                position: [
                  currentLocation[0] + offset,
                  currentLocation[1] + offset
                ],
                type: detection.type,
                id: `${Date.now()}-${index}`,
                photoData: {
                  image: `data:image/jpeg;base64,${result.annotated_image}`,
                  location: currentLocation,
                  timestamp: new Date().toLocaleString()
                }
              })
            })
          }
        } catch (error) {
          console.error('Detection error:', error)
        }
      }, 1000) // Process frame every second
      
    } catch (error) {
      console.error('Error starting video processing:', error)
      setIsProcessingVideo(false)
    }
  }

  const stopVideoProcessing = () => {
    setIsProcessingVideo(false)
    setIsVideoMode(false)
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    
    if (videoProcessingRef.current) clearInterval(videoProcessingRef.current)
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop())
    }
    setVideoDetections([])
  }

  const saveRecordedVideo = () => {
    if (recordedVideo && currentLocation) {
      const videoId = Date.now()
      onPhotoCapture(
        recordedVideo,
        currentLocation,
        `video-${videoId}`,
        videoDetections.length > 0
      )
      setRecordedVideo(null)
    }
  }

  // Photo capture function
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

    try {
      const canvas = document.createElement("canvas")
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageDataUrl = canvas.toDataURL("image/jpeg")
      const base64Image = imageDataUrl.split(",")[1]
      const photoId = Date.now()

      const response = await fetch('http://localhost:5000/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      })

      const result = await response.json()
      setAnnotatedImage(`data:image/jpeg;base64,${result.annotated_image}`)

      onPhotoCapture(
        `data:image/jpeg;base64,${result.annotated_image}`,
        currentLocation,
        photoId,
        result.detections.length > 0
      )

      if (result.detections.length > 0) {
        onHideCameraMarker(photoId)
        result.detections.forEach((detection, index) => {
          const validTypes = ['Longitudinal', 'Transverse', 'Alligator', 'Pothole']
          if (!validTypes.includes(detection.type)) return

          const offset = index * 0.0001
          mapRef.current?.addDetectionMarker({
            position: [
              currentLocation[0] + offset,
              currentLocation[1] + offset
            ],
            type: detection.type,
            id: `${Date.now()}-${index}`,
            photoData: {
              image: `data:image/jpeg;base64,${result.annotated_image}`,
              location: currentLocation,
              timestamp: new Date().toLocaleString()
            }
          })
        })
      }

      const successMessage = document.createElement("div")
      successMessage.className = "capture-success"
      successMessage.textContent = result.detections.length > 0 
        ? "Defects detected!" 
        : "Photo captured successfully!"
      document.body.appendChild(successMessage)

      setTimeout(() => {
        document.body.removeChild(successMessage)
        setIsCapturing(false)
      }, 2000)

    } catch (error) {
      console.error('Error:', error)
      alert("Failed to process detection")
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="camera-component">
      {locationError && <div className="location-error">{locationError}</div>}

      {!isCameraActive ? (
        <div className="camera-inactive">
          <button className="camera-button" onClick={startCamera} disabled={isProcessingVideo}
          > 📷 Open Camera </button>
          <p className="camera-info">Click to open camera and capture your current location</p>
        </div>
      ) : (
        <div className="camera-active">
          <video ref={videoRef} autoPlay playsInline className="camera-preview" muted />
          
          <div className="camera-controls">
            <button 
              className={`video-mode-toggle ${isVideoMode ? 'active' : ''}`}
              onClick={toggleVideoMode}
              disabled={isCapturing}
            >
              {isVideoMode ? 'Stop Video Recording' : 'Start Video Recording'}
            </button>

            <button 
              className="capture-button" 
              onClick={capturePhoto} 
              disabled={isCapturing || !currentLocation || isVideoMode}
            >
              {isCapturing ? "Processing..." : "Take Photo"}
            </button>
            
            <button className="close-camera" onClick={stopCamera} disabled={isProcessingVideo}> Close Camera </button>
          </div>
          {currentLocation && (
            <div className="location-info">
              <p>Current Location: {currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}</p>
            </div>
          )}

          {(isVideoMode || annotatedImage) && (
            <div className="annotated-image-container">
              <h3>{isVideoMode ? "Live Detection Preview:" : "Detection Results:"}</h3>
              <img src={annotatedImage} alt="Annotated Result" className="annotated-image"/>
            </div>
          )}

          {isVideoMode && videoDetections.length > 0 && (
            <div className="video-detections"> <h4>Live Detections:</h4>
              <ul>
                {videoDetections.map((detection, index) => (
                  <li key={index}> {detection.label} ({detection.confidence}) </li>
                ))}
              </ul>
            </div>
          )}

          {recordedVideo && (
            <div className="video-preview"> <h4>Recorded Video:</h4>
              <video controls src={recordedVideo} style={{ width: '100%' }} />
              <button className="save-video-button" onClick={saveRecordedVideo}>
                Save Video to Gallery </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default CameraComponent