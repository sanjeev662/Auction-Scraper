const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');
const auctionBidderController = require('../controllers/auctionBidderController');
const authMiddleware = require('../middleware/authMiddleware');

// Existing routes
router.post('/scrape', authMiddleware, scraperController.scrapeAuctions);
router.get('/auctions', authMiddleware, scraperController.getAuctions);
router.get('/user-stats/:username', authMiddleware, scraperController.getUserBidStats);

// New routes for auction bidders
router.get('/auction-bidders', authMiddleware, auctionBidderController.getAuctionBidders);
router.put('/auction-bidders/:bidderId/note', authMiddleware, auctionBidderController.updateBidderNote);

module.exports = router;