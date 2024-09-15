import React, { useState } from 'react';
import { scrapeAuctions } from '../../services/scraperService';
import './ScraperForm.css';

const ScraperForm = () => {
  const [numPages, setNumPages] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auctionData, setAuctionData] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAuctionData([]);

    const onDataReceived = (data) => {
      setAuctionData(prevData => [...prevData, data]);
    };

    const onError = (error) => {
      setError(error);
      setIsLoading(false);
    };

    const onComplete = (errors) => {
      if (errors && errors.length > 0) {
        setError(`Scraping completed with ${errors.length} errors.`);
      } else {
        setError(null);
      }
      setIsLoading(false);
    };

    const cleanup = scrapeAuctions(numPages, username, password, onDataReceived, onError, onComplete);

    return () => {
      cleanup();
    };
  };

  return (
    <div className="scraper-container">
      <h1>Auction Scraper Form</h1>
      <form onSubmit={handleSubmit} className="scraper-form">
        <div className="form-group">
          <label htmlFor="numPages">Number of pages:</label>
          <input
            id="numPages"
            type="number"
            value={numPages}
            onChange={(e) => setNumPages(e.target.value)}
            min="1"
            max="10"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Scraping...' : 'Scrape Auctions'}
        </button>
      </form>
      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {auctionData.length > 0 && (
        <div className="scraping-results">
          <h2>Scraping Results</h2>
          <p>Domains scraped: {auctionData.length}</p>
        </div>
      )}
    </div>
  );
};

export default ScraperForm;