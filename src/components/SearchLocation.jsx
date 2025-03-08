import React, { useState } from 'react';
import L from 'leaflet';

const SearchLocation = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      // Clear previous errors
      setError('');

      // Try to parse coordinates directly
      const coordRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
      if (coordRegex.test(query)) {
        const [lat, lng] = query.split(',').map(Number);
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
          throw new Error('Invalid coordinates (Lat: -90 to 90, Lng: -180 to 180)');
        }
        onSearch([lat, lng], query);
        return;
      }

      // Geocode using OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Location not found');
      }

      const firstResult = data[0];
      onSearch([parseFloat(firstResult.lat), parseFloat(firstResult.lon)], firstResult.display_name);
    } catch (err) {
      setError(err.message || 'Failed to find location. Please try again.');
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter address or coordinates (lat,lng)"
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch}>Search</button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default SearchLocation;