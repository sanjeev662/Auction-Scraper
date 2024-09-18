import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getUserBidStats } from '../../services/scraperService';
import './UserDetails.css';

const UserDetails = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Client-side filtering and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('bid_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [bidDateStart, setBidDateStart] = useState('');
  const [bidDateEnd, setBidDateEnd] = useState('');
  const [positionFilter, setPositionFilter] = useState(location.state?.fromBiddersList ? '1' : 'all');

  useEffect(() => {
    const fetchUserStats = async () => {
      setIsLoading(true);
      try {
        const stats = await getUserBidStats(username);
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setError('Failed to fetch user statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [username]);

  const filteredAndSortedBids = useMemo(() => {
    if (!userStats) return [];

    let filtered = userStats.bid_details.filter(bid => {
      const matchesSearch = bid.domain_name.toLowerCase().includes(search.toLowerCase());
      const matchesDateRange = (!bidDateStart || new Date(bid.bid_date) >= new Date(bidDateStart)) &&
                               (!bidDateEnd || new Date(bid.bid_date) <= new Date(bidDateEnd));
      const matchesPosition = positionFilter === 'all' || bid.position.toString() === positionFilter;
      return matchesSearch && matchesDateRange && matchesPosition;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'bid_date') {
        return sortOrder === 'asc' ? new Date(a.bid_date) - new Date(b.bid_date) : new Date(b.bid_date) - new Date(a.bid_date);
      } else if (sortBy === 'bid_amount') {
        return sortOrder === 'asc' ? a.bid_amount - b.bid_amount : b.bid_amount - a.bid_amount;
      }
      return 0;
    });

    return filtered;
  }, [userStats, search, bidDateStart, bidDateEnd, sortBy, sortOrder, positionFilter]);

  const paginatedBids = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredAndSortedBids.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedBids, page, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedBids.length / pageSize);

  const handleSort = (event) => {
    const [newSortBy, newSortOrder] = event.target.value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const resetFilters = () => {
    setSearch('');
    setBidDateStart('');
    setBidDateEnd('');
    setPageSize(20);
    setSortBy('bid_date');
    setSortOrder('desc');
    setPage(1);
    setPositionFilter('all');
  };

  const validateDates = () => {
    if (bidDateStart && bidDateEnd && new Date(bidDateStart) > new Date(bidDateEnd)) {
      alert('Start date cannot be later than end date');
      setBidDateEnd('');
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!userStats) return <div className="error">No data found for this user</div>;

  return (
    <div className="user-details">
      <div className='user-heading'>
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
        <h2 className="user-name">Bidder Name: {username}</h2>
      </div>
      <div className='user-stats'>
      <p>Number of First Place Bids: {userStats.first_place_bids}</p>
      <p>Number of Second Place Bids: {userStats.second_place_bids}</p>
      </div>

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
              type="date"
              placeholder="Start date"
              value={bidDateStart}
              onChange={(e) => {
                setBidDateStart(e.target.value);
                validateDates();
              }}
            />
            <input
              type="date"
              placeholder="End date"
              value={bidDateEnd}
              onChange={(e) => {
                setBidDateEnd(e.target.value);
                validateDates();
              }}
            />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
            >
              <option value="all">All Positions</option>
              <option value="1">First Place</option>
              <option value="2">Second Place</option>
            </select>
          </div>
          <div className="action-buttons">
            <button onClick={resetFilters} className="reset-button">Reset Filters</button>
          </div>
        </div>
        <div className="filters-row">
          <div className="sort-filters">
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <select value={`${sortBy}-${sortOrder}`} onChange={handleSort}>
              <option value="bid_date-desc">Date (Newest First)</option>
              <option value="bid_date-asc">Date (Oldest First)</option>
              <option value="bid_amount-desc">Price (Highest First)</option>
              <option value="bid_amount-asc">Price (Lowest First)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Domain Name</th>
              <th>Bid Amount</th>
              <th>Bid Date</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBids.map((bid, index) => (
              <tr key={index}>
                <td>{bid.domain_name}</td>
                <td>{bid.bid_amount}</td>
                <td>{new Date(bid.bid_date).toLocaleString()}</td>
                <td>{bid.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="page-navigation">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
        <span>Rows[{filteredAndSortedBids.length}] Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default UserDetails;