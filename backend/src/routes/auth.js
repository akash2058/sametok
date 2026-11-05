const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = user =>
  jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    res.status(201).json({ token: sign(user), user: { id: user._id, username } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: sign(user), user: { id: user._id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;