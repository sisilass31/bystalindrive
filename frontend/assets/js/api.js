const API_URL = "http://localhost:3000"; // URL backend

// --- USERS ---

async function getUsers(token) {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
}

async function getUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

async function register(firstname, lastname, email, password) {
  const res = await fetch(`${API_URL}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstname, lastname, email, password })
  });
  return await res.json();
}

async function updateUser(id, data, token) {
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

async function deleteUser(id, token) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
}

// --- POSTS (placeholder) ---
async function getPosts(token) {
  const res = await fetch(`${API_URL}/api/posts`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  return await res.json();
}

// Export global
window.api = {
  getUsers,
  getUser,
  login,
  register,
  updateUser,
  deleteUser,
  getPosts
};
