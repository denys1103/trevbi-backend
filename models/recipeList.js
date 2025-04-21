const mongoose = require('mongoose');

const recipeListSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
  },
  img: {
    type: String,
  },
  text: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('recipeList', recipeListSchema);
