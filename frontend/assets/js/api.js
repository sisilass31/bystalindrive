// ---------------- LOADER GLOBAL ----------------
function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

// Wrapper pour fetch avec loader automatique
async function fetchWithLoader(url, options = {}) {
  showLoader();
  try {
    const res = await fetch(url, options);
    return res;
  } finally {
    hideLoader();
  }
}

// ---------------- URL DE BASE ----------------
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://bystalindrive.onrender.com";

// ---------------- CSRF ----------------
export async function getCsrfToken() {
  const res = await fetchWithLoader(`${API_URL}/api/users/csrf-token`, { credentials: "include" });
  if (!res.ok) throw new Error("Impossible de récupérer le CSRF token");
  const data = await res.json();
  return data.csrfToken;
}

// ---------------- Helper ----------------
async function handleResponse(res) {
  let data;
  try { data = await res.json(); }
  catch { throw new Error("Réponse serveur invalide (pas du JSON)."); }

  if (!res.ok) throw new Error(data.message || "Erreur serveur.");
  return data;
}

// ---------------- USERS ----------------
export async function getUsers(token) {  
  const res = await fetchWithLoader(`${API_URL}/api/users`, { headers: { "Authorization": `Bearer ${token}` } });
  return handleResponse(res);
}

export async function getUser(id, token) {
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}`, { headers: { "Authorization": `Bearer ${token}` } });
  return handleResponse(res);
}

export async function createUser(data, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateUser(id, data, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updatePassword(id, oldPassword, newPassword, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return handleResponse(res);
}

export async function deleteUser(id, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include"
  });
  return handleResponse(res);
}

// ---------------- POSTS ----------------
export async function getPosts(token) {
  const res = await fetchWithLoader(`${API_URL}/api/posts`, { headers: { "Authorization": `Bearer ${token}` } });
  return handleResponse(res);
}

export async function getMyPosts(token) {
  const res = await fetchWithLoader(`${API_URL}/api/posts/me`, { headers: { "Authorization": `Bearer ${token}` } });
  return handleResponse(res);
}

export async function getPost(id, token) {
  const res = await fetchWithLoader(`${API_URL}/api/posts/${id}`, { headers: { "Authorization": `Bearer ${token}` } });
  return handleResponse(res);
}

export async function createPost(data, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updatePost(id, data, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deletePost(id, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include"
  });
  return handleResponse(res);
}

// ---------------- AUTH ----------------
export async function login(email, password) {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) throw new Error("CSRF token manquant, impossible de se connecter");

  const res = await fetchWithLoader(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function register(firstname, lastname, email, password, token) {
  const csrfToken = await getCsrfToken();
  const res = await fetchWithLoader(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-CSRF-Token": csrfToken
    },
    credentials: "include",
    body: JSON.stringify({ firstname, lastname, email, password })
  });
  return handleResponse(res);
}