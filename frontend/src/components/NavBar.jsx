import { Link, NavLink } from "react-router-dom";
import '../css/NavBar.css';
import logo from '../assets/HrshDev.svg';

function NavBar() {
    function resetHome() {
        // dispatch a custom event so Home can reload popular movies
        window.dispatchEvent(new Event('resetHome'));
    }

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" onClick={resetHome} className="brand-link">
                    <img src={logo} alt="HrshDev logo" className="brand-logo" />
                    <span className="brand-title">Movie Portal</span>
                </Link>
            </div>
            <div className="navbar-links">
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={resetHome}>Home</NavLink>
                <NavLink to="/genres" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Genres</NavLink>
                <NavLink to="/favorites" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Favorites</NavLink> 
            </div>
        </nav>
    )
}

export default NavBar;