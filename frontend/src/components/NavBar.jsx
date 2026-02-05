import { Link } from "react-router-dom";
import '../css/NavBar.css';

function NavBar() {
    function resetHome() {
        // dispatch a custom event so Home can reload popular movies
        window.dispatchEvent(new Event('resetHome'));
    }

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" onClick={resetHome}>Movie Portal</Link>
            </div>
            <div className="navbar-links">
                <Link to="/" className="nav-link" onClick={resetHome}>Home</Link>
                <Link to="/genres" className="nav-link">Genres</Link>
                <Link to="/favorites" className="nav-link">Favorites</Link>
            </div>
        </nav>
    )
}

export default NavBar;