const express = require('express');
const router = express.Router();
const postsCtrl = require('../controllers/postsCtrl');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

// ------------------ CREATE POST (admin uniquement) ------------------
router.post('/', authMiddleware(), postsCtrl.createPost);

// ------------------ UPDATE POST (admin uniquement) ------------------
router.put('/:id', authMiddleware(), postsCtrl.updatePost);

// ------------------ GET ALL POSTS (admin dashboard) ------------------
router.get('/', authMiddleware(), postsCtrl.getAllPosts);

// ------------------ GET MY POSTS (user connecté) ------------------
router.get('/me', authMiddleware(), postsCtrl.getMyPosts);

// ------------------ GET ONE POST (admin ou user concerné) ------------------
router.get('/:id', authMiddleware(), postsCtrl.getOnePost);

// ------------------ DELETE POST (admin uniquement) ------------------
router.delete('/:id', authMiddleware(), postsCtrl.deletePost);

module.exports = router;