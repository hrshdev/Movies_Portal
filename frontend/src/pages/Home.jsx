import MovieCard from "../components/MovieCard"
import { useState, useEffect } from "react"
import { searchMovies, getPopularMovies } from "../services/api"
import '../css/Home.css'
import { useRef } from 'react'
import { useCallback } from 'react'

function Home() {
    const [searchQuery, setSearchQuery] = useState("")
    const [movies, setMovies] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [suggestions, setSuggestions] = useState([])
    const debounceRef = useRef(null)
    const [lastSearchTerm, setLastSearchTerm] = useState("")
    const [recentSearches, setRecentSearches] = useState([])
    const [isInputFocused, setIsInputFocused] = useState(false)

    // fetch popular movies (used on mount and when Home is reset)
    async function loadPopularMovies(page = 1) {
        try {
            setLoading(true)
            const data = await getPopularMovies(page)
            setMovies(data.results || [])
            setTotalPages(data.total_pages || 1)
            setCurrentPage(page)
            setError(null)
        } catch (error) {
            console.log(error)
            setError("Failed to load popular movies.")
        } finally {
            setLoading(false)
        }
    }

    // load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recentSearches')
        if (stored) setRecentSearches(JSON.parse(stored))
    }, [])

    useEffect(() => {
        loadPopularMovies()

        // listen for reset event from NavBar (clicking Home while already on /)
        function handleReset() {
            loadPopularMovies()
            setSearchQuery("")
        }

        window.addEventListener('resetHome', handleReset)
        return () => window.removeEventListener('resetHome', handleReset)
    }, [])

    const performSearch = useCallback(async (query, page = 1) => {
        if (!query || !query.trim()) return
        setLastSearchTerm(query.trim())
        try {
            setLoading(true)
            const data = await searchMovies(query.trim(), page)
            setMovies(data.results || [])
            setTotalPages(data.total_pages || 1)
            setCurrentPage(page)
            setError(null)

            // save recent search (most recent first, no duplicates)
            setRecentSearches(prev => {
                const normalized = query.trim()
                const filtered = prev.filter(s => s.toLowerCase() !== normalized.toLowerCase())
                const next = [normalized, ...filtered].slice(0, 10)
                localStorage.setItem('recentSearches', JSON.stringify(next))
                return next
            })
        } catch (error) {
            console.log(error)
            setError("Failed to search movies...")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!searchQuery.trim()) return
        if (loading) return
        await performSearch(searchQuery, 1)
        setSuggestions([])
        setIsInputFocused(false)
    }

    // live suggestions: debounce search as user types
    useEffect(() => {
        // clear previous debounce
        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (!searchQuery || !searchQuery.trim()) {
            setSuggestions([])
            return
        }

        // only search when user typed at least 2 chars
        if (searchQuery.trim().length < 2) {
            setSuggestions([])
            return
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchMovies(searchQuery.trim(), 1)
                // show top 6 suggestions
                setSuggestions((data.results || []).slice(0, 6))
            } catch (err) {
                console.error('Suggestion search failed', err)
                setSuggestions([])
            }
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [searchQuery])

    function chooseSuggestion(movie) {
        // show the chosen movie and clear suggestions/search
        setMovies([movie])
        setSearchQuery("")
        setSuggestions([])
        setTotalPages(1)
        setCurrentPage(1)
        setLastSearchTerm("")
    }

    function onClearSearch() {
        setSearchQuery("")
        setSuggestions([])
        setIsInputFocused(false)
        loadPopularMovies(1)
        setLastSearchTerm("")
    }

    function onFocusInput() {
        setIsInputFocused(true)
    }

    function onBlurInput() {
        // delay hiding so clicks on suggestions register
        setTimeout(() => setIsInputFocused(false), 150)
    }

    function clearRecentSearches() {
        localStorage.removeItem('recentSearches')
        setRecentSearches([])
    }

    async function changePage(page) {
        if (page < 1 || page > totalPages) return
        try {
            setLoading(true)
            if (searchQuery && searchQuery.trim().length > 0) {
                const data = await searchMovies(searchQuery.trim(), page)
                setMovies(data.results || [])
                setTotalPages(data.total_pages || 1)
                setCurrentPage(page)
            } else {
                const data = await getPopularMovies(page)
                setMovies(data.results || [])
                setTotalPages(data.total_pages || 1)
                setCurrentPage(page)
            }
        } catch (err) {
            console.error('Failed to change page', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="home">
            <form onSubmit={handleSearch} className="search-form">
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="Search movies..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={onFocusInput}
                        onBlur={onBlurInput}
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className="clear-btn"
                            onClick={onClearSearch}
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button type="submit" className="search-button">Search</button>
            </form>
            {error && <div className="error-message">{error}</div>}

            <div className="suggestions">
                {suggestions.length > 0 && (
                    <div className="suggestions-list">
                        {suggestions.map(s => (
                            <div key={s.id} className="suggestion-item" onMouseDown={() => chooseSuggestion(s)}>
                                {s.title} ({s.release_date?.split('-')[0] || 'N/A'})
                            </div>
                        ))}
                    </div>
                )}

                {isInputFocused && !suggestions.length && recentSearches.length > 0 && (
                    <div className="recent-list">
                        <div className="recent-header">
                            <span>Recent searches</span>
                            <button className="clear-history" onMouseDown={clearRecentSearches}>Clear</button>
                        </div>
                        {recentSearches.map((r, idx) => (
                            <div key={idx} className="recent-item" onMouseDown={() => { setSearchQuery(r); performSearch(r, 1); setIsInputFocused(false); }}>
                                {r}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <div className="movies-grid">
                        {movies.map(movie => (
                            <MovieCard movie={movie} key={movie.id} />
                        ))}
                    </div>

                    {!movies.length && lastSearchTerm && (
                        <div className="no-results">No results found for "{lastSearchTerm}"</div>
                    )}

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>

                            {(() => {
                                // show a window of page buttons around current page
                                const pages = [];
                                const maxButtons = 7;
                                let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                                let end = Math.min(totalPages, start + maxButtons - 1);
                                if (end - start + 1 < maxButtons) {
                                    start = Math.max(1, end - maxButtons + 1);
                                }
                                for (let p = start; p <= end; p++) {
                                    pages.push(
                                        <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => changePage(p)}>{p}</button>
                                    )
                                }
                                return pages;
                            })()}

                            <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Home