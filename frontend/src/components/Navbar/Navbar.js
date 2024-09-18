import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ token, setToken }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={'./namekart-logo.png'} alt="Namekart Logo" className="navbar-logo" />
          Auction AI
        </div>
        <ul className="navbar-menu">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              Auction List
            </NavLink>
          </li>
          <li>
            <NavLink to="/auction-bidders" className={({ isActive }) => isActive ? 'active' : ''}>
              Bidder List
            </NavLink>
          </li>
          <li>
            <NavLink to="/scrape" className={({ isActive }) => isActive ? 'active' : ''}>
              Scrape Auction
            </NavLink>
          </li>
          {token ? (
            <li>
            <NavLink to="#" onClick={handleLogout}>
              <img src={'./logout.png'} alt="Logout Icon" className="navbar-icon" />
              Logout
            </NavLink>
          </li>
          ) : (
            <li>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
                Login
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;