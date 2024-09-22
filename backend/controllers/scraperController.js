const scraperService = require('../services/scraperService');
const auctionDao = require('../dao/auctionDao');

const scrapeAuctions = async (req, res) => {
  const { startPage, endPage, username, password, sortBy, sortDirection, actionType } = req.query;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await scraperService.scrapeAuctions(startPage, endPage, username, password, sortBy, sortDirection, actionType, sendEvent);
    sendEvent({ type: 'scraping_complete', message: 'Scraping completed successfully!' });
  } catch (error) {
    sendEvent({ type: 'error', message: error.message });
  } finally {
    res.end();
  }
};

const getAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'bid1_date', sortOrder = 'desc', search, closeDateStart, closeDateEnd, userSearch } = req.query;
    const auctions = await auctionDao.getAuctions(page, limit, sortBy, sortOrder, search, closeDateStart, closeDateEnd, userSearch);
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserBidStats = async (req, res) => {
  try {
    const { username } = req.params;
    const stats = await auctionDao.getUserBidStats(username);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  scrapeAuctions,
  getAuctions,
  getUserBidStats
};