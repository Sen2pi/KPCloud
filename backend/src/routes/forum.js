const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  addReply,
  toggleLike,
  getForumStats,
  deletePost
} = require('../controllers/forumController');
const auth = require('../middleware/auth');

const router = express.Router();

// TEMPORARIAMENTE SEM VALIDAÇÕES PARA DEBUG
router.get('/posts', getPosts);
router.get('/posts/:postId', getPost);
router.get('/stats', getForumStats);

// Rotas protegidas SEM validações (temporário)
router.post('/posts', auth, createPost);
router.post('/posts/:postId/replies', auth, addReply);
router.post('/posts/:postId/like', auth, toggleLike);
router.delete('/posts/:postId', auth, deletePost);

module.exports = router;
