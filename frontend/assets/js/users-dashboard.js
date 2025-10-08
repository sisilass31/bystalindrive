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

  // --- Sélection éléments DOM ---
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

  // --- Modales dynamiques ---
  function createModal(id) {
    const modal = document.createElement("div");
    modal.id = id;
    modal.className = "modal-overlay";
    modal.style.display = "none";

    const content = document.createElement("div");
    content.className = "modal-content";

    const title = document.createElement("h3");
    title.id = id + "Title";

    const text = document.createElement("p");
    text.id = id + "Text";

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    content.append(title, text, actions);
    modal.appendChild(content);
    document.body.appendChild(modal);
    return { modal, title, text, actions };
  }

  const { modal: confirmModal, title: confirmTitle, text: confirmText, actions: confirmActions } = createModal("confirmModal");
  const { modal: infoModal, title: infoTitle, text: infoText, actions: infoActions } = createModal("infoModal");

  // --- Fonction modale confirmation ---
  function showConfirm(titleStr, messageStr, confirmBtnText = "Confirmer") {
    return new Promise(resolve => {
      confirmTitle.textContent = titleStr;
      confirmText.textContent = messageStr;

      // Supprimer tous les enfants existants
      while (confirmActions.firstChild) confirmActions.firstChild.remove();

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "button-3d";
      cancelBtn.textContent = "Annuler";

      const okBtn = document.createElement("button");
      okBtn.className = "button-3d";
      okBtn.textContent = confirmBtnText;

      confirmActions.append(cancelBtn, okBtn);
      confirmModal.style.display = "flex";

      function cleanup() {
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        confirmModal.style.display = "none";
      }

      function onOk() { cleanup(); resolve(true); }
      function onCancel() { cleanup(); resolve(false); }

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
    });
  }

  // --- Fonction modale info ---
  function showInfo(titleStr, messageStr) {
    return new Promise(resolve => {
      infoTitle.textContent = titleStr;
      infoText.textContent = messageStr;

      while (infoActions.firstChild) infoActions.firstChild.remove();

      const okBtn = document.createElement("button");
      okBtn.className = "button-3d";
      okBtn.textContent = "OK";

      infoActions.appendChild(okBtn);
      infoModal.style.display = "flex";

      function cleanup() { okBtn.removeEventListener("click", onOk); infoModal.style.display = "none"; }
      function onOk() { cleanup(); resolve(); }

      okBtn.addEventListener("click", onOk);
    });
  }

  // --- Liste utilisateurs et état édition ---
  let users = [];
  let editingId = null;

  async function loadUsers() {
    try {
      users = await getUsers(token);
      renderUsers();
    } catch (err) {
      console.error(err);
      await showInfo("Erreur", "Impossible de charger les utilisateurs");
    }
  }

  function renderUsers() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = users.filter(u => !q || u.lastname.toLowerCase().includes(q) || u.firstname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

    // --- Table ---
    usersTbody.replaceChildren();
    filtered.forEach(u => {
      const tr = document.createElement("tr");

      [u.lastname, u.firstname, u.email].forEach(val => {
        const td = document.createElement("td");
        td.textContent = val;
        tr.appendChild(td);
      });

      const roleTd = document.createElement("td");
      const span = document.createElement("span");
      span.className = "badge " + (u.role === "admin" ? "role-admin" : "role-user");
      span.textContent = u.role;
      roleTd.appendChild(span);
      tr.appendChild(roleTd);

      const actionsTd = document.createElement("td");
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions-row";

      const editBtn = document.createElement("button");
      editBtn.className = "edit-button";
      editBtn.dataset.id = u.id;
      editBtn.setAttribute("aria-label", "Modifier");
      editBtn.textContent = "Modifier";

      const delBtn = document.createElement("button");
      delBtn.className = "delete-button";
      delBtn.dataset.id = u.id;
      delBtn.setAttribute("aria-label", "Supprimer");
      delBtn.textContent = "Supprimer";

      actionsDiv.append(editBtn, delBtn);
      actionsTd.appendChild(actionsDiv);
      tr.appendChild(actionsTd);

      usersTbody.appendChild(tr);
    });

    // --- Cards ---
    cardsContainer.replaceChildren();
    filtered.forEach(u => {
      const div = document.createElement("div");
      div.className = "card-admin w-100 box-shadow-3d";

      const infoDiv = document.createElement("div");
      infoDiv.className = "text-card-user-dashboard";

      const headerDiv = document.createElement("div");
      headerDiv.className = "user-card-header";
      const strong = document.createElement("strong");
      strong.textContent = `${u.firstname} ${u.lastname}`;
      const badge = document.createElement("span");
      badge.className = "badge " + (u.role === "admin" ? "role-admin" : "role-client");
      badge.textContent = u.role;
      headerDiv.append(strong, badge);

      const emailDiv = document.createElement("div");
      emailDiv.className = "user-card-email";
      emailDiv.textContent = u.email;

      infoDiv.append(headerDiv, emailDiv);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "user-card-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "edit-button";
      editBtn.dataset.id = u.id;
      editBtn.setAttribute("aria-label", "Modifier");
      editBtn.textContent = "Modifier";

      const delBtn = document.createElement("button");
      delBtn.className = "delete-button";
      delBtn.dataset.id = u.id;
      delBtn.setAttribute("aria-label", "Supprimer");
      delBtn.textContent = "Supprimer";

      actionsDiv.append(editBtn, delBtn);
      div.append(infoDiv, actionsDiv);
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
        const confirmed = await showConfirm("Supprimer l'utilisateur ?", `Voulez-vous vraiment supprimer ${u.firstname} ${u.lastname} ?`, "Supprimer");
        if (!confirmed) return;
        try {
          await deleteUser(id, token);
          users = users.filter(x => x.id !== id);
          renderUsers();
          await showInfo("Succès", "Utilisateur supprimé !");
        } catch (err) {
          console.error(err);
          await showInfo("Erreur", "Impossible de supprimer l'utilisateur");
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
    if (!lastname || !firstname || !email) return showInfo("Erreur", "Tous les champs sont obligatoires");
    if (!validateEmail(email)) return showInfo("Erreur", "Email invalide");

    try {
      if (editingId) {
        const updated = await updateUser(editingId, { lastname, firstname, email, role }, token);
        users = users.map(u => u.id === editingId ? updated : u);
        await showInfo("Succès", "Utilisateur modifié !");
      } else {
        const created = await createUser({ lastname, firstname, email, role }, token);
        users.unshift(created);
        await showInfo("Succès", `Utilisateur créé avec succès. Email: ${created.email}`);
      }
      renderUsers();
      modalOverlay.style.display = "none";
      editingId = null;
    } catch (err) {
      console.error(err);
      await showInfo("Erreur", err.message || "Erreur lors de l'opération");
    }
  });

  cancelBtn.addEventListener("click", () => { modalOverlay.style.display = "none"; editingId = null; });
  addUserBtn.addEventListener("click", () => {
    editingId = null;
    modalTitle.textContent = "Ajouter un utilisateur";
    inputNom.value = "";
    inputPrenom.value = "";
    inputEmail.value = "";
    inputRole.value = "client";
    modalOverlay.style.display = "flex";
    inputNom.focus();
  });

  searchInput.addEventListener("input", renderUsers);

  function validateEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

  await loadUsers();
});