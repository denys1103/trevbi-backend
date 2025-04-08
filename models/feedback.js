const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  missingIngredient: {
    type: String,
  },
  challengeIngredient: {
    type: String,
  },
  reportIssue: {
    type: String,
  },
  message: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('feedback', feedbackSchema);
