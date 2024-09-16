import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export function scrapeAuctions(startPage, endPage, username, password, sortBy, sortDirection, onDataReceived, onError, onComplete) {
  const source = axios.CancelToken.source();

  axios.post(`${API_URL}/scrape`, 
    { startPage, endPage, username, password, sortBy, sortDirection },
    {
      cancelToken: source.token,
      responseType: 'text',
      headers: {
        'Accept': 'text/event-stream'
      }
    })
    .then(response => {
      const lines = response.data.split('\n');
      lines.forEach(line => {
        if (line.trim().startsWith('data:')) {
          const jsonData = line.trim().substring(5);
          try {
            const data = JSON.parse(jsonData);
            console.log("Received data:", data);
            if (data.done) {
              onComplete(data.errors);
            } else if (data.error) {
              onError(data.error);
            } else {
              onDataReceived(data);
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
      });
    })
    .catch(error => {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
      } else {
        onError('Request failed:', error);
      }
    })
    .finally(() => {
      onComplete();
    });

  return () => {
    source.cancel('Operation canceled by the user.');
  };
}

export const getAuctions = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/auctions`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserBidStats = async (username) => {
  try {
    const response = await axios.get(`${API_URL}/user-stats/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};