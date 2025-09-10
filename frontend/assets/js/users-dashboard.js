import { getUsers, getUser, createUser, updateUser, deleteUser } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "/pages/login.html";

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.role !== "admin") throw new Error("Non autorisé");
  } catch {
    localStorage.removeItem("token");
    return window.location.href = "/pages/login.html";
  }

  let admin;
  try { 
    admin = await getUser(payload.id, token); 
  } catch { 
    localStorage.removeItem("token"); 
    return window.location.href = "/pages/login.html"; 
  }

  const usersTbody = document.getElementById("usersTbody");
  const cardsContainer = document.getElementById("cardsContainer");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("search");
  const addUserBtn = document.getElementById("addUserBtn");

  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const inputNom = document.getElementById("inputNom");
  const inputPrenom = document.getElementById("inputPrenom");
  const inputEmail = document.getElementById("inputEmail");
  const inputRole = document.getElementById("inputRole");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  // --- Créer les modals dynamiquement pour confirmer/succès ---
  const confirmModal = document.createElement("div");
  confirmModal.id = "confirmModal";
  confirmModal.className = "modal-overlay";
  confirmModal.style.display = "none";
  confirmModal.innerHTML = `
    <div class="modal-content">
      <h3 id="confirmTitle"></h3>
      <p id="confirmText"></p>
      <div class="modal-actions">
        <button id="confirmCancelBtn" class="button-3d">Annuler</button>
        <button id="confirmOkBtn" class="button-3d">Confirmer</button>
      </div>
    </div>`;
  document.body.appendChild(confirmModal);

  const infoModal = document.createElement("div");
  infoModal.id = "infoModal";
  infoModal.className = "modal-overlay";
  infoModal.style.display = "none";
  infoModal.innerHTML = `
    <div class="modal-content">
      <h3 id="infoTitle"></h3>
      <p id="infoText"></p>
      <div class="modal-actions">
        <button id="infoOkBtn" class="button-3d">OK</button>
      </div>
    </div>`;
  document.body.appendChild(infoModal);

  function showModal(title, message, confirmText = "Confirmer") {
    return new Promise(resolve => {
      document.getElementById("confirmTitle").textContent = title;
      document.getElementById("confirmText").textContent = message;
      const okBtn = document.getElementById("confirmOkBtn");
      const cancelBtn = document.getElementById("confirmCancelBtn");
      okBtn.textContent = confirmText;
      confirmModal.style.display = "flex";

      function cleanUp() {
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        confirmModal.style.display = "none";
      }
      function onOk() { cleanUp(); resolve(true); }
      function onCancel() { cleanUp(); resolve(false); }

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
    });
  }

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

  let users = [];
  let editingId = null;

  async function loadUsers() {
    try {
      users = await getUsers(token);
      renderUsers();
    } catch (err) {
      console.error(err);
      await showInfoModal("Erreur", "Impossible de charger les utilisateurs");
    }
  }

  function renderUsers() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = users.filter(u => 
      !q || u.lastname.toLowerCase().includes(q) || 
      u.firstname.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );

    // TABLE
    usersTbody.innerHTML = "";
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

    // CARDS
    cardsContainer.innerHTML = "";
    filtered.forEach(u => {
      const div = document.createElement("div");
      div.className = "card-admin w-100 box-shadow-3d";
      div.innerHTML = `
        <div class="text-card-user-dashboard">
          <div class="user-card-header">
            <strong>${escapeHtml(u.firstname)} ${escapeHtml(u.lastname)}</strong>
            <span class="badge ${u.role==="admin"?"role-admin":"role-user"}">${u.role}</span>
          </div>
          <div class="user-card-email">${escapeHtml(u.email)}</div>
        </div>
        <div class="user-card-actions">
          <button class="edit-button" data-id="${u.id}"><p>Modifier</p><i class='bxr bx-edit'></i></button>
          <button class="delete-button" data-id="${u.id}"><p>Supprimer</p><i class='bxr bx-trash'></i></button>
        </div>`;
      cardsContainer.appendChild(div);
    });

    emptyState.style.display = filtered.length ? "none" : "flex";
  }

  function setupUserEvents(container) {
    container.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;

      const id = Number(btn.dataset.id);
      const u = users.find(x => x.id === id);
      if (!u) return;

      if (btn.classList.contains("delete-button")) {
        const confirmed = await showModal("Supprimer l'utilisateur ?", `Voulez-vous vraiment supprimer ${u.firstname} ${u.lastname} ?`, "Supprimer");
        if (!confirmed) return;
        try {
          await deleteUser(id, token);
          users = users.filter(x => x.id !== id);
          renderUsers();
          await showInfoModal("Succès", "Utilisateur supprimé !");
        } catch (err) {
          console.error(err);
          await showInfoModal("Erreur", "Impossible de supprimer l'utilisateur");
        }
      }

      if (btn.classList.contains("edit-button")) {
        editingId = id;
        modalTitle.textContent = "Modifier l'utilisateur";
        inputNom.value = u.lastname;
        inputPrenom.value = u.firstname;
        inputEmail.value = u.email;
        inputRole.value = u.role;
        modalOverlay.style.display = "flex";
        inputNom.focus();
      }
    });
  }

  setupUserEvents(usersTbody);
  setupUserEvents(cardsContainer);

  saveBtn.addEventListener("click", async () => {
    const lastname = inputNom.value.trim();
    const firstname = inputPrenom.value.trim();
    const email = inputEmail.value.trim();
    const role = inputRole.value;
    if (!lastname || !firstname || !email) return showInfoModal("Erreur", "Tous les champs sont obligatoires");
    if (!validateEmail(email)) return showInfoModal("Erreur", "Email invalide");

    try {
      if (editingId) {
        const updated = await updateUser(editingId, { lastname, firstname, email, role }, token);
        users = users.map(u => u.id === editingId ? updated : u);
        await showInfoModal("Succès", "Utilisateur modifié !");
      } else {
        const created = await createUser({ lastname, firstname, email, role }, token);
        users.unshift(created);
        await showInfoModal("Succès", `Utilisateur créé avec succès.\nEmail: ${created.email}`);
      }
      renderUsers();
      modalOverlay.style.display = "none";
      editingId = null;
    } catch (err) {
      console.error(err);
      await showInfoModal("Erreur", err.message || "Erreur lors de l'opération");
    }
  });

  cancelBtn.addEventListener("click", () => { modalOverlay.style.display = "none"; editingId = null; });
  addUserBtn.addEventListener("click", () => { 
    editingId = null; 
    modalTitle.textContent = "Ajouter un utilisateur"; 
    inputNom.value=""; 
    inputPrenom.value=""; 
    inputEmail.value=""; 
    inputRole.value="user"; 
    modalOverlay.style.display="flex"; 
    inputNom.focus(); 
  });

  searchInput.addEventListener("input", renderUsers);

  function escapeHtml(s) { return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
  function validateEmail(e){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

  await loadUsers();
});