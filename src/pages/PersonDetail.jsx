import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPersonDetails, getImageUrl } from '../services/tmdb'
import './PersonDetail.css'

function PersonDetail() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showFullBio, setShowFullBio] = useState(false)

  useEffect(() => {
    setLoading(true)
    setShowFullBio(false)
    getPersonDetails(id)
      .then((data) => setPerson(data))
      .catch((err) => console.error('Failed to load person:', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="person-detail">
        <div className="detail-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="person-detail">
        <p>Person not found.</p>
      </div>
    )
  }

  const profileUrl = getImageUrl(person.profile_path, 'h632')

  // format birthday
  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // calculate age
  const getAge = () => {
    if (!person.birthday) return null
    const birth = new Date(person.birthday)
    const end = person.deathday ? new Date(person.deathday) : new Date()
    let age = end.getFullYear() - birth.getFullYear()
    const monthDiff = end.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // build filmography sections from crew credits, grouped by job
  const buildFilmography = () => {
    const crew = person.movie_credits?.crew || []
    const cast = person.movie_credits?.cast || []

    // group crew by job
    const crewByJob = {}
    crew.forEach((credit) => {
      if (!crewByJob[credit.job]) crewByJob[credit.job] = []
      // deduplicate by movie id within each job
      if (!crewByJob[credit.job].find((c) => c.id === credit.id)) {
        crewByJob[credit.job].push(credit)
      }
    })

    // sort each group by release date (newest first)
    const sortByDate = (a, b) => {
      if (!a.release_date) return 1
      if (!b.release_date) return -1
      return b.release_date.localeCompare(a.release_date)
    }

    Object.values(crewByJob).forEach((credits) => credits.sort(sortByDate))

    // deduplicate cast
    const seenCast = new Set()
    const uniqueCast = cast.filter((c) => {
      if (seenCast.has(c.id)) return false
      seenCast.add(c.id)
      return true
    }).sort(sortByDate)

    // order: known_for_department first, then other crew roles, then acting
    const department = person.known_for_department || ''
    const sections = []

    // map department to likely job title
    const deptJobMap = { Directing: 'Director', Writing: 'Writer', Production: 'Producer' }
    const primaryJob = deptJobMap[department]

    // add primary job first if it exists
    if (primaryJob && crewByJob[primaryJob]) {
      sections.push({ label: `As ${primaryJob}`, credits: crewByJob[primaryJob], type: 'crew' })
      delete crewByJob[primaryJob]
    }

    // add remaining crew jobs
    Object.entries(crewByJob)
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([job, credits]) => {
        sections.push({ label: `As ${job}`, credits, type: 'crew' })
      })

    // add acting credits last (or first if they're primarily an actor)
    if (uniqueCast.length > 0) {
      if (department === 'Acting') {
        sections.unshift({ label: 'As Actor', credits: uniqueCast, type: 'cast' })
      } else {
        sections.push({ label: 'As Actor', credits: uniqueCast, type: 'cast' })
      }
    }

    return sections
  }

  const filmography = buildFilmography()
  const age = getAge()
  const bioText = person.biography || ''
  const bioIsLong = bioText.length > 350

  return (
    <div className="person-detail">
      <div className="person-content">
        <Link to="/" className="back-link">← Back</Link>

        <div className="person-layout">
          <div className="person-profile">
            {profileUrl ? (
              <img src={profileUrl} alt={person.name} className="person-photo" />
            ) : (
              <div className="person-photo-placeholder">
                <span>{person.name?.charAt(0)}</span>
              </div>
            )}

            <div className="person-meta-sidebar">
              {person.known_for_department && (
                <div className="meta-item">
                  <span className="meta-label">Known For</span>
                  <span className="meta-value gold">{person.known_for_department}</span>
                </div>
              )}
              {person.birthday && (
                <div className="meta-item">
                  <span className="meta-label">Born</span>
                  <span className="meta-value">
                    {formatDate(person.birthday)}
                    {age !== null && !person.deathday && ` (age ${age})`}
                  </span>
                </div>
              )}
              {person.deathday && (
                <div className="meta-item">
                  <span className="meta-label">Died</span>
                  <span className="meta-value">
                    {formatDate(person.deathday)}
                    {age !== null && ` (age ${age})`}
                  </span>
                </div>
              )}
              {person.place_of_birth && (
                <div className="meta-item">
                  <span className="meta-label">Birthplace</span>
                  <span className="meta-value">{person.place_of_birth}</span>
                </div>
              )}
            </div>
          </div>

          <div className="person-info">
            {person.known_for_department && (
              <span className="person-dept-badge">{person.known_for_department}</span>
            )}
            <h2>{person.name}</h2>

            {bioText ? (
              <div className="person-bio-section">
                <h3>Biography</h3>
                <p className={`person-bio ${!showFullBio && bioIsLong ? 'clamped' : ''}`}>
                  {bioText}
                </p>
                {bioIsLong && (
                  <button className="bio-toggle" onClick={() => setShowFullBio(!showFullBio)}>
                    {showFullBio ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            ) : (
              <p className="person-bio-empty">No biography available.</p>
            )}
          </div>
        </div>

        {/* Filmography */}
        {filmography.length > 0 ? (
          filmography.map((section) => (
            <div className="detail-section" key={section.label}>
              <div className="section-header">
                <h3>{section.label}</h3>
                <span className="section-count">{section.credits.length}</span>
                <div className="header-line" />
              </div>
              <div className="filmography-grid">
                {section.credits.map((credit, index) => (
                  <Link
                    to={`/movie/${credit.id}`}
                    key={credit.credit_id || `${credit.id}-${index}`}
                    className="film-card"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="film-poster">
                      {credit.poster_path ? (
                        <img
                          src={getImageUrl(credit.poster_path, 'w342')}
                          alt={credit.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="film-no-poster">No Poster</div>
                      )}
                    </div>
                    <p className="film-title">{credit.title}</p>
                    <span className="film-year">
                      {credit.release_date?.slice(0, 4) || '—'}
                    </span>
                    {section.type === 'cast' && credit.character && (
                      <span className="film-role">as {credit.character}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="no-filmography">No filmography available.</p>
        )}
      </div>
    </div>
  )
}

export default PersonDetail
