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
    const res = await fetch(`http://localhost:3000/api/users/${payload.id}`, {
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
    users.slice(-3).reverse().forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.firstname} ${u.lastname}`;
      recentUsersList.appendChild(li);
    });

    // --- Prochaines séances ---
    const nextSessionsList = document.getElementById("nextSessions");
    const formatTime = (time) => time.slice(0, 5); // 08:00:00 → 08:00

    const now = new Date();
    const upcomingPosts = posts
      .filter(p => new Date(p.date + "T" + p.start_time) >= now)
      .sort((a, b) => new Date(a.date + "T" + a.start_time) - new Date(b.date + "T" + b.start_time));

    upcomingPosts.slice(0, 3).forEach(p => {
      const li = document.createElement("li");
      const userName = p.User ? `${p.User.firstname} ${p.User.lastname}` : "Inconnu";
      const formattedDate = new Date(p.date).toLocaleDateString();
      li.textContent = `${userName} le ${formattedDate} de ${formatTime(p.start_time)} à ${formatTime(p.end_time)}`;
      nextSessionsList.appendChild(li);
    });

    // --- Graphiques : 7 derniers jours ---
    const today = new Date();
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d;
    }).reverse();

    const labels = last7Days.map(d => d.toLocaleDateString());

    // Fonction utilitaire pour comparer deux dates (sans heure)
    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    // Inscriptions par jour
    const usersCounts = last7Days.map(day =>
      users.filter(u => isSameDay(new Date(u.createdAt), day)).length
    );

    new Chart(document.getElementById("usersChart"), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Nouveaux inscrits',
          data: usersCounts,
          backgroundColor: '#ef7f09'
        }]
      },
      options: { responsive: true }
    });

    // Posts par jour
    const postsCounts = last7Days.map(day =>
      posts.filter(p => isSameDay(new Date(p.createdAt), day)).length
    );

    new Chart(document.getElementById("postsChart"), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Posts créés',
          data: postsCounts,
          borderColor: '#e14d10',
          backgroundColor: 'rgba(225,77,16,0.2)',
          fill: true
        }]
      },
      options: { responsive: true }
    });

  } catch (err) {
    console.error("Erreur récupération dashboard :", err);
  }
});