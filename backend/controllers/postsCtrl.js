// Import des modèles
const { Post, User } = require('../models');
const { Op } = require("sequelize");
const Yup = require("yup");

// ------------------ SCHÉMAS YUP ------------------
const postSchema = Yup.object({
  id_client: Yup.number()
    .required("L'identifiant du client est obligatoire")
    .positive("L'ID doit être positif")
    .integer("L'ID doit être un entier"),
  appointment_date: Yup.date()
    .required("La date du rendez-vous est obligatoire")
    .typeError("La date du rendez-vous n'est pas valide"),
  start_time: Yup.string()
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Heure de début invalide (format HH:MM)")
    .required("L'heure de début est obligatoire"),
  end_time: Yup.string()
    .matches(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Heure de fin invalide (format HH:MM)")
    .required("L'heure de fin est obligatoire"),
});

// Fonction pour vérifier l'heure
function isValidRoundedTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  if (hour < 7 || hour > 20) return false; // entre 7h et 20h
  if (minute !== 0 && minute !== 30) return false; // minutes = 0 ou 30
  return true;
}

// ------------------ CREATE ------------------
exports.createPost = async (req, res) => {
  try {
    // Validation avec Yup
    const validatedData = await postSchema.validate(req.body, { abortEarly: false });
    const { id_client, appointment_date, start_time, end_time } = validatedData;

    // Validation horaires arrondis
    if (!isValidRoundedTime(start_time) || !isValidRoundedTime(end_time)) {
      return res.status(400).json({ message: "Les heures doivent être entre 7h et 20h et arrondies à 00 ou 30" });
    }

    // Vérifie que end_time > start_time
    if (start_time >= end_time) {
      return res.status(400).json({ message: "L'heure de fin doit être après l'heure de début" });
    }

    // Vérifie que le client existe
    const user = await User.findByPk(id_client);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Vérifie les conflits côté admin
    const adminConflict = await Post.findOne({
      where: {
        id_admin: req.user.id,
        appointment_date,
        [Op.or]: [
          { start_time: { [Op.between]: [start_time, end_time] } },
          { end_time: { [Op.between]: [start_time, end_time] } },
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
      return res.status(400).json({ message: "L’admin a déjà un rendez-vous à cet horaire." });
    }

    // Vérifie les conflits côté client
    const clientConflict = await Post.findOne({
      where: {
        id_client,
        appointment_date,
        [Op.or]: [
          { start_time: { [Op.between]: [start_time, end_time] } },
          { end_time: { [Op.between]: [start_time, end_time] } },
          {
            [Op.and]: [
              { start_time: { [Op.lte]: start_time } },
              { end_time: { [Op.gte]: end_time } },
            ],
          },
        ],
      },
    });
    if (clientConflict) {
      return res.status(400).json({ message: "Cet élève a déjà un rendez-vous à cet horaire." });
    }

    // Création du RDV
    const post = await Post.create({
      id_admin: req.user.id,
      id_client,
      appointment_date,
      start_time,
      end_time,
    });

    return res.status(201).json(post);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.errors });
    }
    console.error("Erreur createPost:", err);
    return res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// ------------------ UPDATE ------------------
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_client, appointment_date, start_time, end_time } = req.body;

    // Validation conditionnelle avec Yup
    const updateSchema = Yup.object({
      id_client: Yup.number().positive().integer(),
      appointment_date: Yup.date().typeError("Date invalide"),
      start_time: Yup.string().matches(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Heure de début invalide"),
      end_time: Yup.string().matches(/^([0-1]\d|2[0-3]):[0-5]\d$/, "Heure de fin invalide"),
    });
    await updateSchema.validate(req.body, { abortEarly: false });

    // Validation horaires arrondis
    if ((start_time && !isValidRoundedTime(start_time)) || (end_time && !isValidRoundedTime(end_time))) {
      return res.status(400).json({ message: "Les heures doivent être entre 7h et 20h et arrondies à 00 ou 30" });
    }

    // Vérifie que end_time > start_time si les deux sont présents
    if (start_time && end_time && start_time >= end_time) {
      return res.status(400).json({ message: "L'heure de fin doit être après l'heure de début" });
    }

    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: 'RDV introuvable' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    if (id_client) {
      const user = await User.findByPk(id_client);
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
      post.id_client = id_client;
    }

    if (appointment_date) post.appointment_date = appointment_date;
    if (start_time) post.start_time = start_time;
    if (end_time) post.end_time = end_time;

    await post.save();
    return res.status(200).json(post);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.errors });
    }
    console.error("Erreur updatePost:", err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ------------------ AUTRES FONCTIONS (inchangées) ------------------
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { is_deleted: false },
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'], where: { is_deleted: false }, required: false },
        { model: User, as: 'Client', attributes: ['id', 'firstname', 'lastname'], where: { is_deleted: false }, required: false }
      ],
      order: [['appointment_date', 'ASC'], ['start_time', 'ASC']]
    });
    return res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getMyPosts = async (req, res) => {
  try {
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

exports.getOnePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id, {
      include: [
        { model: User, as: 'Admin', attributes: ['id', 'firstname', 'lastname'] },
        { model: User, as: 'Client', attributes: ['id', 'firstname', 'lastname'] }
      ]
    });
    if (!post) return res.status(404).json({ message: 'RDV introuvable' });
    if (req.user.role !== 'admin' && req.user.id !== post.id_client) {
      return res.status(403).json({ message: 'Accès interdit' });
    }
    return res.status(200).json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ message: 'RDV introuvable' });
    await post.destroy();
    return res.status(200).json({ message: 'RDV supprimé' });
  } catch (err) {
    console.error("Erreur deletePost:", err);
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};