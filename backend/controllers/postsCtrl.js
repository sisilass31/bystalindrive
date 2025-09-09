const { Post, User } = require('../models');
// Sequelize fournit des "opérateurs" (Op) pour écrire des conditions complexes : AND, OR, <, >, etc.
const { Op } = require("sequelize");

// ------------------ CREATE ------------------
exports.createPost = async (req, res) => {
  console.log("createPost appelé avec body :", req.body);

  try {
    const { id_user, date, start_time, end_time } = req.body;

    // Vérif élève existe
    const user = await User.findByPk(id_user);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Vérif chevauchement ADMIN (même date + horaires qui se croisent)
    const adminConflict = await Post.findOne({
      where: {
        id_admin: req.user.id,
        date,
        [Op.or]: [
          {
            start_time: { [Op.between]: [start_time, end_time] },
          },
          {
            end_time: { [Op.between]: [start_time, end_time] },
          },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: start_time } },
              { end_time: { [Op.gte]: end_time } },
            ],
          },
        ],
      },
    });

    if (adminConflict) {
      return res
        .status(400)
        .json({ message: "❌ L’admin a déjà un rendez-vous à cet horaire." });
    }

    // Vérif chevauchement ELEVE (même logique)
    const eleveConflict = await Post.findOne({
      where: {
        id_user,
        date,
        [Op.or]: [
          {
            start_time: { [Op.between]: [start_time, end_time] },
          },
          {
            end_time: { [Op.between]: [start_time, end_time] },
          },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: start_time } },
              { end_time: { [Op.gte]: end_time } },
            ],
          },
        ],
      },
    });

    if (eleveConflict) {
      return res
        .status(400)
        .json({ message: "❌ Cet élève a déjà un rendez-vous à cet horaire." });
    }

    // Si pas de conflit → créer le rdv
    const post = await Post.create({
      id_admin: req.user.id, // l’admin connecté
      id_user,
      date,
      start_time,
      end_time,
    });

    return res.status(201).json(post);
  } catch (err) {
    console.error("❌ Erreur createPost:", err);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: err.message });
  }
};

// ------------------ UPDATE ------------------
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user, date, start_time, end_time } = req.body;

    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: 'RDV introuvable' });

    // Seul un admin peut modifier (tu as déjà le middleware mais on sécurise)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    // Si on change le user du RDV → vérifier que l’utilisateur existe
    if (id_user) {
      const user = await User.findByPk(id_user);
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
      post.id_user = id_user;
    }

    // Mise à jour des champs si présents
    if (date) post.date = date;
    if (start_time) post.start_time = start_time;
    if (end_time) post.end_time = end_time;

    await post.save();

    return res.status(200).json(post);
  } catch (err) {
    console.error("❌ Erreur updatePost:", err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ------------------ GET ALL POSTS ADMIN ------------------
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'] },
        { model: User, as: 'User', attributes: ['id', 'firstname', 'lastname'] }
      ],
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    return res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ------------------ GET MY POSTS (USER) ------------------
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { id_user: req.user.id },
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'] },
        { model: User, as: 'User', attributes: ['id', 'firstname', 'lastname'] }
      ],
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    return res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ------------------ GET ONE POST ------------------
exports.getOnePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id, {
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'] },
        { model: User, as: 'User', attributes: ['id', 'firstname', 'lastname'] }
      ]
    });

    if (!post) return res.status(404).json({ message: 'RDV introuvable' });

    if (req.user.role !== 'admin' && req.user.id !== post.id_user) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    return res.status(200).json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ------------------ DELETE ------------------
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: 'RDV introuvable' });

    await post.destroy();
    return res.status(200).json({ message: 'RDV supprimé' });
  } catch (err) {
    console.error("❌ Erreur deletePost:", err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};