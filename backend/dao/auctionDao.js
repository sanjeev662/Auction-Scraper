const db = require('../config/database');

const saveAuctions = async (auctions) => {
  const query = `
    INSERT INTO auctions (domain_name, bid1_amount, bid1_user, bid1_date, bid2_amount, bid2_user, bid2_date)
    VALUES ?
    ON DUPLICATE KEY UPDATE
    bid1_amount = VALUES(bid1_amount),
    bid1_user = VALUES(bid1_user),
    bid1_date = VALUES(bid1_date),
    bid2_amount = VALUES(bid2_amount),
    bid2_user = VALUES(bid2_user),
    bid2_date = VALUES(bid2_date)
  `;

  const values = auctions.map(auction => [
    auction.domain_name,
    parseFloat(auction.top_bids[0]?.amount.replace(/[^0-9.]/g, '')) || null,
    auction.top_bids[0]?.user || null,
    auction.top_bids[0]?.date || null,
    parseFloat(auction.top_bids[1]?.amount.replace(/[^0-9.]/g, '')) || null,
    auction.top_bids[1]?.user || null,
    auction.top_bids[1]?.date || null
  ]);

  try {
    await db.query(query, [values]);
  } catch (error) {
    console.error('Error saving auctions:', error);
    throw error;
  }
};

const getAuctions = async (page, limit, sortBy, sortOrder, search, bid1DateStart, bid1DateEnd, userSearch) => {
  let query = 'SELECT * FROM auctions WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND domain_name LIKE ?';
    params.push(`%${search}%`);
  }

  if (bid1DateStart && bid1DateEnd) {
    query += ' AND bid1_date BETWEEN ? AND ?';
    params.push(bid1DateStart, bid1DateEnd);
  }

  if (userSearch) {
    query += ' AND (bid1_user LIKE ? OR bid2_user LIKE ?)';
    params.push(`%${userSearch}%`, `%${userSearch}%`);
  }

  query += ` ORDER BY ${sortBy} ${sortOrder}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (page - 1) * limit);

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const [countResult] = await db.query(countQuery, params);
  const totalItems = countResult[0].total;

  const [results] = await db.query(query, params);

  return {
    auctions: results,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: parseInt(page)
  };
};

const getUserBidStats = async (username) => {
  const query = `
    SELECT 
      COUNT(CASE WHEN bid1_user = ? THEN 1 END) as first_place_bids,
      COUNT(CASE WHEN bid2_user = ? THEN 1 END) as second_place_bids,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'domain_name', domain_name,
          'bid_amount', CASE WHEN bid1_user = ? THEN bid1_amount ELSE bid2_amount END,
          'bid_date', CASE WHEN bid1_user = ? THEN bid1_date ELSE bid2_date END,
          'position', CASE WHEN bid1_user = ? THEN 1 ELSE 2 END
        )
      ) as bid_details
    FROM auctions
    WHERE bid1_user = ? OR bid2_user = ?
  `;

  try {
    const [results] = await db.query(query, [username, username, username, username, username, username, username]);
    return results[0];
  } catch (error) {
    console.error('Error getting user bid stats:', error);
    throw error;
  }
};

module.exports = {
  saveAuctions,
  getAuctions,
  getUserBidStats
};