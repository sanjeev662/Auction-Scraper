const db = require('../config/database');

const getAuctionBidders = async (page, limit, sortBy, sortOrder, search) => {
  let baseQuery = 'FROM auction_bidders WHERE 1=1';
  const params = [];

  if (search) {
    baseQuery += ' AND bidder_name LIKE ?';
    params.push(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const dataQuery = `SELECT * ${baseQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (page - 1) * limit);

  try {
    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    const totalItems = countResult[0]?.total || 0;

    const [results] = await db.query(dataQuery, params);

    return {
      bidders: results,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page)
    };
  } catch (error) {
    console.error('Error executing getAuctionBidders query:', error);
    throw error;
  }
};

const updateBidderNote = async (bidderId, updatedNote, noteUpdatedBy) => {
  const query = `
    UPDATE auction_bidders
    SET notes = ?, note_updatedby = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  try {
    await db.query(query, [updatedNote, noteUpdatedBy, bidderId]);
  } catch (error) {
    console.error('Error updating bidder note:', error);
    throw error;
  }
};

module.exports = {
  getAuctionBidders,
  updateBidderNote
};