import { getUser, updateUser } from "./api.js";

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

  try {
    // --- Récupération profil ---
    const user = await getUser(userId, token);

    document.getElementById("firstname").textContent = user.firstname;
    document.getElementById("lastname").textContent = user.lastname;
    document.getElementById("email").value = user.email;

  } catch (err) {
    console.error(err);
    document.getElementById("message").textContent = "Erreur chargement profil.";
  }

  // --- Formulaire update ---
  const form = document.getElementById("profileForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (password && password !== confirmPassword) {
      return (document.getElementById("message").textContent = "Les mots de passe ne correspondent pas.");
    }

    try {
      const dataToUpdate = { email };
      if (password) dataToUpdate.password = password;

      const updatedUser = await updateUser(userId, dataToUpdate, token);

      document.getElementById("message").textContent = "Profil mis à jour avec succès !";
      document.getElementById("email").value = updatedUser.email;
      form.reset();

    } catch (err) {
      console.error(err);
      document.getElementById("message").textContent = "Erreur lors de la mise à jour.";
    }
  });
});