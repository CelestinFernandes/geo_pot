import React, { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchLocation from './SearchLocation';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

const MapComponent = () => {
  const [markers, setMarkers] = useState([]);
  const [selectedType, setSelectedType] = useState('crack');
  const [mapCenter] = useState([19.125, 72.9]);
  const mapRef = useRef();

  // Custom icons
  const crackIcon = L.divIcon({
    className: 'custom-icon',
    html: '<div style="color: #2ecc71; font-size: 32px;">🚧</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  const potholeIcon = L.divIcon({
    className: 'custom-icon',
    html: '<div style="color: #e74c3c; font-size: 32px;">⚠️</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // Handle map click
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const newMarker = {
          position: [e.latlng.lat, e.latlng.lng],
          type: selectedType,
          id: Date.now()
        };
        setMarkers(prev => [...prev, newMarker]);
      }
    });
    return null;
  };

  // Handle search results
  const handleSearchResult = (coords, displayName) => {
    const map = mapRef.current;
    map.setView(coords, 16);
    
    // Add temporary marker
    const tempMarker = L.marker(coords, {
      icon: L.divIcon({
        className: 'search-marker',
        html: '<div style="color: #3498db; font-size: 32px;">📍</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map);
    
    tempMarker.bindPopup(`<b>Search Result:</b><br>${displayName}`).openPopup();
    
    // Remove after 5 seconds
    setTimeout(() => map.removeLayer(tempMarker), 5000);
  };

  // Delete markers functions
  const deleteMarker = useCallback((id) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  }, []);

  const deleteLastMarker = useCallback(() => {
    setMarkers(prev => prev.slice(0, -1));
  }, []);

  const deleteAllMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        tap={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <MapClickHandler />
        
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={marker.type === 'crack' ? crackIcon : potholeIcon}
          >
            <Popup>
              <b>{marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}</b>
              <button onClick={() => deleteMarker(marker.id)}>Delete</button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Controls */}
      <div className="map-controls">
        <SearchLocation onSearch={handleSearchResult} />
        <select 
          value={selectedType} 
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ marginBottom: '10px' }}
        >
          <option value="crack">🚧 Crack</option>
          <option value="pothole">⚠️ Pothole</option>
        </select>
        <button onClick={deleteLastMarker}>🗑️ Delete Last</button>
        <button onClick={deleteAllMarkers}>🧹 Clear All</button>
      </div>
    </div>
  );
};

export default MapComponent;