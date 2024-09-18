import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const getAuctionBidders = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/auction-bidders`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBidderNote = async (bidderId, updatedNote, noteUpdatedBy) => {
  try {
    const response = await axios.put(`${API_URL}/auction-bidders/${bidderId}/note`, {
      updatedNote,
      noteUpdatedBy
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};