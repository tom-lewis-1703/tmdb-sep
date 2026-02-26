import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getMovieDetails, getImageUrl } from '../services/tmdb'
import './MovieDetail.css'

function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMovieDetails(id)
      .then((data) => setMovie(data))
      .catch((err) => console.error('Failed to load movie:', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="movie-detail">
        <div className="detail-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="movie-detail">
        <p>Film not found.</p>
      </div>
    )
  }

  const trailer = movie.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  )
  const cast = movie.credits?.cast?.slice(0, 10) || []
  const directors = movie.credits?.crew?.filter((c) => c.job === 'Director') || []
  const similarMovies = movie.similar?.results?.filter((m) => m.poster_path)?.slice(0, 8) || []
  const backdropUrl = getImageUrl(movie.backdrop_path, 'original')
  const posterUrl = getImageUrl(movie.poster_path, 'w500')

  const hours = Math.floor(movie.runtime / 60)
  const mins = movie.runtime % 60
  const runtimeStr = movie.runtime > 0 ? `${hours}h ${mins}m` : null

  return (
    <div className="movie-detail">
      {/* Hero backdrop */}
      {backdropUrl && (
        <div className="detail-hero">
          <img src={backdropUrl} alt="" className="hero-image" />
          <div className="hero-fade" />
        </div>
      )}

      <div className="detail-content">
        <Link to="/" className="back-link">← Back</Link>

        <div className="detail-layout">
          <div className="detail-poster">
            {posterUrl ? (
              <img src={posterUrl} alt={movie.title} />
            ) : (
              <div className="no-poster-detail">No Poster</div>
            )}
          </div>

          <div className="detail-info">
            <div className="detail-meta-top">
              {movie.release_date && (
                <span className="meta-tag">{movie.release_date.slice(0, 4)}</span>
              )}
              {runtimeStr && <span className="meta-tag">{runtimeStr}</span>}
              {movie.vote_average > 0 && (
                <span className="meta-tag gold">★ {movie.vote_average.toFixed(1)}</span>
              )}
            </div>

            <h2>{movie.title}</h2>
            {movie.tagline && <p className="detail-tagline">{movie.tagline}</p>}

            {movie.genres?.length > 0 && (
              <div className="detail-genres">
                {movie.genres.map((g) => (
                  <span key={g.id} className="genre-tag">{g.name}</span>
                ))}
              </div>
            )}

            {directors.length > 0 && (
              <div className="detail-director">
                <span className="director-label">Directed by</span>
                <span className="director-name">
                  {directors.map((d, i) => (
                    <span key={d.credit_id}>
                      <Link to={`/person/${d.id}`} className="director-link">{d.name}</Link>
                      {i < directors.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {movie.overview && (
              <div className="detail-overview-section">
                <h3>Storyline</h3>
                <p className="detail-overview">{movie.overview}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="detail-section">
            <div className="section-header">
              <h3>Top Cast</h3>
              <div className="header-line" />
            </div>
            <div className="cast-scroll">
              {cast.map((person) => (
                <Link to={`/person/${person.id}`} key={person.credit_id} className="cast-card">
                  <div className="cast-photo">
                    {person.profile_path ? (
                      <img
                        src={getImageUrl(person.profile_path, 'w185')}
                        alt={person.name}
                      />
                    ) : (
                      <div className="cast-placeholder">
                        <span>{person.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className="cast-name">{person.name}</p>
                  <p className="cast-character">{person.character}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trailer */}
        {trailer && (
          <div className="detail-section">
            <div className="section-header">
              <h3>Official Trailer</h3>
              <div className="header-line" />
            </div>
            <div className="trailer-container">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <div className="detail-section">
            <div className="section-header">
              <h3>You Might Also Like</h3>
              <div className="header-line" />
            </div>
            <div className="similar-scroll">
              {similarMovies.map((sim) => (
                <Link to={`/movie/${sim.id}`} key={sim.id} className="similar-card">
                  <div className="similar-poster">
                    <img
                      src={getImageUrl(sim.poster_path, 'w342')}
                      alt={sim.title}
                      loading="lazy"
                    />
                    <div className="similar-overlay">
                      {sim.vote_average > 0 && (
                        <span className="similar-rating">★ {sim.vote_average.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                  <p className="similar-title">{sim.title}</p>
                  <span className="similar-year">{sim.release_date?.slice(0, 4) || '—'}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MovieDetail
