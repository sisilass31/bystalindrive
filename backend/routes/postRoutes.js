const express = require('express');
const router = express.Router();
const postsCtrl = require('../controllers/postsCtrl');
const csrfProtection = require('csurf')({ cookie: true });
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

// Route pour récupérer le token CSRF
router.get("/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// ------------------ CREATE POST (admin uniquement) ------------------
router.post('/', authMiddleware(), csrfProtection, postsCtrl.createPost);

// ------------------ UPDATE POST (admin uniquement) ------------------
router.put('/:id', authMiddleware(), csrfProtection, postsCtrl.updatePost);

// ------------------ GET ALL POSTS (admin dashboard) ------------------
router.get('/', authMiddleware(), postsCtrl.getAllPosts);

// ------------------ GET MY POSTS (user connecté) ------------------
router.get('/me', authMiddleware(), postsCtrl.getMyPosts);

// ------------------ GET ONE POST (admin ou user concerné) ------------------
router.get('/:id', authMiddleware(), postsCtrl.getOnePost);

// ------------------ DELETE POST (admin uniquement) ------------------
router.delete('/:id', authMiddleware(), csrfProtection, postsCtrl.deletePost);

module.exports = router;