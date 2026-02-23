import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMovieDetails, getImageUrl } from '../services/tmdb'
import './MovieDetail.css'

function MovieDetail() {
  const { id } = useParams()
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
        <div className="detail-loading">Loading...</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="movie-detail">
        <p>Movie not found.</p>
      </div>
    )
  }

  const trailer = movie.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  )
  const cast = movie.credits?.cast?.slice(0, 10) || []
  const directors = movie.credits?.crew?.filter((c) => c.job === 'Director') || []
  const backdropUrl = getImageUrl(movie.backdrop_path, 'original')
  const posterUrl = getImageUrl(movie.poster_path, 'w500')

  return (
    <div className="movie-detail">
      {backdropUrl && (
        <div
          className="detail-backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}

      <Link to="/" className="back-link">&larr; Back to Home</Link>

      <div className="detail-layout">
        <div className="detail-poster">
          {posterUrl ? (
            <img src={posterUrl} alt={movie.title} />
          ) : (
            <span>No Image</span>
          )}
        </div>

        <div className="detail-info">
          <h2>{movie.title}</h2>
          {movie.tagline && <p className="detail-tagline">{movie.tagline}</p>}

          <div className="detail-stats">
            <span>⭐ {movie.vote_average?.toFixed(1)} / 10</span>
            <span>📅 {movie.release_date?.slice(0, 4)}</span>
            {movie.runtime > 0 && <span>⏱ {movie.runtime} min</span>}
          </div>

          {movie.genres?.length > 0 && (
            <div className="detail-genres">
              {movie.genres.map((g) => (
                <span key={g.id} className="genre-tag">{g.name}</span>
              ))}
            </div>
          )}

          {directors.length > 0 && (
            <p className="detail-director">
              Directed by {directors.map((d) => d.name).join(', ')}
            </p>
          )}

          {movie.overview && (
            <>
              <h3>Overview</h3>
              <p className="detail-overview">{movie.overview}</p>
            </>
          )}
        </div>
      </div>

      {cast.length > 0 && (
        <div className="detail-cast">
          <h3>Cast</h3>
          <div className="cast-grid">
            {cast.map((person) => (
              <div key={person.credit_id} className="cast-card">
                <div className="cast-photo">
                  {person.profile_path ? (
                    <img
                      src={getImageUrl(person.profile_path, 'w185')}
                      alt={person.name}
                    />
                  ) : (
                    <span>?</span>
                  )}
                </div>
                <p className="cast-name">{person.name}</p>
                <p className="cast-character">{person.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {trailer && (
        <div className="detail-trailer">
          <h3>Trailer</h3>
          <div className="trailer-wrapper">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}`}
              title={trailer.name}
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default MovieDetail
