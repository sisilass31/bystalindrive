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
export async function fetchWithLoader(url, options = {}) {
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
  const res = await fetchWithLoader(`${API_URL}/api/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getUser(id, token) {
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// ---------------- CREATE / REGISTER USER ----------------
export async function createUser(data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetchWithLoader(`${API_URL}/api/users/register`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

// ---------------- UPDATE / DELETE USERS ----------------
export async function updateUser(id, data, token) {
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updatePassword(id, oldPassword, newPassword, token) {
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  return handleResponse(res);
}

export async function deleteUser(id, token) {
  const res = await fetchWithLoader(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// ---------------- PASSWORD ----------------
export async function forgotPassword(email) {
  const res = await fetchWithLoader(`${API_URL}/api/users/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return handleResponse(res);
}

export async function resetPassword(token, password) {
  const res = await fetchWithLoader(`${API_URL}/api/users/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  });
  return handleResponse(res);
}

export async function setPassword(token, password) {
  const res = await fetchWithLoader(`${API_URL}/api/users/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password })
  });
  return handleResponse(res);
}

export async function checkToken(token) {
  const res = await fetchWithLoader(`${API_URL}/api/users/check-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
  return handleResponse(res);
}

// ---------------- POSTS ----------------
export async function getPosts(token) {
  const res = await fetchWithLoader(`${API_URL}/api/posts`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getMyPosts(token) {
  const res = await fetchWithLoader(`${API_URL}/api/posts/me`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function getPost(id, token) {
  const res = await fetchWithLoader(`${API_URL}/api/posts/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

export async function createPost(data, token) {
  const res = await fetchWithLoader(`${API_URL}/api/posts`, {
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
  const res = await fetchWithLoader(`${API_URL}/api/posts/${id}`, {
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
  const res = await fetchWithLoader(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return handleResponse(res);
}

// ---------------- AUTH ----------------
export async function login(email, password) {
  const res = await fetchWithLoader(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}