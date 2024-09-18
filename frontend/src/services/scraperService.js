import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

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
            if (data.error) {
              onError(data.error);
              if (data.type === 'AUTHENTICATION_ERROR') {
                throw new Error('Authentication failed');
              }
            } else if (data.done) {
              onComplete(data.errors);
            } else {
              onDataReceived(data);
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            onError('Error parsing server response');
          }
        }
      });
    })
    .catch(error => {
      if (axios.isCancel(error)) {
        console.log('Request canceled:', error.message);
      } else if (error.response && error.response.status === 404) {
        onError('Authentication failed. Please check your credentials.');
      } else {
        onError('Request failed: ' + error.message);
      }
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