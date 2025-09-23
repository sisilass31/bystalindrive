// URL de base de l'API
const API_URL = "http://localhost:3000";

// --- Helper pour factoriser les requêtes ---
// Vérifie la réponse HTTP, parse le JSON et gère les erreurs
async function handleResponse(res) {
  let data;
  try {
    data = await res.json(); // essaie de parser la réponse en JSON
  } catch (e) {
    throw new Error("Réponse serveur invalide (pas du JSON).");
  }

  // Si le code HTTP n'est pas OK, on lance une erreur avec le message du serveur
  if (!res.ok) {
    throw new Error(data.message || "Erreur serveur.");
  }

  return data; // retourne les données JSON
}

// ---------------- USERS ----------------

// Récupère tous les utilisateurs
export async function getUsers(token) {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: { "Authorization": `Bearer ${token}` } // JWT dans l'en-tête
  });
  return handleResponse(res);
}

// Récupère un utilisateur par ID
export async function getUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// Crée un nouvel utilisateur
export async function createUser(data, token) {
  const res = await fetch(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

// Met à jour un utilisateur existant
export async function updateUser(id, data, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

// 🔐 --- Mise à jour du mot de passe (uniquement utilisateur) ---
export async function updatePassword(id, oldPassword, newPassword, token) {
  const res = await fetch(`${API_URL}/api/users/${id}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });

  let data;
  try { 
    data = await res.json(); 
  } catch { 
    throw new Error("Réponse serveur invalide."); 
  }

  if (!res.ok) throw new Error(data.message || "Erreur serveur.");
  return data;
}

// Supprime un utilisateur
export async function deleteUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// ---------------- POSTS ----------------

// Récupère tous les posts / rendez-vous
export async function getPosts(token) {
  const res = await fetch(`${API_URL}/api/posts`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// Crée un post / rendez-vous
export async function createPost(data, token) {
  const res = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

// Met à jour un post existant
export async function updatePost(id, data, token) {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

// Supprime un post
export async function deletePost(id, token) {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// ---------------- AUTH ----------------

// Login : renvoie un token JWT
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

// Register : crée un nouvel utilisateur
export async function register(firstname, lastname, email, password) {
  const res = await fetch(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstname, lastname, email, password })
  });
  return handleResponse(res);
}