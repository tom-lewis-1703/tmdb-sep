import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPopularMovies, searchMovies, getImageUrl } from '../services/tmdb'
import './Home.css'

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    getPopularMovies()
      .then((data) => setMovies(data.results))
      .catch((err) => console.error('Failed to load movies:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setIsSearching(true)
    try {
      const data = await searchMovies(searchQuery)
      setMovies(data.results)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearching(false)
    setLoading(true)
    getPopularMovies()
      .then((data) => setMovies(data.results))
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search films..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit">Search</button>
        {isSearching && (
          <button type="button" className="clear-btn" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      <div className="section-header">
        <h2>{isSearching ? `Results for "${searchQuery}"` : 'Now Showing'}</h2>
        <div className="header-line" />
      </div>

      {loading ? (
        <div className="movie-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="movie-card skeleton">
              <div className="movie-poster skeleton-poster" />
              <div className="movie-info">
                <div className="skeleton-text" />
                <div className="skeleton-text short" />
              </div>
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <p className="no-results">No films found.</p>
      ) : (
        <div className="movie-grid">
          {movies.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id} className="movie-card">
              <div className="movie-poster">
                {movie.poster_path ? (
                  <img
                    src={getImageUrl(movie.poster_path, 'w342')}
                    alt={movie.title}
                  />
                ) : (
                  <div className="no-poster">No Poster</div>
                )}
                <div className="poster-overlay">
                  <span className="play-btn">▶</span>
                </div>
                <div className="rating-badge">
                  {movie.vote_average?.toFixed(1)}
                </div>
              </div>
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <span className="movie-year">{movie.release_date?.slice(0, 4) || '—'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home
