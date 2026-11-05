const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Video = require('../models/Video');

// Profile + their videos
router.get('/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-passwordHash -email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const videos = await Video.find({ owner: user._id, status: 'ready' }).sort({ createdAt: -1 });
    res.json({
      user: {
        id: user._id,
        username: user.username,
        followers: user.followers.length,
        following: user.following.length,
      },
      videos,
    });
  } catch (err) {
    next(err);
  }
});

// Follow / unfollow (toggle)
router.post('/:username/follow', auth, async (req, res, next) => {
  try {
    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target._id.equals(req.user.id))
      return res.status(400).json({ message: 'You cannot follow yourself' });

    const me = await User.findById(req.user.id);
    const following = me.following.some(id => id.equals(target._id));

    if (following) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }
    await me.save();
    await target.save();

    res.json({ following: !following });
  } catch (err) {
    next(err);
  }
});

module.exports = router;