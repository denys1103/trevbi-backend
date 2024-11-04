const mongoose = require('mongoose');

const ingredientsToAvoidSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  area: {
    type: Number, //0:food additives, 1:artificial sweeteners 2:artificial colors
    default: 0,
  },
  description: {
    type: String,
  },
  grade: {
    type: Number, //0:red, 1:yellow
    default: 0,
  },
  source: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('ingredientsToAvoid', ingredientsToAvoidSchema);
