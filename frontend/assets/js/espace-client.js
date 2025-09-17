document.addEventListener("DOMContentLoaded", async () => {
  const body = document.body;
  body.style.display = "none"; // Masquer le contenu au départ

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/pages/login.html";
    return;
  }

  let user;
  try {
    // Décoder le token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.id;
    const role = payload.role.toLowerCase();

    if (role !== "client") {
      window.location.href = "/pages/admin/posts-dashboard.html";
      return;
    }

    // Récupérer les infos utilisateur
    const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem("token");
      window.location.href = "/pages/login.html";
      return;
    }

    user = await res.json();
    // console.log("Utilisateur connecté :", user);

    // Afficher le prénom
    const welcome = document.getElementById("welcome");
    if (welcome) welcome.innerText = `Bienvenue ${user.firstname} !`;

  } catch (err) {
    console.error(err);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
    return;
  }

  // Afficher le contenu après toutes les vérifications
  body.style.display = "block";

  // --- Récupérer et afficher les séances ---
  async function fetchUserSessions() {
    try {
      const res = await fetch("http://localhost:3000/api/posts/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) return [];
      const sessions = await res.json();
      return sessions;
    } catch (err) {
      console.error("Erreur récupération sessions :", err);
      return [];
    }
  }

  function renderSessions(sessions) {
    const container = document.getElementById("sessionsContainer");
    const noSession = document.getElementById("noSession");

    container.innerHTML = ""; // vider le container

    if (!sessions.length) {
      container.style.display = "none"; // cacher le container
      noSession.style.display = "flex"; // afficher le message "aucune séance"
      return;
    }

    // il y a des sessions
    container.style.display = "flex";
    noSession.style.display = "none"; // cacher le message "aucune séance"

    sessions.forEach(session => {
      const card = document.createElement("div");
      card.className = "card-bc-p20-br-15 formulaire box-shadow-3d sessions";
      card.innerHTML = `
        <div class="flex-group-card">
          <div class="form-group">
            <label>Instructeur</label>
            <input type="text" value="${session.Admin.firstname} ${session.Admin.lastname}" readonly>
          </div>
          <div class="form-group">
            <label>Date de la séance</label>
            <input type="text" value="${new Date(session.appointment_date).toLocaleDateString()}" readonly>
          </div>
        </div>
        <div class="flex-group-card">
          <div class="form-group">
            <label>Heure de début</label>
            <input type="text" value="${session.start_time.slice(0, 5)}" readonly>
          </div>
          <div class="form-group">
            <label>Heure de fin</label>
            <input type="text" value="${session.end_time.slice(0, 5)}" readonly>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  const sessions = await fetchUserSessions();
  //console.log("Sessions récupérées :", JSON.stringify(sessions, null, 2)); // log clair pour debug
  renderSessions(sessions);
});
