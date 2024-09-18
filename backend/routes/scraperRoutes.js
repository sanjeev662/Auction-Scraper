const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');
const auctionBidderController = require('../controllers/auctionBidderController');

// Existing routes
router.post('/scrape', scraperController.scrapeAuctions);
router.get('/auctions', scraperController.getAuctions);
router.get('/user-stats/:username', scraperController.getUserBidStats);

// New routes for auction bidders
router.get('/auction-bidders', auctionBidderController.getAuctionBidders);
router.put('/auction-bidders/:bidderId/note', auctionBidderController.updateBidderNote);

module.exports = router;