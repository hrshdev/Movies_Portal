import { createContext, useState, useContext, useEffect } from "react";

const MovieContext = createContext();

export const useMovieContext = () => {
    return useContext(MovieContext);
}

export const MovieProvider = ({ children }) => {
    const [favorites, setFavorites] = useState({})

    useEffect(() => {
        const storedFavorites = localStorage.getItem("favorites")

        if (storedFavorites) setFavorites(JSON.parse(storedFavorites))
    }, [])

    useEffect(() => {
        localStorage.setItem("favorites", JSON.stringify(favorites))
    }, [favorites])

    const addToFavorites = (movie) => {
        setFavorites((prevFavorites) => ({
            ...prevFavorites,
            [movie.id]: movie
        }))
    }

    const removeFromFavorites = (movieId) => {
        setFavorites((prevFavorites) => {
            const updatedFavorites = { ...prevFavorites }
            delete updatedFavorites[movieId]
            return updatedFavorites
        })
    }   

    const isFavorite = (movieId) => {
        return favorites.hasOwnProperty(movieId)
    }   

    const value = {
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite
    }
    return (
        <MovieContext.Provider value={value}>
            {children}
        </MovieContext.Provider>
    )
}