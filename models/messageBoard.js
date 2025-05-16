const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
}, { _id: true });

const messageBoardSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
  },
  note: {
    type: String,
  },
  photo: {
    type: String,
  },
  status: {
    type: Number,
    default: 0,
  },
  like: { type: [] },
  unlike: { type: [] },
  comment: [commentSchema],
  date: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('MessageBoard', messageBoardSchema);
