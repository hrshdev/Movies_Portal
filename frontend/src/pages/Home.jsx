import MovieCard from "../components/MovieCard"
import { useState, useEffect, useRef, useCallback } from "react"
import { searchMovies, getPopularMovies } from "../services/api"
import '../css/Home.css'

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

    // ── Keyboard navigation ──────────────────────────────────────────
    const [activeIndex, setActiveIndex] = useState(-1)
    const inputRef = useRef(null)
    const wrapperRef = useRef(null)

    // Reset highlight whenever the visible list changes
    useEffect(() => { setActiveIndex(-1) }, [suggestions, recentSearches, isInputFocused])

    // What list is visible right now?
    // ✅ History shows when focused + query is EMPTY (not just no suggestions)
    const showSuggestions = suggestions.length > 0 && searchQuery.trim().length > 0
    const showRecent = isInputFocused && searchQuery.trim() === "" && recentSearches.length > 0
    const activeList = showSuggestions ? suggestions : showRecent ? recentSearches : []

    function handleKeyDown(e) {
        if (!showSuggestions && !showRecent) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(prev => (prev + 1) % activeList.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(prev => (prev <= 0 ? activeList.length - 1 : prev - 1))
        } else if (e.key === 'Escape') {
            setSuggestions([])
            setIsInputFocused(false)
            setActiveIndex(-1)
            inputRef.current?.blur()
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault()
            if (showSuggestions) {
                chooseSuggestion(suggestions[activeIndex])
            } else if (showRecent) {
                const term = recentSearches[activeIndex]
                setSearchQuery(term)
                performSearch(term, 1)
                setIsInputFocused(false)
            }
            setActiveIndex(-1)
        }
    }

    // ── History helpers ──────────────────────────────────────────────
    // Push a URL state so the browser back button has something to go back to
    function pushSearchState(query, page) {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (page > 1) params.set('page', page)
        const url = params.toString() ? `?${params}` : window.location.pathname
        window.history.pushState({ query, page }, '', url)
    }

    function pushPopularState(page) {
        const params = page > 1 ? `?page=${page}` : window.location.pathname
        window.history.pushState({ query: '', page }, '', params)
    }

    // ── Restore state on browser back / forward ──────────────────────
    useEffect(() => {
        function handlePopState(e) {
            const state = e.state
            if (!state) {
                // Landed on bare URL — show popular page 1
                loadPopularMovies(1)
                setSearchQuery("")
                setLastSearchTerm("")
                return
            }
            if (state.query) {
                setSearchQuery(state.query)
                performSearch(state.query, state.page || 1, /* skipPush */ true)
            } else {
                setSearchQuery("")
                setLastSearchTerm("")
                loadPopularMovies(state.page || 1, /* skipPush */ true)
            }
        }
        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Data fetching ────────────────────────────────────────────────
    async function loadPopularMovies(page = 1, skipPush = false) {
        try {
            setLoading(true)
            const data = await getPopularMovies(page)
            setMovies(data.results || [])
            setTotalPages(data.total_pages || 1)
            setCurrentPage(page)
            setError(null)
            if (!skipPush) pushPopularState(page)
        } catch (err) {
            console.log(err)
            setError("Failed to load popular movies.")
        } finally {
            setLoading(false)
        }
    }

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recentSearches')
        if (stored) setRecentSearches(JSON.parse(stored))
    }, [])

    // Initial load — respect URL params if user deep-links or refreshes
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const q = params.get('q')
        const page = parseInt(params.get('page')) || 1

        if (q) {
            setSearchQuery(q)
            performSearch(q, page, true)
        } else {
            loadPopularMovies(page, true)
        }

        // Replace current history entry so popstate has correct state on first back
        window.history.replaceState(
            { query: q || '', page },
            '',
            window.location.href
        )

        function handleReset() {
            loadPopularMovies(1)
            setSearchQuery("")
        }
        window.addEventListener('resetHome', handleReset)
        return () => window.removeEventListener('resetHome', handleReset)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const performSearch = useCallback(async (query, page = 1, skipPush = false) => {
        if (!query || !query.trim()) return
        setLastSearchTerm(query.trim())
        try {
            setLoading(true)
            const data = await searchMovies(query.trim(), page)
            setMovies(data.results || [])
            setTotalPages(data.total_pages || 1)
            setCurrentPage(page)
            setError(null)
            if (!skipPush) pushSearchState(query.trim(), page)

            // Save to recent searches
            setRecentSearches(prev => {
                const normalized = query.trim()
                const filtered = prev.filter(s => s.toLowerCase() !== normalized.toLowerCase())
                const next = [normalized, ...filtered].slice(0, 10)
                localStorage.setItem('recentSearches', JSON.stringify(next))
                return next
            })
        } catch (err) {
            console.log(err)
            setError("Failed to search movies...")
        } finally {
            setLoading(false)
        }
    }, [])

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!searchQuery.trim() || loading) return
        await performSearch(searchQuery, 1)
        setSuggestions([])
        setIsInputFocused(false)
    }

    const skipSuggestionRef = useRef(false)

    // Close dropdown when clicking outside the input wrapper
    useEffect(() => {
        function handleOutsideClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setSuggestions([])
                setIsInputFocused(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    // Live suggestions (debounced)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (skipSuggestionRef.current) {
            skipSuggestionRef.current = false
            return
        }
        if (!searchQuery || searchQuery.trim().length < 2) {
            setSuggestions([])
            return
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchMovies(searchQuery.trim(), 1)
                setSuggestions((data.results || []).slice(0, 6))
            } catch (err) {
                console.error('Suggestion search failed', err)
                setSuggestions([])
            }
        }, 300)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [searchQuery])

    function chooseSuggestion(movie) {
        setMovies([movie])
        setSearchQuery("")
        setSuggestions([])
        setTotalPages(1)
        setCurrentPage(1)
        setLastSearchTerm("")
        pushSearchState(movie.title, 1)
    }

    function onClearSearch() {
        setSearchQuery("")
        setSuggestions([])
        setIsInputFocused(false)
        // stays on current results — user must trigger a new search to change page
    }

    function onFocusInput() { setIsInputFocused(true) }
    // Delay hiding so clicks on dropdown items register first
    function onBlurInput() { setTimeout(() => setIsInputFocused(false), 150) }

    function clearRecentSearches() {
        localStorage.removeItem('recentSearches')
        setRecentSearches([])
    }

    async function changePage(page) {
        if (page < 1 || page > totalPages) return
        try {
            setLoading(true)
            if (lastSearchTerm) {
                const data = await searchMovies(lastSearchTerm, page)
                setMovies(data.results || [])
                setTotalPages(data.total_pages || 1)
                setCurrentPage(page)
                pushSearchState(lastSearchTerm, page)
            } else {
                const data = await getPopularMovies(page)
                setMovies(data.results || [])
                setTotalPages(data.total_pages || 1)
                setCurrentPage(page)
                pushPopularState(page)
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
                <div className="input-wrapper" ref={wrapperRef}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search movies..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={onFocusInput}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-haspopup="listbox"
                        aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                    />
                    {searchQuery && (
                        <button type="button" className="clear-btn" onClick={onClearSearch}>✕</button>
                    )}

                    {/* ── Unified dropdown ── */}
                    {(showSuggestions || showRecent) && (
                        <div className="suggestions-dropdown" role="listbox">
                            {showSuggestions && suggestions.map((s, idx) => (
                                <div
                                    key={s.id}
                                    id={`suggestion-${idx}`}
                                    className={`suggestion-item ${idx === activeIndex ? 'active' : ''}`}
                                    role="option"
                                    aria-selected={idx === activeIndex}
                                    onMouseDown={() => chooseSuggestion(s)}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                >
                                    <span className="suggestion-title">{s.title}</span>
                                    <span className="suggestion-year">{s.release_date?.split('-')[0] || 'N/A'}</span>
                                </div>
                            ))}

                            {showRecent && (
                                <>
                                    <div className="recent-header">
                                        <span>Recent searches</span>
                                        <button className="clear-history" onMouseDown={clearRecentSearches}>Clear</button>
                                    </div>
                                    {recentSearches.map((r, idx) => (
                                        <div
                                            key={idx}
                                            id={`suggestion-${idx}`}
                                            className={`recent-item ${idx === activeIndex ? 'active' : ''}`}
                                            role="option"
                                            aria-selected={idx === activeIndex}
                                            onMouseDown={() => {
                                                performSearch(r, 1)
                                                skipSuggestionRef.current = true
                                                setSearchQuery(r)
                                                setSuggestions([])
                                                setIsInputFocused(false)
                                                inputRef.current?.blur()
                                            }}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                        >
                                            <span className="recent-icon">↩</span> {r}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
                <button type="submit" className="search-button">Search</button>
            </form>

            {error && <div className="error-message">{error}</div>}

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
                                const pages = []
                                const maxButtons = 7
                                let start = Math.max(1, currentPage - Math.floor(maxButtons / 2))
                                let end = Math.min(totalPages, start + maxButtons - 1)
                                if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1)
                                for (let p = start; p <= end; p++) {
                                    pages.push(
                                        <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => changePage(p)}>{p}</button>
                                    )
                                }
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

export default Home