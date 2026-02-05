import '../css/MovieCard.css'
import { useMovieContext } from '../contexts/MovieContext';
import { useState } from 'react';
import { getMovieDetails } from '../services/api';

function MovieCard({ movie }) {
    const { addToFavorites, removeFromFavorites, isFavorite } = useMovieContext();
    const favorite = isFavorite(movie.id);

    const [flipped, setFlipped] = useState(false);
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    function onFavoriteClick(e) {
        e.preventDefault();
        e.stopPropagation();
        if (favorite) {
            removeFromFavorites(movie.id);
        } else {
            addToFavorites(movie);
        }
    }

    async function handleFlip() {
        // if flipping to back and details not loaded, fetch details
        if (!flipped && !details) {
            try {
                setLoadingDetails(true);
                const data = await getMovieDetails(movie.id);
                setDetails(data);
            } catch (err) {
                console.error('Failed to fetch movie details', err);
            } finally {
                setLoadingDetails(false);
            }
        }
        setFlipped(!flipped);
    }

    // helper to extract certification
    function getCertification(detailObj) {
        const results = detailObj?.release_dates?.results || [];
        // prefer US certification, else first available
        const us = results.find(r => r.iso_3166_1 === 'US');
        const entry = (us || results[0])?.release_dates?.[0];
        return entry?.certification || 'N/A';
    }

    return (
        <div className={`movie-card ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="movie-card-inner">
                <div className="movie-card-front">
                    <div className="movie-poster">
                        {movie.poster_path ? (
                            <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                        ) : (
                            <div className="poster-placeholder">
                                <span className="placeholder-text">{movie.title}</span>
                            </div>
                        )}
                        <div className="poster-caption">
                            <h3 className="poster-title">{movie.title}</h3>
                            <span className="poster-year">{movie.release_date?.split("-")[0]}</span>
                        </div>
                        <div className="movie-overlay">
                            <button className={`favorite-btn ${favorite ? 'active' : ''}`} onClick={onFavoriteClick}>
                                ❤︎⁠
                            </button>
                        </div>
                    </div>
                    <div className="movie-info">
                        <h3>{movie.title}</h3>
                        <p className="release-year">{movie.release_date?.split("-")[0]}</p>
                    </div>
                </div>

                <div className="movie-card-back">
                    {loadingDetails ? (
                        <div className="back-loading">Loading details...</div>
                    ) : (
                        <div className="back-content">
                            <h3>{movie.title}</h3>
                            <p className="overview">{details?.overview || movie.overview || 'No overview available.'}</p>
                            <p><strong>Genres:</strong> {details?.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
                            <p><strong>Release:</strong> {details?.release_date || movie.release_date || 'N/A'}</p>
                            <p><strong>User Rating:</strong> {details?.vote_average ?? movie.vote_average ?? 'N/A'}</p>
                            <p><strong>Certificate:</strong> {getCertification(details || movie)}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MovieCard