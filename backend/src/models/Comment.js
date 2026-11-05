const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);