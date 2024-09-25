import axios from 'axios';

const API_URL =  'http://localhost:5001';

export function scrapeAuctions(startPage, endPage, username, password, sortBy, sortDirection, actionType) {
  const token = localStorage.getItem('token');
  const eventSource = new EventSource(`${API_URL}/scrape?startPage=${startPage}&endPage=${endPage}&username=${username}&password=${password}&sortBy=${sortBy}&sortDirection=${sortDirection}&actionType=${actionType}`, {
    // headers: {
    //   'Authorization': `Bearer ${token}`
    // }
  });

  return eventSource;
}

export const getAuctions = async (params) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/auctions`, { params ,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserBidStats = async (username) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/user-stats/${username}`,{
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};