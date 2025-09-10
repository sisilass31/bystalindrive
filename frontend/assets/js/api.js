// assets/js/api.js
const API_URL = "http://localhost:3000";

// ---------------- USERS ----------------
export async function getUsers(token) {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
}

export async function getUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Erreur création utilisateur");
  }

  return await res.json(); // Maintenant renvoie directement l'utilisateur complet
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
  return await res.json();
}

export async function deleteUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
}

// --- POSTS ---
export async function getPosts(token) {
  const res = await fetch(`${API_URL}/api/posts`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
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
  return await res.json();
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
  return await res.json();
}

export async function deletePost(id, token) {
  const res = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
}

// --- AUTH ---
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

export async function register(firstname, lastname, email, password) {
  const res = await fetch(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstname, lastname, email, password })
  });
  return await res.json();
}