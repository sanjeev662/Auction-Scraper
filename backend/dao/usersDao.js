let users = [
  { username: 'sanjeev', password: 'sanjeev@12666' },
  { username: 'yash', password: 'yash@12666' },
  { username: 'prakhar', password: 'prakhar@12666' },
  { username: 'test', password: 'test@12666' },
  { username: 'admin', password: 'admin@12666' }
];

const addUser = (username, password) => {
  users.push({ username, password });
};

module.exports = {
  users,
  addUser
};