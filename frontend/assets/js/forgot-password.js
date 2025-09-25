document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3000/api/users";

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
        // Remplacer le formulaire par l'écran de confirmation
        container.innerHTML = `
          <div class="receive-mail-container">
            <h2>Vérifiez votre boîte mail</h2>
            <div class="img-receive"><img src="../assets/images/receive.png" alt="Succès"></div>
            <p>Consultez votre boîte de réception <strong>${email}</strong> pour obtenir des instructions sur la façon de réinitialiser votre mot de passe.</p>
            <a href="login.html" class="gradient-button">Retour à l’écran de connexion</a>
          </div>
        `;
      } else {
        showMessage(`❌ ${data.message || "Erreur serveur"}`);
      }
    } catch (err) {
      showMessage("❌ Erreur serveur, réessayez plus tard.");
      console.error(err);
    }
  });
});