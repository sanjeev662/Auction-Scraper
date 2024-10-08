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
  const [progress, setProgress] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for the field being changed
    setFormErrors({ ...formErrors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.startPage) errors.startPage = 'Start Page is required';
    if (!formData.endPage) errors.endPage = 'End Page is required';
    
    const startPage = parseInt(formData.startPage);
    const endPage = parseInt(formData.endPage);
    
    if (startPage > endPage) {
      errors.endPage = 'End Page must be greater than or equal to Start Page';
    }

    if (endPage - startPage + 1 > 5) {
      errors.endPage = 'Page range should be less than or equal to 5';
    }
    
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.password.trim()) errors.password = 'Password is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e, actionType) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
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
    setProgress(0);

    const eventSource = scrapeAuctions(
      startPage,
      endPage,
      formData.username,
      formData.password,
      formData.sortBy,
      formData.sortDirection,
      actionType
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        setProgress(data.value);
      } else if (data.type === 'auction') {
        setAuctionData((prevData) => [...prevData, data.auction]);
      } else if (data.type === 'scraping_complete') {
        setIsLoading(false);
        if (auctionData.length === 0) {
          setSuccessMessage('Scraping completed successfully, but no data was found.');
        } else {
          setSuccessMessage(data.message);
        }
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      setError('An error occurred while scraping. Please try again.');
      setIsLoading(false);
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log('EventSource connection opened');
    };
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
      <form className="scraper-form" onSubmit={(e) => e.preventDefault()}>
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
            {formErrors.startPage && <span className="error-message">{formErrors.startPage}</span>}
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
            {formErrors.endPage && <span className="error-message">{formErrors.endPage}</span>}
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
            <label htmlFor="username">Username(whois):</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
            />
            {formErrors.username && <span className="error-message">{formErrors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password(whois):</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {formErrors.password && <span className="error-message">{formErrors.password}</span>}
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
          <p>Scraping in progress... {progress}%</p>
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
                {auction.top_bids && auction.top_bids.length > 0 && (
                  <p><strong>Top Bid:</strong> {auction.top_bids[0].amount} by {auction.top_bids[0].user}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperForm;