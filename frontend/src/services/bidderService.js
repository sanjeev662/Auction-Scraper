import axios from 'axios';
const config = require('../utils/config');

export const getAuctionBidders = async (params) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${config.API_URL}/auction-bidders`, { params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
     });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBidderNote = async (bidderId, updatedNote, noteUpdatedBy) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${config.API_URL}/auction-bidders/${bidderId}/note`, {
      updatedNote,
      noteUpdatedBy
    },{
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};