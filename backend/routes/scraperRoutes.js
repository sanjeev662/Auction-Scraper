const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

router.post('/scrape', scraperController.scrapeAuctions);
router.get('/auctions', scraperController.getAuctions);
router.get('/user-stats/:username', scraperController.getUserBidStats);

module.exports = router;