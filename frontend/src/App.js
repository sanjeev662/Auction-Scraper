import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import AuctionList from './components/AuctionList/AuctionList';
import ScraperForm from './components/ScraperForm/ScraperForm';
import UserDetails from './components/UserDetails/UserDetails';
import AuctionBiddersList from './components/AuctionBiddersList/AuctionBiddersList';
import Login from './components/Auth/Login';
import './App.css';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const setTokenAndStore = (token) => {
    setToken(token);
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };

  return (
    <Router basename='/scraper'>
      <div className="App">
        <Navbar token={token} setToken={setTokenAndStore} />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login setToken={setTokenAndStore} />} />
            <Route path="/" element={token ? <AuctionList /> : <Navigate to="/login" />} />
            <Route path="/scrape" element={token ? <ScraperForm /> : <Navigate to="/login" />} />
            <Route path="/user/:username" element={token ? <UserDetails /> : <Navigate to="/login" />} />
            <Route path="/auction-bidders" element={token ? <AuctionBiddersList /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;