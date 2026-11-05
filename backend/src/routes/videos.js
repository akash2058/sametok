const router = require('express').Router();
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');
const auth = require('../middleware/auth');
const Video = require('../models/Video');
const Comment = require('../models/Comment');

const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const publicUrl = key =>
  process.env.CDN_URL
    ? `${process.env.CDN_URL}/${key}`
    : `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

// 1) Client asks for a presigned upload URL (video goes straight to S3)
router.post('/upload-url', auth, async (req, res, next) => {
  try {
    const { caption = '', contentType = 'video/mp4' } = req.body;
    if (!ALLOWED_TYPES.includes(contentType))
      return res.status(400).json({ message: 'Unsupported video type' });

    const ext = contentType.split('/')[1];
    const key = `videos/${req.user.id}/${Date.now()}.${ext}`;
    const video = await Video.create({ owner: req.user.id, caption, s3Key: key });

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 300 }
    );
    res.json({ uploadUrl, videoId: video._id });
  } catch (err) {
    next(err);
  }
});

// 2) Client confirms the upload finished
router.post('/:id/complete', auth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (!video.owner.equals(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    video.videoUrl = publicUrl(video.s3Key);
    video.status = 'ready'; // later: set to 'processing' and queue a transcode job
    await video.save();
    res.json(video);
  } catch (err) {
    next(err);
  }
});

// Feed with cursor pagination (must come before '/:id')
router.get('/feed', async (req, res, next) => {
  try {
    const query = { status: 'ready' };
    if (req.query.cursor) query.createdAt = { $lt: new Date(req.query.cursor) };

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('owner', 'username');

    res.json({
      videos,
      nextCursor: videos.length === 10 ? videos[videos.length - 1].createdAt : null,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('owner', 'username');
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    next(err);
  }
});

// Like / unlike (toggle)
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const liked = video.likes.some(u => u.equals(req.user.id));
    if (liked) video.likes.pull(req.user.id);
    else video.likes.push(req.user.id);
    video.likeCount = video.likes.length;
    await video.save();

    res.json({ liked: !liked, likeCount: video.likeCount });
  } catch (err) {
    next(err);
  }
});

// Comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await Comment.find({ video: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'username');
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comments', auth, async (req, res, next) => {
  try {
    if (!req.body.text) return res.status(400).json({ message: 'Text required' });
    const comment = await Comment.create({
      video: req.params.id,
      user: req.user.id,
      text: req.body.text,
    });
    await Video.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// Delete own video
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (!video.owner.equals(req.user.id)) return res.status(403).json({ message: 'Forbidden' });

    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: video.s3Key }));
    await Comment.deleteMany({ video: video._id });
    await video.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;