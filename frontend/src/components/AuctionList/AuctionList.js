import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuctions } from '../../services/scraperService';
import ExportButton from '../ExportButton/ExportButton';
import './AuctionList.css';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('bid1_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [closeDateStart, setCloseDateStart] = useState('');
  const [closeDateEnd, setCloseDateEnd] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAuctions({
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        search,
        closeDateStart,
        closeDateEnd,
        userSearch
      });
      setAuctions(response.auctions);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search, closeDateStart, closeDateEnd, userSearch]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleSort = (event) => {
    const [newSortBy, newSortOrder] = event.target.value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleUserClick = (username) => {
    navigate(`/user/${username}`);
  };

  const resetFilters = () => {
    setSearch('');
    setCloseDateStart('');
    setCloseDateEnd('');
    setUserSearch('');
    setPageSize(20);
    setSortBy('bid1_date');
    setSortOrder('desc');
    setPage(1);
  };

  const validateDates = () => {
    if (closeDateStart && closeDateEnd && new Date(closeDateStart) > new Date(closeDateEnd)) {
      alert('Start date cannot be later than end date');
      setCloseDateEnd('');
    }
  };

  return (
    <div className="auction-list">
      <h1>Auction List</h1>
      <div className="filters-container">
        <div className="filters-row">
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search domain name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search user"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <input
              type="date"
              placeholder="Start date"
              value={closeDateStart}
              onChange={(e) => {
                setCloseDateStart(e.target.value);
                validateDates();
              }}
            />
            <input
              type="date"
              placeholder="End date"
              value={closeDateEnd}
              onChange={(e) => {
                setCloseDateEnd(e.target.value);
                validateDates();
              }}
            />
          </div>
          <div className="action-buttons">
            <button onClick={resetFilters} className="reset-button">
              Reset Filters
            </button>
            <div className="export-buttons">
              <ExportButton auctionData={auctions} format="xlsx" />
              <ExportButton auctionData={auctions} format="csv" />
            </div>
          </div>
        </div>
        <div className="filters-row">
          <div className="sort-filters">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <select value={`${sortBy}-${sortOrder}`} onChange={handleSort}>
              <option value="bid1_date-desc">Date (Newest First)</option>
              <option value="bid1_date-asc">Date (Oldest First)</option>
              <option value="bid1_amount-desc">Price (Highest First)</option>
              <option value="bid1_amount-asc">Price (Lowest First)</option>
              <option value="total_bids-desc">Total Bids (Highest First)</option>
              <option value="total_bids-asc">Total Bids (Lowest First)</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="auction-list-loading-spinner">
          <div className="auction-list-spinner"></div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Domain Name</th>
                  <th>Version</th>
                  <th>Total Bids</th>
                  <th>Bid 1 Amount</th>
                  <th>Bid 1 User</th>
                  <th>Bid 2 Amount</th>
                  <th>Bid 2 User</th>
                  <th>Close Date</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map((auction) => (
                  <tr key={auction.id}>
                    <td>
                      {" "}
                      <a
                        href={`https://auction.whois.ai/auctions/view/${auction.domain_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {auction.domain_name}
                      </a>
                    </td>
                    <td>{auction.domain_version}</td>
                    <td>{auction.total_bids}</td>
                    <td>{auction.bid1_amount}</td>
                    <td
                      onClick={() => handleUserClick(auction.bid1_user)}
                      className="user-link"
                    >
                      {auction.bid1_user}
                    </td>
                    <td>{auction.bid2_amount}</td>
                    <td
                      onClick={() => handleUserClick(auction.bid2_user)}
                      className="user-link"
                    >
                      {auction.bid2_user}
                    </td>
                    <td>{new Date(auction.close_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="page-navigation">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </button>
            <span>
              Rows[{totalItems}] Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuctionList;