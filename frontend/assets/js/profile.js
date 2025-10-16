import { getUser, updatePassword } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "/pages/login.html";

  // --- Décodage JWT ---
  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch (err) {
    localStorage.removeItem("token");
    return window.location.href = "/pages/login.html";
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
    showMessageModal("Erreur chargement profil.");
  }

  const form = document.getElementById("profileForm");

  // --- Modal messages global ---
  const messageModal = document.getElementById("messageModal");
  const messageModalContent = document.getElementById("messageModalContent");
  const messageModalOk = document.getElementById("messageModalOk");

  function showMessageModal(text) {
    messageModalContent.textContent = text;
    messageModal.style.display = "flex";
    messageModal.setAttribute("aria-hidden", "false");
  }

  messageModalOk.addEventListener("click", () => {
    messageModal.style.display = "none";
    messageModal.setAttribute("aria-hidden", "true");
  });

  messageModal.addEventListener("click", e => {
    if (e.target === messageModal) messageModalOk.click();
  });

  // === Vérification mot de passe ===
  const evaluatePassword = (pwd = "") => ({
    length: /.{12,}/.test(pwd),
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd)
  });

  const initPasswordCriteria = (passwordInputId, confirmInputId, criteriaId, matchId) => {
    const passEl = document.getElementById(passwordInputId);
    const confirmEl = document.getElementById(confirmInputId);
    const messageEl = document.getElementById(criteriaId);
    const matchEl = document.getElementById(matchId);
    if (!passEl || !messageEl || !matchEl) return;

    const criteriaList = document.createElement("ul");
    criteriaList.className = "criteria-list";

    const criteriaDefs = [
      { key: "length", text: "Au moins 12 caractères" },
      { key: "upper", text: "Une majuscule" },
      { key: "lower", text: "Une minuscule" },
      { key: "number", text: "Un chiffre" },
      { key: "special", text: "Un caractère spécial" }
    ];

    criteriaDefs.forEach(def => {
      const li = document.createElement("li");
      li.dataset.key = def.key;
      li.className = "invalid";

      const icon = document.createElement("i");
      icon.className = "bxr bx-x-circle";

      const textNode = document.createTextNode(` ${def.text}`);
      li.append(icon, textNode);

      criteriaList.appendChild(li);
    });

    messageEl.appendChild(criteriaList);

    const updateCriteria = () => {
      const pwd = passEl.value || "";
      const result = evaluatePassword(pwd);
      criteriaDefs.forEach(def => {
        const li = criteriaList.querySelector(`li[data-key="${def.key}"]`);
        const icon = li.querySelector("i");
        if (result[def.key]) {
          li.classList.replace("invalid", "valid");
          icon.className = "bxr bx-check-circle";
        } else {
          li.classList.replace("valid", "invalid");
          icon.className = "bxr bx-x-circle";
        }
      });

      // Vérification correspondance confirmation
      if (confirmEl.value.length > 0) {
        matchEl.textContent = "";
        const icon = document.createElement("i");
        if (pwd === confirmEl.value) {
          icon.className = "bxr bx-check-circle";
          matchEl.append(icon, document.createTextNode(" Les mots de passe correspondent"));
        } else {
          icon.className = "bxr bx-x-circle";
          matchEl.append(icon, document.createTextNode(" Les mots de passe ne correspondent pas"));
        }
      } else {
        matchEl.textContent = "";
      }
    };

    passEl.addEventListener("input", updateCriteria);
    confirmEl.addEventListener("input", updateCriteria);
    updateCriteria();
  };

  initPasswordCriteria("password", "confirmPassword", "profileMessage", "profileMatchMessage");

  // === Modal ancien mot de passe ===
  const modal = document.getElementById("oldPasswordModal");
  const modalInput = document.getElementById("modalOldPassword");
  const modalCancel = document.getElementById("modalCancelBtn");
  const modalOk = document.getElementById("modalOkBtn");

  const closeModal = () => {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  };

  modalCancel.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  modalInput.addEventListener("keypress", e => { if (e.key === "Enter") modalOk.click(); });

  const toggleModalOld = document.getElementById("toggleModalOld");
  if (toggleModalOld && modalInput) {
    toggleModalOld.addEventListener("click", () => {
      const isPassword = modalInput.type === "password";
      modalInput.type = isPassword ? "text" : "password";
      toggleModalOld.classList.toggle("bx-eye", isPassword);
      toggleModalOld.classList.toggle("bx-eye-slash", !isPassword);
    });
  }

  // === Submit form ===
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const newPassword = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!newPassword) { showMessageModal("Aucun changement détecté."); return; }
    if (newPassword !== confirmPassword) { showMessageModal("Les mots de passe ne correspondent pas."); return; }
    if (!Object.values(evaluatePassword(newPassword)).every(Boolean)) { showMessageModal("Mot de passe non conforme."); return; }

    // Ouvrir modal ancien mot de passe
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    modalInput.value = "";
    modalInput.focus();

    // --- Listener unique ---
    const onModalOkClick = async () => {
      const oldPassword = modalInput.value.trim();
      if (!oldPassword) { showMessageModal("Veuillez saisir votre ancien mot de passe."); return; }
      closeModal();

      try {
        await updatePassword(userId, oldPassword, newPassword, token);
        form.reset();
        showMessageModal("Mot de passe mis à jour avec succès !");
      } catch (err) {
        console.error(err);
        showMessageModal(err.message || "Ancien mot de passe incorrect.");
      } finally {
        modalOk.removeEventListener("click", onModalOkClick);
      }
    };

    modalOk.addEventListener("click", onModalOkClick);
  });

  // === Toggle nouveau mot de passe ===
  const toggleNew = document.getElementById("toggleNewPassword");
  const newInput = document.getElementById("password");
  if (toggleNew && newInput) {
    toggleNew.addEventListener("click", () => {
      const isPassword = newInput.type === "password";
      newInput.type = isPassword ? "text" : "password";
      toggleNew.classList.toggle("bx-eye", isPassword);
      toggleNew.classList.toggle("bx-eye-slash", !isPassword);
    });
  }

  // === Toggle confirmation mot de passe ===
  const toggleConfirm = document.getElementById("toggleConfirmPassword");
  const confirmInput = document.getElementById("confirmPassword");
  if (toggleConfirm && confirmInput) {
    toggleConfirm.addEventListener("click", () => {
      const isPassword = confirmInput.type === "password";
      confirmInput.type = isPassword ? "text" : "password";
      toggleConfirm.classList.toggle("bx-eye", isPassword);
      toggleConfirm.classList.toggle("bx-eye-slash", !isPassword);
    });
  }
});