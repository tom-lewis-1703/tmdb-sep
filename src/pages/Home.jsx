import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getPopularMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  searchMovies,
  searchPeople,
  getImageUrl,
} from '../services/tmdb'
import './Home.css'

function getRatingInfo(rating) {
  if (rating >= 8) return { color: '#4ade80', label: '🔥 ' + rating.toFixed(1) }
  if (rating >= 7) return { color: '#a3e635', label: '👍 ' + rating.toFixed(1) }
  if (rating >= 5.5) return { color: '#facc15', label: rating.toFixed(1) }
  if (rating >= 4) return { color: '#fb923c', label: '👎 ' + rating.toFixed(1) }
  return { color: '#f87171', label: '💀 ' + rating.toFixed(1) }
}

function getMovieBadges(movie, index, category) {
  const badges = []
  if (category === 'trending' && index < 3) badges.push({ text: '🔥 Trending', type: 'trending' })
  if (movie.vote_average >= 8) badges.push({ text: '⭐ Must Watch', type: 'top' })
  return badges
}

const CATEGORIES = [
  { key: 'trending', label: 'Trending', fetcher: getTrendingMovies },
  { key: 'popular', label: 'Popular', fetcher: getPopularMovies },
  { key: 'top_rated', label: 'Top Rated', fetcher: getTopRatedMovies },
  { key: 'now_playing', label: 'In Cinemas', fetcher: getNowPlayingMovies },
]

