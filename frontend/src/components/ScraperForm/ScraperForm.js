import React, { useState } from 'react';
import { scrapeAuctions } from '../../services/scraperService';
import './ScraperForm.css';

const ScraperForm = () => {
  const [formData, setFormData] = useState({
    startPage: 1,
    endPage: 1,
    username: '',
    password: '',
    sortBy: 'num_bids',
    sortDirection: 'desc'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auctionData, setAuctionData] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.startPage > formData.endPage) {
      setError('Start page must be less than or equal to end page');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAuctionData([]);

    const onDataReceived = (data) => {
      setAuctionData(prevData => [...prevData, data]);
    };

    const onError = (errorMessage) => {
      if (errorMessage.includes('Authentication failed')) {
        setError('Authentication failed. Please check your username and password.');
      } else {
        setError(errorMessage);
      }
      setIsLoading(false);
    };

    const onComplete = (errors) => {
      setIsLoading(false);
      if (errors && errors.length > 0) {
        setError(`Scraping completed with ${errors.length} errors.`);
      }
    };

    try {
      await scrapeAuctions(
        formData.startPage,
        formData.endPage,
        formData.username,
        formData.password,
        formData.sortBy,
        formData.sortDirection,
        onDataReceived,
        onError,
        onComplete
      );
    } catch (error) {
      setIsLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="scraper-container">
      <h1>Auction Scraper Form</h1>
      <form onSubmit={handleSubmit} className="scraper-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startPage">Start Page:</label>
            <input
              id="startPage"
              name="startPage"
              type="number"
              value={formData.startPage}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endPage">End Page:</label>
            <input
              id="endPage"
              name="endPage"
              type="number"
              value={formData.endPage}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sortBy">Sort By:</label>
            <select
              id="sortBy"
              name="sortBy"
              value={formData.sortBy}
              onChange={handleChange}
            >
              <option value="Domain.name">Domain Name</option>
              <option value="price">Price</option>
              <option value="num_bids">Number of Bids</option>
              <option value="close_date">Close Date</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="sortDirection">Sort Direction:</label>
            <select
              id="sortDirection"
              name="sortDirection"
              value={formData.sortDirection}
              onChange={handleChange}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
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