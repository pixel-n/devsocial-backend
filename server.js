const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// [FEATURE: DATABASE CONNECTION]
const MONGO_URI = "mongodb+srv://nawalkashif446_db_user:cnkNwVin4p633@cluster0.aqeyksq.mongodb.net/myDatabase?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// [FEATURE: SCHEMAS & MODELS]
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, default: 'General' },
  // Advanced Reactions
  reactions: {
    fire: { type: Number, default: 0 },
    insightful: { type: Number, default: 0 },
    shipped: { type: Number, default: 0 }
  },
  // Community Poll Support
  isPoll: { type: Boolean, default: false },
  pollQuestion: { type: String },
  pollOptions: [{
    text: String,
    votes: { type: Number, default: 0 }
  }],
  comments: [{ 
    text: String, 
    author: String, 
    createdAt: { type: Date, default: Date.now } 
  }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);

// [FEATURE: REST API ENDPOINTS]

// 1. Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create post or poll
app.post('/api/posts', async (req, res) => {
  try {
    const { content, author, category, isPoll, pollQuestion, pollOptions } = req.body;
    const newPost = new Post({
      content,
      author,
      category: category || 'General',
      isPoll: isPoll || false,
      pollQuestion: pollQuestion || '',
      pollOptions: pollOptions ? pollOptions.map(opt => ({ text: opt, votes: 0 })) : []
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Multi-reactions (fire, insightful, shipped)
app.put('/api/posts/:id/react', async (req, res) => {
  try {
    const { type } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    if (post.reactions[type] !== undefined) {
      post.reactions[type] += 1;
      await post.save();
    }
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Vote on Poll
app.put('/api/posts/:id/vote', async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post || !post.isPoll) return res.status(404).json({ error: 'Poll not found' });

    if (post.pollOptions[optionIndex]) {
      post.pollOptions[optionIndex].votes += 1;
      await post.save();
    }
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Add comment
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({ text: req.body.text, author: req.body.author });
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Auth login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, name } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name: name || 'Developer' });
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));