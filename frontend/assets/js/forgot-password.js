document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3000/api/users";

  const form = document.getElementById("forgotForm");
  const emailInput = document.getElementById("email");
  const container = document.getElementById("forgotContainer");

  if (!form || !emailInput || !container) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email) {
      const messageEl = document.getElementById("forgotMessage");
      messageEl.textContent = "Veuillez saisir votre email.";
      messageEl.style.color = "#e14d10"; // rouge
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
        const messageEl = document.getElementById("forgotMessage");
        messageEl.textContent = `❌ ${data.message || "Erreur serveur"}`;
        messageEl.style.color = "#e14d10"; // rouge
      }

    } catch (err) {
      const messageEl = document.getElementById("forgotMessage");
      messageEl.textContent = "❌ Erreur serveur, réessayez plus tard.";
      messageEl.style.color = "#e14d10"; // rouge
      console.error(err);
    }
  });
});