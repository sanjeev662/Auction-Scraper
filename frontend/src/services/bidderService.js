import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const getAuctionBidders = async (params) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/auction-bidders`, { params,
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
    const response = await axios.put(`${API_URL}/auction-bidders/${bidderId}/note`, {
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