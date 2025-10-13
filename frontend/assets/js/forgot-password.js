document.addEventListener("DOMContentLoaded", () => {
  const API_URL = window.location.hostname === "development"
    ? "http://localhost:3000/api/users"
    : "https://bystalindrive.onrender.com/api/users";

  // --- Sécurité : si déjà connecté, redirection selon rôle ---
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // décodage payload JWT
      const role = payload.role?.toLowerCase();

      if (role === "admin") {
        window.location.href = "/pages/admin/dashboard.html";
        return;
      } else if (role === "user" || role === "client") {
        window.location.href = "/pages/client/espace-client.html";
        return;
      } else {
        // rôle inconnu => nettoyage
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      }
    } catch {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    }
  }

  const form = document.getElementById("forgotForm");
  const emailInput = document.getElementById("email");
  const container = document.getElementById("forgotContainer");
  const messageEl = document.getElementById("forgotMessage");

  if (!form || !emailInput || !container || !messageEl) return;

  // --- Fonction pour afficher les messages ---
  function showMessage(msg, color = "#e14d10") {
    messageEl.textContent = msg;
    messageEl.style.color = color;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
      showMessage("Veuillez saisir votre email.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        // Vider le container
        container.textContent = "";

        // Créer le conteneur principal
        const receiveContainer = document.createElement("div");
        receiveContainer.className = "receive-mail-container";

        // Titre
        const h2 = document.createElement("h2");
        h2.textContent = "Vérifiez votre boîte mail";

        // Image
        const imgDiv = document.createElement("div");
        imgDiv.className = "img-receive";
        const img = document.createElement("img");
        img.src = "../assets/images/receive.png";
        img.alt = "Succès";
        imgDiv.appendChild(img);

        // Paragraphe avec email sécurisé
        const p = document.createElement("p");
        p.textContent = "Consultez votre boîte de réception ";
        const strong = document.createElement("strong");
        strong.textContent = email;
        p.appendChild(strong);
        p.appendChild(document.createTextNode(" pour obtenir des instructions sur la façon de réinitialiser votre mot de passe."));

        // Lien retour
        const a = document.createElement("a");
        a.href = "login.html";
        a.className = "gradient-button";
        a.textContent = "Retour à l’écran de connexion";

        // Assembler tout
        receiveContainer.append(h2, imgDiv, p, a);
        container.appendChild(receiveContainer);

      } else {
        showMessage(`${data.message || "Erreur serveur"}`);
      }
    } catch (err) {
      showMessage("Erreur serveur, réessayez plus tard.");
      console.error(err);
    }
  });
});