const mongoose = require('mongoose');

const historyActiveUserSchema = new mongoose.Schema({
  fullname: {
    type: String,
  },
  email: {
    type: String,
  },
  status: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('historyActiveUser', historyActiveUserSchema);
