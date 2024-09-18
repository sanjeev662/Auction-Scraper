import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={'./namekart-logo.png'} alt="Namekart Logo" className="navbar-logo" />
          AI Auction
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
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;