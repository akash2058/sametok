const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    caption: { type: String, maxlength: 300 },
    s3Key: String,
    videoUrl: String,
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

videoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);