const db = require('../config/database');

const saveAuctions = async (auctions) => {
  try {
    await db.query('START TRANSACTION');

    // Insert into auctions table
    const auctionQuery = `
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

    const auctionValues = auctions.map(auction => [
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

    await db.query(auctionQuery, [auctionValues]);

    // Insert or update auction_bidders
    for (const auction of auctions) {
      const bidders = [auction.top_bids[0]?.user, auction.top_bids[1]?.user].filter(Boolean);
      
      for (const bidder of bidders) {
        const bidderQuery = `
          INSERT INTO auction_bidders (bidder_name)
          VALUES (?)
          ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)
        `;
        await db.query(bidderQuery, [bidder]);
        
        const [bidderResult] = await db.query('SELECT LAST_INSERT_ID() as id');
        const bidderId = bidderResult[0].id;

        // Get auction id
        const [auctionResult] = await db.query('SELECT id FROM auctions WHERE domain_id = ?', [auction.domain_id]);
        const auctionId = auctionResult[0].id;

        // Insert into auction_bidder_auctions
        const relationQuery = `
          INSERT IGNORE INTO auction_bidder_auctions (auction_bidder_id, auction_id)
          VALUES (?, ?)
        `;
        await db.query(relationQuery, [bidderId, auctionId]);
      }
    }

    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
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
  const summaryQuery = `
    SELECT 
      SUM(CASE WHEN a.bid1_user = ? THEN 1 ELSE 0 END) as first_place_bids,
      SUM(CASE WHEN a.bid2_user = ? THEN 1 ELSE 0 END) as second_place_bids
    FROM auctions a
    WHERE a.bid1_user = ? OR a.bid2_user = ?
  `;

  const detailsQuery = `
    SELECT 
      a.domain_name,
      CASE WHEN a.bid1_user = ? THEN a.bid1_amount ELSE a.bid2_amount END as bid_amount,
      CASE WHEN a.bid1_user = ? THEN a.bid1_date ELSE a.bid2_date END as bid_date,
      CASE WHEN a.bid1_user = ? THEN 1 ELSE 2 END as position
    FROM auctions a
    WHERE a.bid1_user = ? OR a.bid2_user = ?
    ORDER BY CASE WHEN a.bid1_user = ? THEN a.bid1_date ELSE a.bid2_date END DESC
  `;

  try {
    const [summaryResults] = await db.query(summaryQuery, [username, username, username, username]);
    const [detailsResults] = await db.query(detailsQuery, [username, username, username, username, username, username]);

    const stats = summaryResults[0];
    stats.bid_details = detailsResults.map(detail => ({
      domain_name: detail.domain_name,
      bid_amount: parseFloat(detail.bid_amount),
      bid_date: detail.bid_date,
      position: parseInt(detail.position)
    }));

    return stats;
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