"use client"

import { useState } from "react"
const SearchLocation = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState("")

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value)
    setError("") // Clear any previous errors
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a location to search.")
      return
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSearchResults(data)

      if (data.length === 0) {
        setError("No results found for this location.")
      } else {
        // Take the first result and pass it to the parent component
        const firstResult = data[0]
        const coords = [Number.parseFloat(firstResult.lat), Number.parseFloat(firstResult.lon)]
        const displayName = firstResult.display_name
        onSearch(coords, displayName)
      }
    } catch (error) {
      console.error("Search error:", error)
      setError("Failed to fetch search results. Please try again.")
    }
  }

  return (
    <div className="search-container">
      <input type="text" placeholder="Search Location" value={searchQuery} onChange={handleInputChange} />
      <button onClick={handleSearch}>Search</button>
      {error && <div className="error-message">{error}</div>}
    </div>
  )
}

export default SearchLocation