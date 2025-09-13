import { getUser, updatePassword } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "/pages/login.html");

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1])); // décoder JWT
  } catch (err) {
    console.error("Token invalide :", err);
    localStorage.removeItem("token");
    return (window.location.href = "/pages/login.html");
  }

  const userId = payload.id;

  // --- Récupération profil ---
  try {
    const user = await getUser(userId, token);
    document.getElementById("firstname").value = user.firstname;
    document.getElementById("lastname").value = user.lastname;
    document.getElementById("email").value = user.email;
  } catch (err) {
    console.error(err);
    document.getElementById("message").textContent = "Erreur chargement profil.";
  }

  const form = document.getElementById("profileForm");
  const messageDiv = document.getElementById("message");
  const regexPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{12,}$/;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // --- Vérifications ---
    if (!newPassword) {
      messageDiv.textContent = "Aucun changement détecté.";
      return;
    }
    if (newPassword !== confirmPassword) {
      messageDiv.textContent = "Les mots de passe ne correspondent pas.";
      return;
    }
    if (!regexPassword.test(newPassword)) {
      messageDiv.textContent = "Mot de passe invalide (12+ caractères, maj, min, chiffre).";
      return;
    }

    // --- Modal ancien mot de passe ---
    const modal = document.getElementById("oldPasswordModal");
    const modalInput = document.getElementById("modalOldPassword");
    const modalCancel = document.getElementById("modalCancelBtn");
    const modalOk = document.getElementById("modalOkBtn");

    modal.style.display = "flex";
    modalInput.value = "";
    modalInput.focus();
    messageDiv.textContent = "";

    const closeModal = () => modal.style.display = "none";
    modalCancel.onclick = closeModal;

    modalOk.onclick = async () => {
      const oldPassword = modalInput.value.trim();
      if (!oldPassword) {
        messageDiv.textContent = "Veuillez saisir votre ancien mot de passe.";
        return;
      }

      closeModal();

      try {
        await updatePassword(userId, oldPassword, newPassword, token);
        messageDiv.textContent = "Mot de passe mis à jour avec succès !";
        form.reset();
      } catch (err) {
        console.error(err);
        messageDiv.textContent = err.message || "Erreur lors de la mise à jour.";
      }
    };

    // Fermer modal si clic en dehors
    modal.onclick = (event) => { if (event.target === modal) closeModal(); };

    // Fermer avec Enter
    modalInput.addEventListener("keypress", (event) => { if (event.key === "Enter") modalOk.click(); });

    // --- Toggle ancien mot de passe modal ---
    const toggleModalOld = document.getElementById("toggleModalOld");
    if (toggleModalOld) {
      toggleModalOld.addEventListener("click", () => {
        const isPassword = modalInput.type === "password";
        modalInput.type = isPassword ? "text" : "password";

        // Changer icône correctement
        toggleModalOld.classList.remove("bx-eye", "bx-eye-slash");
        toggleModalOld.classList.add(isPassword ? "bx-eye-slash" : "bx-eye");
      });
    }
  });

  // --- Toggle nouveau mot de passe ---
  const toggleNew = document.getElementById("toggleNewPassword");
  const newInput = document.getElementById("password");
  if (toggleNew && newInput) {
    toggleNew.addEventListener("click", () => {
      const isPassword = newInput.type === "password";
      newInput.type = isPassword ? "text" : "password";
      toggleNew.classList.remove("bx-eye", "bx-eye-slash");
      toggleNew.classList.add(isPassword ? "bx-eye-slash" : "bx-eye");
    });
  }

  // --- Toggle confirmation mot de passe ---
  const toggleConfirm = document.getElementById("toggleConfirmPassword");
  const confirmInput = document.getElementById("confirmPassword");
  if (toggleConfirm && confirmInput) {
    toggleConfirm.addEventListener("click", () => {
      const isPassword = confirmInput.type === "password";
      confirmInput.type = isPassword ? "text" : "password";
      toggleConfirm.classList.remove("bx-eye", "bx-eye-slash");
      toggleConfirm.classList.add(isPassword ? "bx-eye-slash" : "bx-eye");
    });
  }
});