const jwt = require('jsonwebtoken');
const { users, addUser } = require('../dao/usersDao');

const login = async (username, password) => {
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  return jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const register = async (username, password) => {
  addUser(username, password);
  return { message: 'User registered successfully' };
};

module.exports = {
  login,
  verifyToken,
  register
};