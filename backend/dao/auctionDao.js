const db = require('../config/database');

const saveAuctions = async (auctions) => {
  const query = `
    INSERT INTO auctions (domain_id, domain_name, domain_version, total_bids, domain_price, close_date, bid1_amount, bid1_user, bid1_date, bid2_amount, bid2_user, bid2_date)
    VALUES ?
    ON DUPLICATE KEY UPDATE
    domain_version = VALUES(domain_version),
    total_bids = VALUES(total_bids),
    domain_price = VALUES(domain_price),
    close_date = VALUES(close_date),
    bid1_amount = VALUES(bid1_amount),
    bid1_user = VALUES(bid1_user),
    bid1_date = VALUES(bid1_date),
    bid2_amount = VALUES(bid2_amount),
    bid2_user = VALUES(bid2_user),
    bid2_date = VALUES(bid2_date)
  `;

  const values = auctions.map(auction => [
    auction.domain_id,
    auction.domain_name,
    auction.domain_version,
    auction.total_bids,
    parseFloat(auction.domain_price.replace(/[^0-9.]/g, '')) || null,
    auction.close_date,
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

const getAuctions = async (page, limit, sortBy, sortOrder, search, closeDateStart, closeDateEnd, userSearch) => {
  let baseQuery = 'FROM auctions WHERE 1=1';
  const params = [];

  if (search) {
    baseQuery += ' AND domain_name LIKE ?';
    params.push(`%${search}%`);
  }

  if (closeDateStart && closeDateEnd) {
    baseQuery += ' AND close_date BETWEEN ? AND ?';
    params.push(closeDateStart, closeDateEnd);
  }

  if (userSearch) {
    baseQuery += ' AND (bid1_user LIKE ? OR bid2_user LIKE ?)';
    params.push(`%${userSearch}%`, `%${userSearch}%`);
  }

  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const dataQuery = `SELECT * ${baseQuery} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (page - 1) * limit);

  try {
    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    const totalItems = countResult[0]?.total || 0;

    const [results] = await db.query(dataQuery, params);

    return {
      auctions: results,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: parseInt(page)
    };
  } catch (error) {
    console.error('Error executing getAuctions query:', error);
    throw error;
  }
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

const checkDomainExists = async (domainId) => {
  const [result] = await db.query('SELECT * FROM auctions WHERE domain_id = ?', [domainId]);
  return result.length > 0;
};

const getMaxDomainVersion = async (domainName) => {
  const [result] = await db.query('SELECT MAX(domain_version) as max_version FROM auctions WHERE domain_name = ?', [domainName]);
  return result[0].max_version || 0;
};

module.exports = {
  saveAuctions,
  getAuctions,
  getUserBidStats,
  checkDomainExists,
  getMaxDomainVersion
};