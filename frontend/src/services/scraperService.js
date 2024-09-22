import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export async function scrapeAuctions(startPage, endPage, username, password, sortBy, sortDirection, actionType) {
  const source = axios.CancelToken.source();
  const token = localStorage.getItem('token');

  try {
    const response = await axios.post(`${API_URL}/scrape`, 
      { startPage, endPage, username, password, sortBy, sortDirection, actionType },
      {
        cancelToken: source.token,
        responseType: 'text',
        headers: {
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`
        }
      });

    const lines = response.data.split('\n');
    const data = lines
      .filter(line => line.trim().startsWith('data:'))
      .map(line => JSON.parse(line.trim().substring(5)));

    return data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
    } else if (error.response && error.response.status === 404) {
      throw new Error('Authentication failed. Please check your credentials.');
    } else {
      throw new Error('Request failed: ' + error.message);
    }
  } finally {
    source.cancel('Operation canceled by the user.');
  };
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