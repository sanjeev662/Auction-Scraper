import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import AuctionList from './components/AuctionList/AuctionList';
import ScraperForm from './components/ScraperForm/ScraperForm';
import UserDetails from './components/UserDetails/UserDetails';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<AuctionList />} />
            <Route path="/scrape" element={<ScraperForm />} />
            <Route path="/user/:username" element={<UserDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;