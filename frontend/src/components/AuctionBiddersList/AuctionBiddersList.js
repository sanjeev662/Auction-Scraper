import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAuctionBidders, updateBidderNote } from '../../services/bidderService';
import './AuctionBiddersList.css';

const AuctionBiddersList = () => {
  const [bidders, setBidders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('bidder_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [editingBidder, setEditingBidder] = useState(null);
  const [editNote, setEditNote] = useState('');

  const fetchBidders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAuctionBidders({
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        search
      });
      setBidders(response.bidders);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error('Error fetching bidders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, search]);

  useEffect(() => {
    fetchBidders();
  }, [fetchBidders]);

  const handleSort = (event) => {
    const [newSortBy, newSortOrder] = event.target.value.split('-');
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const resetFilters = () => {
    setSearch('');
    setPageSize(20);
    setSortBy('bidder_name');
    setSortOrder('asc');
    setPage(1);
  };

  const handleEditNote = (bidder) => {
    setEditingBidder(bidder);
    setEditNote(bidder.notes || '');
  };

  const handleUpdateNote = async () => {
    try {
      await updateBidderNote(editingBidder.id, editNote, 'current_user'); // Replace 'current_user' with actual user
      setEditingBidder(null);
      fetchBidders(); // Refresh the list
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  return (
    <div className="auction-bidders-list">
      <h1>Auction Bidders List</h1>
      <div className="filters-container">
        <div className="filters-row">
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search bidder name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button onClick={resetFilters} className="reset-button">
              Reset Filters
            </button>
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
              <option value="bidder_name-asc">Name (A-Z)</option>
              <option value="bidder_name-desc">Name (Z-A)</option>
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="auction-bidders-loading-spinner">
          <div className="auction-bidders-spinner"></div>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Bidder Name</th>
                  <th>Notes</th>
                  <th>Note Updated By</th>
                  <th>View Won Auctions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bidders.map((bidder) => (
                  <tr key={bidder.id}>
                    <td>{bidder.bidder_name}</td>
                    <td title={bidder.notes}>
                      {bidder.notes && bidder.notes.length > 70
                        ? bidder.notes.substring(0, 70) + '...'
                        : bidder.notes}
                    </td>
                    <td>{bidder.note_updatedby || 'N/A'}</td>
                    <td>
                      <Link to={`/user/${bidder.bidder_name}`} state={{ fromBiddersList: true }}>View</Link>
                    </td>
                    {/* <td>
                      <button onClick={() => handleEditNote(bidder)}>Edit Note</button>
                    </td> */}
                                        <td>
                      <a href="#" onClick={(e) => { e.preventDefault(); handleEditNote(bidder); }}>Edit Note</a>
                    </td>
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
      {editingBidder && (
        <div className="edit-note-popup">
          <h2>Edit Note for {editingBidder.bidder_name}</h2>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            rows={4}
            cols={50}
          />
          <div>
            <button onClick={handleUpdateNote}>Update</button>
            <button onClick={() => setEditingBidder(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionBiddersList;