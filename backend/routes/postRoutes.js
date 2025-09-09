const express = require('express');
const router = express.Router();
const postsCtrl = require('../controllers/postsCtrl');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');


// Créer un RDV → admin uniquement
router.post('/', adminMiddleware, postsCtrl.createPost);

// Mettre à jour un RDV → admin uniquement
router.put('/:id', adminMiddleware, postsCtrl.updatePost);

// Voir tous les RDV → admin dashboard
router.get('/', adminMiddleware, postsCtrl.getAllPosts);

// Voir ses propres RDV → user connecté
router.get('/me', authMiddleware(), postsCtrl.getMyPosts);

// Voir un RDV précis → admin ou user concerné
router.get('/:id', authMiddleware(), postsCtrl.getOnePost);

// Supprimer un RDV → admin uniquement
router.delete('/:id', adminMiddleware, postsCtrl.deletePost);

module.exports = router;