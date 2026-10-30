const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use(cors());

const JWT_SECRET = 'devsocial_jwt_secret_key_123';
const MONGO_URI = "mongodb+srv://nawalkashif446_db_user:0Lkmen9IuRqlb5Z3@cluster0.aqeyksq.mongodb.net/myDatabase?retryWrites=true&w=majority";

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  avatar: String
});

const postSchema = new mongoose.Schema({
  author: String,
  email: String,
  avatar: String,
  title: String,
  content: String,
  category: { type: String, default: 'General' },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({ name, email, avatar });
    }

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, avatar });
    }
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST ROUTES
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const post = await Post.create({
      author: decoded.name,
      email: decoded.email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${decoded.name}`,
      title: req.body.title || 'Developer Update',
      content: req.body.content,
      category: req.body.category || 'General'
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized token' });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});