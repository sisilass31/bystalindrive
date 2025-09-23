// Import des fonctions de l'API pour gérer les utilisateurs (CRUD)
import { getUsers, getUser, createUser, updateUser, deleteUser } from "./api.js";

// Attendre que le DOM soit complètement chargé avant d'exécuter le script
document.addEventListener("DOMContentLoaded", async () => {

  // --- Vérification de l'authentification ---
  const token = localStorage.getItem("token"); // récupérer le JWT stocké
  if (!token) return window.location.href = "/pages/login.html"; // si pas de token, redirection vers login

  // Décodage du token pour vérifier les informations (payload)
  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1])); // split(".")[1] = payload du JWT
    if (payload.role !== "admin") throw new Error("Non autorisé"); // vérifier que l'utilisateur est admin
  } catch {
    // si token invalide ou rôle non admin, supprimer le token et rediriger
    localStorage.removeItem("token");
    return window.location.href = "/pages/login.html";
  }

  // Vérification côté serveur que l'utilisateur existe toujours
  let admin;
  try { 
    admin = await getUser(payload.id, token); // récupérer l'utilisateur via l'API
  } catch { 
    // si erreur (utilisateur supprimé par exemple), supprimer token et rediriger
    localStorage.removeItem("token"); 
    return window.location.href = "/pages/login.html"; 
  }

  // --- Sélection des éléments DOM importants ---
  const usersTbody = document.getElementById("usersTbody"); // corps de la table des utilisateurs
  const cardsContainer = document.getElementById("cardsContainer"); // conteneur pour affichage en cartes
  const emptyState = document.getElementById("emptyState"); // message à afficher si aucun utilisateur
  const searchInput = document.getElementById("search"); // champ de recherche
  const addUserBtn = document.getElementById("addUserBtn"); // bouton pour ajouter un utilisateur

  // Éléments pour la modal d'ajout/édition
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const inputNom = document.getElementById("inputNom");
  const inputPrenom = document.getElementById("inputPrenom");
  const inputEmail = document.getElementById("inputEmail");
  const inputRole = document.getElementById("inputRole");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  // --- Création dynamique de modals pour confirmation et informations ---
  const confirmModal = document.createElement("div");
  confirmModal.id = "confirmModal";
  confirmModal.className = "modal-overlay";
  confirmModal.style.display = "none"; // masquée par défaut
  confirmModal.innerHTML = `
    <div class="modal-content">
      <h3 id="confirmTitle"></h3>
      <p id="confirmText"></p>
      <div class="modal-actions">
        <button id="confirmCancelBtn" class="button-3d">Annuler</button>
        <button id="confirmOkBtn" class="button-3d">Confirmer</button>
      </div>
    </div>`;
  document.body.appendChild(confirmModal); // ajout au DOM

  const infoModal = document.createElement("div");
  infoModal.id = "infoModal";
  infoModal.className = "modal-overlay";
  infoModal.style.display = "none"; // masquée par défaut
  infoModal.innerHTML = `
    <div class="modal-content">
      <h3 id="infoTitle"></h3>
      <p id="infoText"></p>
      <div class="modal-actions">
        <button id="infoOkBtn" class="button-3d">OK</button>
      </div>
    </div>`;
  document.body.appendChild(infoModal); // ajout au DOM

  // --- Fonction pour afficher une modal de confirmation ---
  function showModal(title, message, confirmText = "Confirmer") {
    return new Promise(resolve => { // promesse pour attendre la réponse de l'utilisateur
      document.getElementById("confirmTitle").textContent = title;
      document.getElementById("confirmText").textContent = message;
      const okBtn = document.getElementById("confirmOkBtn");
      const cancelBtn = document.getElementById("confirmCancelBtn");
      okBtn.textContent = confirmText;
      confirmModal.style.display = "flex"; // afficher modal

      // Nettoyage des listeners après action
      function cleanUp() {
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        confirmModal.style.display = "none";
      }
      function onOk() { cleanUp(); resolve(true); } // confirmé
      function onCancel() { cleanUp(); resolve(false); } // annulé

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
    });
  }

  // --- Fonction pour afficher une modal d'information ---
  function showInfoModal(title, message) {
    return new Promise(resolve => {
      document.getElementById("infoTitle").textContent = title;
      document.getElementById("infoText").textContent = message;
      const okBtn = document.getElementById("infoOkBtn");
      infoModal.style.display = "flex";

      function cleanUp() { okBtn.removeEventListener("click", onOk); infoModal.style.display = "none"; }
      function onOk() { cleanUp(); resolve(); }

      okBtn.addEventListener("click", onOk);
    });
  }

  // --- Variables pour gérer la liste des utilisateurs et édition ---
  let users = [];       // liste des utilisateurs récupérée depuis l'API
  let editingId = null; // ID de l'utilisateur actuellement en édition

  // --- Charger les utilisateurs depuis l'API ---
  async function loadUsers() {
    try {
      users = await getUsers(token); // appel API pour récupérer tous les utilisateurs
      renderUsers(); // afficher les utilisateurs
    } catch (err) {
      console.error(err);
      await showInfoModal("Erreur", "Impossible de charger les utilisateurs"); // modal d'erreur
    }
  }

  // --- Fonction pour afficher les utilisateurs en table et en cartes ---
  function renderUsers() {
    const q = searchInput.value.trim().toLowerCase(); // recherche filtrée
    const filtered = users.filter(u => 
      !q || u.lastname.toLowerCase().includes(q) || 
      u.firstname.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );

    // --- TABLE ---
    usersTbody.innerHTML = ""; // vider table
    filtered.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(u.lastname)}</td>
        <td>${escapeHtml(u.firstname)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge ${u.role==="admin"?"role-admin":"role-user"}">${u.role}</span></td>
        <td>
          <div class="actions-row">
            <button class="edit-button" data-id="${u.id}"><p>Modifier</p><i class='bxr bx-edit'></i></button>
            <button class="delete-button" data-id="${u.id}"><p>Supprimer</p><i class='bxr bx-trash'></i></button>
          </div>
        </td>`;
      usersTbody.appendChild(tr);
    });

    // --- CARDS ---
    cardsContainer.innerHTML = "";
    filtered.forEach(u => {
      const div = document.createElement("div");
      div.className = "card-admin w-100 box-shadow-3d";
      div.innerHTML = `
        <div class="text-card-user-dashboard">
          <div class="user-card-header">
            <strong>${escapeHtml(u.firstname)} ${escapeHtml(u.lastname)}</strong>
            <span class="badge ${u.role==="admin"?"role-admin":"role-client"}">${u.role}</span>
          </div>
          <div class="user-card-email">${escapeHtml(u.email)}</div>
        </div>
        <div class="user-card-actions">
          <button class="edit-button" data-id="${u.id}"><p>Modifier</p><i class='bxr bx-edit'></i></button>
          <button class="delete-button" data-id="${u.id}"><p>Supprimer</p><i class='bxr bx-trash'></i></button>
        </div>`;
      cardsContainer.appendChild(div);
    });

    emptyState.style.display = filtered.length ? "none" : "flex"; // si aucun utilisateur, afficher message vide
  }

  // --- Gestion des clics sur les boutons Modifier / Supprimer ---
  function setupUserEvents(container) {
    container.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-id]"); // trouver le bouton cliqué
      if (!btn) return;

      const id = Number(btn.dataset.id);
      const u = users.find(x => x.id === id);
      if (!u) return;

      // --- Supprimer utilisateur ---
      if (btn.classList.contains("delete-button")) {
        const confirmed = await showModal("Supprimer l'utilisateur ?", `Voulez-vous vraiment supprimer ${u.firstname} ${u.lastname} ?`, "Supprimer");
        if (!confirmed) return;
        try {
          await deleteUser(id, token); // appel API pour supprimer
          users = users.filter(x => x.id !== id); // retirer localement
          renderUsers(); // rafraîchir affichage
          await showInfoModal("Succès", "Utilisateur supprimé !");
        } catch (err) {
          console.error(err);
          await showInfoModal("Erreur", "Impossible de supprimer l'utilisateur");
        }
      }

      // --- Modifier utilisateur ---
      if (btn.classList.contains("edit-button")) {
        editingId = id; // stocker l'ID en cours d'édition
        modalTitle.textContent = "Modifier l'utilisateur";
        inputNom.value = u.lastname;
        inputPrenom.value = u.firstname;
        inputEmail.value = u.email;
        inputRole.value = u.role;
        modalOverlay.style.display = "flex"; // afficher modal
        inputNom.focus();
      }
    });
  }

  // Appliquer événements sur table et cartes
  setupUserEvents(usersTbody);
  setupUserEvents(cardsContainer);

  // --- Bouton Sauvegarder (création ou modification) ---
  saveBtn.addEventListener("click", async () => {
    const lastname = inputNom.value.trim();
    const firstname = inputPrenom.value.trim();
    const email = inputEmail.value.trim();
    const role = inputRole.value;
    if (!lastname || !firstname || !email) return showInfoModal("Erreur", "Tous les champs sont obligatoires");
    if (!validateEmail(email)) return showInfoModal("Erreur", "Email invalide");

    try {
      if (editingId) {
        // Modification
        const updated = await updateUser(editingId, { lastname, firstname, email, role }, token);
        users = users.map(u => u.id === editingId ? updated : u);
        await showInfoModal("Succès", "Utilisateur modifié !");
      } else {
        // Création
        const created = await createUser({ lastname, firstname, email, role }, token);
        users.unshift(created); // ajouter au début de la liste
        await showInfoModal("Succès", `Utilisateur créé avec succès.\nEmail: ${created.email}`);
      }
      renderUsers(); // mettre à jour affichage
      modalOverlay.style.display = "none"; // fermer modal
      editingId = null; // réinitialiser
    } catch (err) {
      console.error(err);
      await showInfoModal("Erreur", err.message || "Erreur lors de l'opération");
    }
  });

  // --- Bouton Annuler ---
  cancelBtn.addEventListener("click", () => { modalOverlay.style.display = "none"; editingId = null; });

  // --- Bouton Ajouter utilisateur ---
  addUserBtn.addEventListener("click", () => { 
    editingId = null; 
    modalTitle.textContent = "Ajouter un utilisateur"; 
    inputNom.value=""; 
    inputPrenom.value=""; 
    inputEmail.value=""; 
    inputRole.value="client"; 
    modalOverlay.style.display="flex"; 
    inputNom.focus(); 
  });

  // --- Recherche instantanée ---
  searchInput.addEventListener("input", renderUsers);

  // --- Fonctions utilitaires ---
  function escapeHtml(s) { 
    return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); 
  } // sécurité contre XSS
  function validateEmail(e){ 
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); 
  } // validation simple de l'email

  // --- Chargement initial des utilisateurs ---
  await loadUsers();
});