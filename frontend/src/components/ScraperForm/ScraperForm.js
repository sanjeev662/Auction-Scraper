import React, { useState, useEffect } from 'react';
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
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    const startPage = parseInt(formData.startPage);
    const endPage = parseInt(formData.endPage);
    if (startPage > endPage) {
      setError('Start page must be less than or equal to end page');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setAuctionData([]);

    try {
      const data = await scrapeAuctions(
        startPage,
        endPage,
        formData.username,
        formData.password,
        formData.sortBy,
        formData.sortDirection,
        actionType
      );
      console.log("donedddd",data);

      const errors = data.filter(item => item.error);
      const validData = data.filter(item => !item.error && !item.done);

      setAuctionData(validData);
      setIsLoading(false);

      if (errors.length > 0) {
        setError(`Scraping completed with ${errors.length} errors.`);
      } else {
        setSuccessMessage(validData.length === 0 ? 'Scraping completed successfully. No data found.' : 'Scraping completed successfully!');
      }
    } catch (error) {
      setIsLoading(false);
      setError(error.message);
    }
  };

  return (
    <div className="scraper-container">
      <h1>Auction Scraper</h1>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-close-btn">
            &times;
          </button>
        </div>
      )}
      <form className="scraper-form">
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
        <div className="form-row">
          <button type="button" className="submit-button" disabled={isLoading} onClick={(e) => handleSubmit(e, 'view')}>
            {isLoading ? 'Scraping...' : 'View'}
          </button>
          <button type="button" className="submit-button" disabled={isLoading} onClick={(e) => handleSubmit(e, 'saveAndView')}>
            {isLoading ? 'Scraping...' : 'Save and View'}
          </button>
        </div>
      </form>
      {isLoading && (
        <div className="scraper-form-loading-container">
          <div className="scraper-form-loading-spinner"></div>
          <p>Scraping in progress...</p>
        </div>
      )}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {auctionData.length > 0 && (
        <div className="scraping-results">
          <h2>Scraping Results</h2>
          <p>Domains scraped: {auctionData.length}</p>
          <div className="auction-grid">
            {auctionData.map((auction, index) => (
              <div key={index} className="auction-card">
                <h3>{auction.domain_name}</h3>
                <p><strong>Price:</strong> {auction.domain_price}</p>
                <p><strong>Bids:</strong> {auction.total_bids}</p>
                <p><strong>Close Date:</strong> {auction.close_date}</p>
                <p><strong>Top Bid:</strong> {auction.top_bids[0].amount} by {auction.top_bids[0].user}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperForm;