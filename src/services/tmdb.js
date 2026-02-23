const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

async function fetchTmdb(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) url.searchParams.set(key, val)
  })

  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`)
  return res.json()
}

export async function getPopularMovies(page = 1) {
  return fetchTmdb('/movie/popular', { page })
}

export async function searchMovies(query, page = 1) {
  return fetchTmdb('/search/movie', { query, page })
}

export async function getMovieDetails(id) {
  return fetchTmdb(`/movie/${id}`, { append_to_response: 'credits,videos' })
}
