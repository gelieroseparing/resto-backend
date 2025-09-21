const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  position: String,
  profileImage: { type: String, default: '/profile.jpg' } // default profile image
});

module.exports = mongoose.model('User', userSchema);