// URL de base de l'API
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://bystalindrive.onrender.com";

// --- ADMIN ---
export async function initAdmin() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/pages/login.html";
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch (err) {
    console.error("Token invalide :", err);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
    return null;
  }

  if (payload.role !== "admin") {
    window.location.href = "/pages/error-404.html";
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/api/users/${payload.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Impossible de récupérer les infos admin");
    const admin = await res.json();
    console.log("✅ Admin connecté :", admin);
    return { token, admin };
  } catch (err) {
    console.error(err);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
    return null;
  }
}

// --- DASHBOARD HOME ---
import { getUsers, getPosts } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/pages/login.html");

  try {
    const users = await getUsers(token);
    const posts = await getPosts(token);

    // --- Cards ---
    document.getElementById("usersCount").textContent = users.length;
    document.getElementById("postsCount").textContent = posts.length;
    document.getElementById("lastUser").textContent = users.length
      ? `${users[users.length - 1].firstname} ${users[users.length - 1].lastname}`
      : "-";

    // --- Derniers utilisateurs ---
    const recentUsersList = document.getElementById("recentUsers");
    users.slice(-5).reverse().forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.firstname} ${u.lastname}`;
      recentUsersList.appendChild(li);
    });

    // --- Prochaines séances ---
    const nextSessionsList = document.getElementById("nextSessions");
    const formatTime = (time) => time.slice(0, 5); // 08:00:00 → 08:00

    const now = new Date();
    const upcomingPosts = posts
      .filter(p => new Date(p.appointment_date + "T" + p.start_time) >= now)
      .sort((a, b) => new Date(a.appointment_date + "T" + a.start_time) - new Date(b.appointment_date + "T" + b.start_time));

    upcomingPosts.slice(0, 5).forEach(p => {
      const li = document.createElement("li");

      // Choisir le nom du client si dispo, sinon admin, sinon "Inconnu"
      const userName = p.Client
        ? `${p.Client.firstname} ${p.Client.lastname}`
        : p.Admin
          ? `${p.Admin.firstname} ${p.Admin.lastname}`
          : "Inconnu";

      const formattedDate = new Date(p.appointment_date).toLocaleDateString();
      li.textContent = `${userName} le ${formattedDate} de ${formatTime(p.start_time)} à ${formatTime(p.end_time)}`;
      nextSessionsList.appendChild(li);
    });

  } catch (err) {
    console.error("Erreur récupération dashboard :", err);
  }
});