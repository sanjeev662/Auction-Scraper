const auctionBidderDao = require('../dao/auctionBidderDao');

const getAuctionBidders = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'bidder_name', sortOrder = 'asc', search } = req.query;
    const bidders = await auctionBidderDao.getAuctionBidders(page, limit, sortBy, sortOrder, search);
    res.json(bidders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateBidderNote = async (req, res) => {
  try {
    const { bidderId } = req.params;
    const { updatedNote, noteUpdatedBy } = req.body;
    await auctionBidderDao.updateBidderNote(bidderId, updatedNote, noteUpdatedBy);
    res.json({ message: 'Note updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAuctionBidders,
  updateBidderNote
};