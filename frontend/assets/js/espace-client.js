// URL de base de l'API
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://bystalindrive.onrender.com";

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
    const role = payload.role.toLowerCase();

    // Redirection si ce n'est pas un client
    if (role !== "client") {
      window.location.href = "/pages/admin/posts-dashboard.html";
      return;
    }

    // 🔹 Récupérer les infos de l'utilisateur connecté
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem("token");
      window.location.href = "/pages/login.html";
      return;
    }

    user = await res.json();

    // Afficher le prénom
    const welcome = document.getElementById("welcome");
    if (welcome) welcome.textContent = `Bienvenue ${user.firstname} !`;

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
      const res = await fetch(`${API_URL}/api/posts/me`, {
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

    // Vider le container
    container.textContent = "";

    if (!sessions.length) {
      container.style.display = "none"; // cacher le container
      noSession.style.display = "flex"; // afficher le message "aucune séance"
      return;
    }

    // Il y a des sessions
    container.style.display = "flex";
    noSession.style.display = "none";

    sessions.forEach(session => {
      const card = document.createElement("div");
      card.className = "card-bc-p20-br-15 formulaire box-shadow-3d sessions";

      // --- Flex group 1 (Instructeur / Date) ---
      const flex1 = document.createElement("div");
      flex1.className = "flex-group-card";

      const instrGroup = document.createElement("div");
      instrGroup.className = "form-group";
      const instrLabel = document.createElement("label");
      instrLabel.textContent = "Instructeur";
      const instrInput = document.createElement("input");
      instrInput.type = "text";
      instrInput.value = `${session.Admin.firstname} ${session.Admin.lastname}`;
      instrInput.readOnly = true;
      instrGroup.append(instrLabel, instrInput);

      const dateGroup = document.createElement("div");
      dateGroup.className = "form-group";
      const dateLabel = document.createElement("label");
      dateLabel.textContent = "Date de la séance";
      const dateInput = document.createElement("input");
      dateInput.type = "text";
      dateInput.value = new Date(session.appointment_date).toLocaleDateString();
      dateInput.readOnly = true;
      dateGroup.append(dateLabel, dateInput);

      flex1.append(instrGroup, dateGroup);

      // --- Flex group 2 (Heures début / fin) ---
      const flex2 = document.createElement("div");
      flex2.className = "flex-group-card";

      const startGroup = document.createElement("div");
      startGroup.className = "form-group";
      const startLabel = document.createElement("label");
      startLabel.textContent = "Heure de début";
      const startInput = document.createElement("input");
      startInput.type = "text";
      startInput.value = session.start_time.slice(0, 5);
      startInput.readOnly = true;
      startGroup.append(startLabel, startInput);

      const endGroup = document.createElement("div");
      endGroup.className = "form-group";
      const endLabel = document.createElement("label");
      endLabel.textContent = "Heure de fin";
      const endInput = document.createElement("input");
      endInput.type = "text";
      endInput.value = session.end_time.slice(0, 5);
      endInput.readOnly = true;
      endGroup.append(endLabel, endInput);

      flex2.append(startGroup, endGroup);

      // Ajouter les flex groups à la card
      card.append(flex1, flex2);

      // Ajouter la card au container
      container.appendChild(card);
    });
  }

  const sessions = await fetchUserSessions();
  renderSessions(sessions);
});