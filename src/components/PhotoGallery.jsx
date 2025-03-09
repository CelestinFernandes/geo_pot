"use client"

const PhotoGallery = ({ photos, onDeletePhoto }) => {
  if (photos.length === 0) {
    return (
      <div className="photo-gallery">
        <h3>Recent Captures</h3>
        <p>No photos captured yet</p>
      </div>
    )
  }

  return (
    <div className="photo-gallery">
      <h3>Recent Captures</h3>
      <div className="gallery-grid">
        {photos.map((photo) => (
          <div key={photo.id} className="gallery-item">
            <img src={photo.image || "/placeholder.svg"} alt="Captured location" />
            <div className="gallery-info">
              <p>
                Lat: {photo.location[0].toFixed(6)}, Lng: {photo.location[1].toFixed(6)}
              </p>
              <p>{photo.timestamp}</p>
              <button className="delete-photo-btn" onClick={() => onDeletePhoto(photo.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default PhotoGallery