function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [movies, setMovies] = useState([])
  const [trendingMovies, setTrendingMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [activeCategory, setActiveCategory] = useState('trending')
  const [heroIndex, setHeroIndex] = useState(0)

  // autocomplete state
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const debounceRef = useRef(null)
  const searchWrapperRef = useRef(null)

  // close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // debounced autocomplete
  const handleInputChange = useCallback((value) => {
    setSearchQuery(value)
    setSelectedSuggestion(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const [movieData, personData] = await Promise.all([
          searchMovies(value),
          searchPeople(value),
        ])
        const movieResults = movieData.results
          .filter((m) => m.poster_path)
          .slice(0, 3)
          .map((m) => ({ ...m, resultType: 'movie' }))
        const personResults = personData.results
          .filter((p) => p.profile_path)
          .slice(0, 2)
          .map((p) => ({ ...p, resultType: 'person' }))
        const combined = [...movieResults, ...personResults]
        setSuggestions(combined)
        setShowSuggestions(combined.length > 0)
      } catch (err) {
        console.error('Autocomplete failed:', err)
      }
    }, 300)
  }, [])

  // keyboard nav for suggestions
  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      e.preventDefault()
      const selected = suggestions[selectedSuggestion]
      const path = selected.resultType === 'person'
        ? `/person/${selected.id}`
        : `/movie/${selected.id}`
      navigate(path)
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // load trending for the hero on mount
  useEffect(() => {
    getTrendingMovies()
      .then((data) => {
        const filtered = data.results.filter((m) => m.backdrop_path && m.overview)
        setTrendingMovies(filtered.slice(0, 5))
        setMovies(data.results)
      })
      .catch((err) => console.error('Failed to load trending:', err))
      .finally(() => setLoading(false))
  }, [])

  // rotate hero every 6 seconds
  useEffect(() => {
    if (trendingMovies.length === 0) return
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % trendingMovies.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [trendingMovies])

  const handleCategoryChange = async (key) => {
    if (isSearching) return
    setActiveCategory(key)
    setLoading(true)
    const cat = CATEGORIES.find((c) => c.key === key)
    try {
      const data = await cat.fetcher()
      setMovies(data.results)
    } catch (err) {
      console.error('Failed to load category:', err)
    } finally {
      setLoading(false)
    }
  }

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
    setActiveCategory('trending')
    setLoading(true)
    getTrendingMovies()
      .then((data) => setMovies(data.results))
      .finally(() => setLoading(false))
  }

  const heroMovie = trendingMovies[heroIndex]

  return (
    <div className="home-page">
      {/* Hero Section */}
      {heroMovie && !isSearching && (
        <div className="hero">
          <div className="hero-backdrop">
            {trendingMovies.map((m, i) => (
              <img
                key={m.id}
                src={getImageUrl(m.backdrop_path, 'original')}
                alt=""
                className={`hero-bg-img ${i === heroIndex ? 'active' : ''}`}
              />
            ))}
            <div className="hero-gradient" />
          </div>
          <div className="hero-content">
            <span className="hero-badge">★ Trending Now</span>
            <h1 className="hero-title">{heroMovie.title}</h1>
            <div className="hero-meta">
              <span className="hero-rating">★ {heroMovie.vote_average?.toFixed(1)}</span>
              <span className="hero-dot">·</span>
              <span>{heroMovie.release_date?.slice(0, 4)}</span>
            </div>
            <p className="hero-overview">{heroMovie.overview?.slice(0, 180)}...</p>
            <Link to={`/movie/${heroMovie.id}`} className="hero-cta">
              View Details
            </Link>
          </div>
          <div className="hero-indicators">
            {trendingMovies.map((_, i) => (
              <button
                key={i}
                className={`hero-dot-btn ${i === heroIndex ? 'active' : ''}`}
                onClick={() => setHeroIndex(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <form className="search-bar" onSubmit={(e) => { handleSearch(e); setShowSuggestions(false) }} ref={searchWrapperRef}>
        <div className="search-input-wrapper">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search films..."
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          />
          {showSuggestions && (
            <div className="autocomplete-dropdown">
              {suggestions.map((s, i) => (
                <Link
                  to={s.resultType === 'person' ? `/person/${s.id}` : `/movie/${s.id}`}
                  key={`${s.resultType}-${s.id}`}
                  className={`autocomplete-item ${i === selectedSuggestion ? 'selected' : ''}`}
                  onClick={() => setShowSuggestions(false)}
                >
                  {s.resultType === 'person' ? (
                    <>
                      <img
                        src={getImageUrl(s.profile_path, 'w92')}
                        alt=""
                        className="autocomplete-poster autocomplete-poster--person"
                      />
                      <div className="autocomplete-info">
                        <span className="autocomplete-title">{s.name}</span>
                        <span className="autocomplete-year">{s.known_for_department || 'Artist'}</span>
                      </div>
                      <span className="autocomplete-type-badge">Person</span>
                    </>
                  ) : (
                    <>
                      <img
                        src={getImageUrl(s.poster_path, 'w92')}
                        alt=""
                        className="autocomplete-poster"
                      />
                      <div className="autocomplete-info">
                        <span className="autocomplete-title">{s.title}</span>
                        <span className="autocomplete-year">{s.release_date?.slice(0, 4) || '—'}</span>
                      </div>
                      {s.vote_average > 0 && (
                        <span className="autocomplete-rating">★ {s.vote_average.toFixed(1)}</span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
        <button type="submit">Search</button>
        {isSearching && (
          <button type="button" className="clear-btn" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      {/* Category tabs */}
      {!isSearching && (
        <div className="category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`cat-tab ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Section header */}
      <div className="section-header">
        <h2>
          {isSearching
            ? `Results for "${searchQuery}"`
            : CATEGORIES.find((c) => c.key === activeCategory)?.label}
        </h2>
        <div className="header-line" />
      </div>

      {/* Movie grid */}
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
          {movies.map((movie, index) => (
            <Link to={`/movie/${movie.id}`} key={movie.id} className="movie-card" style={{ animationDelay: `${index * 0.03}s` }}>
              <div className="movie-poster">
                {movie.poster_path ? (
                  <img
                    src={getImageUrl(movie.poster_path, 'w342')}
                    alt={movie.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="no-poster">No Poster</div>
                )}
                <div className="poster-overlay">
                  <span className="play-btn">▶</span>
                </div>
                {movie.vote_average > 0 && (
                  <div
                    className="rating-badge"
                    style={{
                      borderColor: getRatingInfo(movie.vote_average).color + '55',
                      color: getRatingInfo(movie.vote_average).color,
                    }}
                  >
                    {getRatingInfo(movie.vote_average).label}
                  </div>
                )}
                {getMovieBadges(movie, index, activeCategory).length > 0 && (
                  <div className="card-badges">
                    {getMovieBadges(movie, index, activeCategory).map((badge) => (
                      <span key={badge.type} className={`card-badge badge-${badge.type}`}>
                        {badge.text}
                      </span>
                    ))}
                  </div>
                )}
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
