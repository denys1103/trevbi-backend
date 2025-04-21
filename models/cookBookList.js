const mongoose = require('mongoose');

const cookBookListSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
  },
  recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'recipeList' }],
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('cookBookList', cookBookListSchema);
