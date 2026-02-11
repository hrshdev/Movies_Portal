import './css/App.css'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import Genres from './pages/Genres'
import { Routes, Route } from 'react-router-dom'
import { MovieProvider } from './contexts/MovieContext'
import NavBar from './components/NavBar'
import Footer from './components/Footer'

function App() {
  return (
    <>
      <MovieProvider>
        <NavBar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/genres" element={<Genres />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </main>
        <Footer/>
      </MovieProvider>
    </>
  )
}

export default App