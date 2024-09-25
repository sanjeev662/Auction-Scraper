import axios from 'axios';
const config = require('../utils/config');

export const login = async (username, password) => {
  const response = await axios.post(`${config.API_URL}/auth/login`, { username, password });
  return response.data.token;
};