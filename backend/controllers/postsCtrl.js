// Import des modèles Post et User (les classes POO Sequelize)
const { Post, User } = require('../models');

// Import des opérateurs Sequelize (AND, OR, BETWEEN, etc.)
const { Op } = require("sequelize");

// ------------------ CREATE ------------------
exports.createPost = async (req, res) => {

  try {
    // Récupère les infos du RDV envoyées depuis le front
    const { id_client, appointment_date, start_time, end_time } = req.body;

    // Vérifie que le client existe dans la base
    const user = await User.findByPk(id_client);
    // Si il n'existe pas → renvoie message
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Vérifie si l'admin a déjà un RDV qui chevauche le nouvel horaire
    const adminConflict = await Post.findOne({
      where: {
        id_admin: req.user.id, // admin connecté
        appointment_date,      // même date
        [Op.or]: [             // conditions de chevauchement
          { start_time: { [Op.between]: [start_time, end_time] } },
          { end_time: { [Op.between]: [start_time, end_time] } },
          { [Op.and]: [
              { start_time: { [Op.lte]: start_time } },
              { end_time: { [Op.gte]: end_time } }
            ] 
          },
        ],
      },
    });

    // Si conflit → renvoie erreur
    if (adminConflict) {
      return res.status(400)
        .json({ message: "L’admin a déjà un rendez-vous à cet horaire." });
    }

    // Vérifie si le client a déjà un RDV qui chevauche le nouvel horaire
    const eleveConflict = await Post.findOne({
      where: {
        id_client,
        appointment_date,
        [Op.or]: [
          { start_time: { [Op.between]: [start_time, end_time] } },
          { end_time: { [Op.between]: [start_time, end_time] } },
          { [Op.and]: [
              { start_time: { [Op.lte]: start_time } },
              { end_time: { [Op.gte]: end_time } }
            ] 
          },
        ],
      },
    });

    // Si conflit → renvoie erreur
    if (eleveConflict) {
      return res.status(400)
        .json({ message: "Cet élève a déjà un rendez-vous à cet horaire." });
    }

    // Pas de conflit → création du RDV en base
    const post = await Post.create({
      id_admin: req.user.id, // admin connecté
      id_client,
      appointment_date,
      start_time,
      end_time,
    });

    // Renvoie le RDV créé au front
    return res.status(201).json(post);

  } catch (err) {
    // Erreur serveur → log et renvoi 500
    console.error("Erreur createPost:", err);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ------------------ UPDATE ------------------
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params; // ID du RDV à modifier
    const { id_client, appointment_date, start_time, end_time } = req.body;

    // Récupère le RDV depuis la base
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: 'RDV introuvable' });

    // Vérifie que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    // Si changement de client → vérifie que le client existe
    if (id_client) {
      const user = await User.findByPk(id_client);
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
      post.id_client = id_client;
    }

    // Mise à jour des champs si fournis
    if (appointment_date) post.appointment_date = appointment_date;
    if (start_time) post.start_time = start_time;
    if (end_time) post.end_time = end_time;

    // Sauvegarde les modifications en base
    await post.save();

    return res.status(200).json(post);
  } catch (err) {
    console.error("Erreur updatePost:", err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ------------------ GET ALL POSTS ADMIN ------------------
exports.getAllPosts = async (req, res) => {
  try {
    // Récupère tous les RDV non supprimés avec les infos Admin et Client
    const posts = await Post.findAll({
      where: { is_deleted: false }, // ignore les RDV archivés
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'], where: { is_deleted: false }, required: false },
        { model: User, as: 'Client', attributes: ['id', 'firstname', 'lastname'], where: { is_deleted: false }, required: false }
      ],
      order: [['appointment_date', 'ASC'], ['start_time', 'ASC']] // tri par date puis heure
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
    // Récupère les RDV pour le client connecté
    const posts = await Post.findAll({
      where: { id_client: req.user.id },
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'] },
        { model: User, as: 'Client', attributes: ['id', 'firstname', 'lastname'] }
      ],
      order: [['appointment_date', 'ASC'], ['start_time', 'ASC']]
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
    const { id } = req.params; // ID du RDV à récupérer

    // Recherche du RDV avec les infos Admin et Client
    const post = await Post.findByPk(id, {
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'] },
        { model: User, as: 'Client', attributes: ['id', 'firstname', 'lastname'] }
      ]
    });

    if (!post) return res.status(404).json({ message: 'RDV introuvable' });

    // Vérifie que seul l'admin ou le client concerné peut voir ce RDV
    if (req.user.role !== 'admin' && req.user.id !== post.id_client) {
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
    const { id } = req.params; // ID du RDV à supprimer

    // Récupère le RDV
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: 'RDV introuvable' });

    // Supprime physiquement le RDV de la base
    await post.destroy();

    return res.status(200).json({ message: 'RDV supprimé' });
  } catch (err) {
    console.error("❌ Erreur deletePost:", err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};