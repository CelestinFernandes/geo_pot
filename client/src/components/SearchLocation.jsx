import { useState } from "react"

const SearchLocation = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a location to search.")
      return
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      if (data.length === 0) {
        setError("No results found for this location.")
      } else {
        const firstResult = data[0]
        onSearch([Number.parseFloat(firstResult.lat), Number.parseFloat(firstResult.lon)], firstResult.display_name)
      }
    } catch (error) {
      console.error("Search error:", error)
      setError("Failed to fetch search results. Please try again.")
    }
  }

  return (
    <div className="search-container">
      <div className="search-input-group">
        <input
          type="text" placeholder="Search Location"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setError("")
          }}
          onBeforeInput={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} className="search-icon-button">🔍</button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  )
}
export default SearchLocation