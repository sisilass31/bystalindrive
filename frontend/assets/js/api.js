// assets/js/api.js
const API_URL = "http://localhost:3000";

// --- Helper pour factoriser les requêtes ---
async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error("Réponse serveur invalide (pas du JSON).");
  }

  if (!res.ok) {
    throw new Error(data.message || "Erreur serveur.");
  }

  return data;
}

// ---------------- USERS ----------------
export async function getUsers(token) {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

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

// 🔐 --- UPDATE PASSWORD (User only) ---
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
  try { data = await res.json(); }
  catch { throw new Error("Réponse serveur invalide."); }

  if (!res.ok) throw new Error(data.message || "Erreur serveur.");
  return data;
}

export async function deleteUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// --- POSTS ---
export async function getPosts(token) {
  const res = await fetch(`${API_URL}/api/posts`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

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

export async function deletePost(id, token) {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// --- AUTH ---
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function register(firstname, lastname, email, password) {
  const res = await fetch(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstname, lastname, email, password })
  });
  return handleResponse(res);
}
