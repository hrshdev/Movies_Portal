import { useState, useEffect } from 'react'
import { getGenres, discoverMoviesByGenre } from '../services/api'
import MovieCard from '../components/MovieCard'
import '../css/Genres.css'
import '../css/Home.css'

function Genres() {
  const [genres, setGenres] = useState([])
  const [selected, setSelected] = useState(null)
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function loadGenres() {
      try {
        const list = await getGenres()
        setGenres(list)
      } catch (err) {
        console.error('Failed to load genres', err)
      }
    }
    loadGenres()
  }, [])

  async function loadByGenre(genreId, page = 1) {
    setLoading(true)
    try {
      const data = await discoverMoviesByGenre(genreId, page)
      setMovies(data.results || [])
      setTotalPages(data.total_pages || 1)
      setCurrentPage(page)
    } catch (err) {
      console.error('Failed to load movies for genre', err)
    } finally {
      setLoading(false)
    }
  }

  function onSelectGenre(g) {
    setSelected(g.id)
    loadByGenre(g.id, 1)
  }

  async function changePage(page) {
    if (!selected) return
    if (page < 1 || page > totalPages) return
    await loadByGenre(selected, page)
  }

  return (
    <div className="genres-page">
      <div className="genres-header">
        <h2>Browse by Genre</h2>
        <p>Select a genre to see popular movies in that genre.</p>
      </div>

      <div className="genres-list">
        {genres.map(g => (
          <button key={g.id} className={`genre-chip ${selected === g.id ? 'active' : ''}`} onClick={() => onSelectGenre(g)}>
            {g.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="movies-grid">
            {movies.map(m => <MovieCard movie={m} key={m.id} />)}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
              {(() => {
                const pages = []
                const maxButtons = 7
                let start = Math.max(1, currentPage - Math.floor(maxButtons / 2))
                let end = Math.min(totalPages, start + maxButtons - 1)
                if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1)
                for (let p = start; p <= end; p++) pages.push(<button key={p} className={p === currentPage ? 'active' : ''} onClick={() => changePage(p)}>{p}</button>)
                return pages
              })()}
              <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Genres
