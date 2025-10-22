import { getUsers, getPosts, getMyPosts, createPost, updatePost, deletePost } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
  // --- Vérification de l’authentification ---
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "/pages/login.html";

  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== 'admin') return window.location.href = "/404.html";

  console.log("Admin connecté :", payload);

  // --- Récupération des infos de l’admin ---
  let admin;
  try {
    admin = await getUsers(token).then(users => users.find(u => u.id === payload.id));
    if (!admin) throw new Error("Admin introuvable");
  } catch (err) {
    console.error(err);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
    return;
  }

  // --- MODALES SÉCURISÉES ---
  // Modal de confirmation
  const modal = document.createElement("div");
  modal.id = "confirmModal";
  modal.className = "modal-overlay";
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalTitle = document.createElement("h3"); modalTitle.id = "modalTitle";
  const modalText = document.createElement("p"); modalText.id = "modalText";

  const modalActions = document.createElement("div"); modalActions.className = "modal-actions";
  const cancelBtn = Object.assign(document.createElement("button"), { id: "cancelBtn", className: "button-3d" });
  cancelBtn.textContent = "Annuler";
  const confirmBtn = Object.assign(document.createElement("button"), { id: "confirmBtn", className: "delete-button" });
  confirmBtn.textContent = "Confirmer";

  modalActions.append(cancelBtn, confirmBtn);
  modalContent.append(modalTitle, modalText, modalActions);
  modal.append(modalContent);
  document.body.appendChild(modal);

  function showModal(title, message, confirmText = "Confirmer") {
    return new Promise(resolve => {
      modalTitle.textContent = title;
      modalText.textContent = message;
      confirmBtn.textContent = confirmText;
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";

      function cleanUp() {
        confirmBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
      function onConfirm() { cleanUp(); resolve(true); }
      function onCancel() { cleanUp(); resolve(false); }

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
    });
  }

  // Modal d’information
  const infoModal = document.createElement("div");
  infoModal.id = "infoModal";
  infoModal.className = "modal-overlay";
  const infoContent = document.createElement("div"); infoContent.className = "modal-content";
  const infoTitle = document.createElement("h3"); infoTitle.id = "infoTitle";
  const infoText = document.createElement("p"); infoText.id = "infoText";
  const infoActions = document.createElement("div"); infoActions.className = "modal-actions";
  const infoOkBtn = Object.assign(document.createElement("button"), { id: "infoOkBtn", className: "button-3d" });
  infoOkBtn.textContent = "OK";

  infoActions.appendChild(infoOkBtn);
  infoContent.append(infoTitle, infoText, infoActions);
  infoModal.append(infoContent);
  document.body.appendChild(infoModal);

  function showInfoModal(title, message) {
    return new Promise(resolve => {
      infoTitle.textContent = title;
      infoText.textContent = message;
      infoModal.style.display = "flex";

      function cleanUp() {
        infoOkBtn.removeEventListener("click", onOk);
        infoModal.style.display = "none";
      }
      function onOk() { cleanUp(); resolve(); }
      infoOkBtn.addEventListener("click", onOk);
    });
  }

  // --- Date min aujourd’hui ---
  const dateInput = document.getElementById("date");
  dateInput.setAttribute("min", new Date().toISOString().split("T")[0]);

  // --- Auto-complétion des élèves ---
  const eleveInput = document.getElementById("eleve");

  async function populateDatalist() {
    const users = await getUsers(token);
    const datalist = document.getElementById("eleves");
    datalist.textContent = "";
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = `${u.firstname} ${u.lastname}`;
      datalist.appendChild(opt);
    });
    return users;
  }

  let allUsers = await populateDatalist();

  eleveInput.addEventListener("input", () => {
    const query = eleveInput.value.toLowerCase();
    const datalist = document.getElementById("eleves");
    datalist.textContent = "";
    allUsers
      .filter(u => (`${u.firstname} ${u.lastname}`).toLowerCase().includes(query))
      .forEach(u => {
        const opt = document.createElement("option");
        opt.value = `${u.firstname} ${u.lastname}`;
        datalist.appendChild(opt);
      });
  });

  // --- Select heures (création + render) ---
  const startSelect = document.getElementById("start");
  const endSelect = document.getElementById("end");

  function generateTimeOptions(startHour = 7, endHour = 20) {
    const options = [];
    for (let h = startHour; h <= endHour; h++) {
      options.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < endHour) options.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return options;
  }

  // Remplir select début
  generateTimeOptions().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    startSelect.appendChild(opt);
  });

  function updateEndOptions() {
    const startTime = startSelect.value;
    if (!startTime) return;
    const [hStart, mStart] = startTime.split(":").map(Number);
    const startMinutes = hStart * 60 + mStart;
    endSelect.innerHTML = "";

    generateTimeOptions(7, 20)
      .filter(t => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m > startMinutes;
      })
      .forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        endSelect.appendChild(opt);
      });

    if (endSelect.options.length) endSelect.selectedIndex = 0;
  }

  startSelect.addEventListener("change", updateEndOptions);
  updateEndOptions();

  // --- Gestion du formulaire ---
  const form = document.querySelector(".planification-container form");
  const container = document.querySelector(".cards-container");
  let sessions = [];

  async function fetchAndRenderSessions() {
    try {
      sessions = await getPosts(token);
      renderSessions();
    } catch (err) {
      console.error(err);
      showInfoModal("Erreur", "Impossible de récupérer les séances");
    }
  }

  function renderSessions() {
    container.textContent = "";
    sessions.forEach(session => {
      const card = document.createElement("div");
      card.className = "card-admin box-shadow-3d";

      const title = document.createElement("h3");
      title.textContent = `${session.Client.firstname} ${session.Client.lastname}`;
      card.appendChild(title);

      const formEl = document.createElement("form");
      const flexGroup = document.createElement("div");
      flexGroup.className = "flex-group-card column";

      const dateGroup = document.createElement("div"); dateGroup.className = "form-group";
      const dateLabel = document.createElement("label"); dateLabel.textContent = "Date";
      const dateInput = document.createElement("input"); dateInput.type = "date";
      dateInput.value = session.appointment_date; dateInput.disabled = true;
      dateGroup.append(dateLabel, dateInput);

      const hoursDiv = document.createElement("div"); hoursDiv.className = "hours";

      const startGroup = document.createElement("div"); startGroup.className = "form-group";
      const startLabel = document.createElement("label"); startLabel.textContent = "Heure début";
      const startSelect = document.createElement("select"); startSelect.disabled = true;
      generateTimeOptions().forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        if (t === session.start_time.slice(0, 5)) opt.selected = true;
        startSelect.appendChild(opt);
      });
      startGroup.append(startLabel, startSelect);

      const endGroup = document.createElement("div"); endGroup.className = "form-group";
      const endLabel = document.createElement("label"); endLabel.textContent = "Heure fin";
      const endSelect = document.createElement("select"); endSelect.disabled = true;
      generateTimeOptions(7, 20).forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        if (t === session.end_time.slice(0, 5)) opt.selected = true;
        endSelect.appendChild(opt);
      });
      endGroup.append(endLabel, endSelect);

      hoursDiv.append(startGroup, endGroup);
      flexGroup.append(dateGroup, hoursDiv);
      formEl.appendChild(flexGroup);
      card.appendChild(formEl);

      // Actions
      const actionsDiv = document.createElement("div"); actionsDiv.className = "actions-admin";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-button"; deleteBtn.dataset.id = session.id;
      deleteBtn.setAttribute("aria-label", "Supprimer le rendez-vous");
      const deleteText = document.createElement("p"); deleteText.textContent = "Supprimer";
      const deleteIcon = document.createElement("i"); deleteIcon.className = "bx bx-trash";
      deleteBtn.append(deleteText, deleteIcon);

      const editBtn = document.createElement("button");
      editBtn.className = "edit-button"; editBtn.dataset.id = session.id;
      editBtn.setAttribute("aria-label", "Modifier le rendez-vous");
      const editText = document.createElement("p"); editText.textContent = "Modifier";
      const editIcon = document.createElement("i"); editIcon.className = "bx bx-edit";
      editBtn.append(editText, editIcon);

      actionsDiv.append(deleteBtn, editBtn);
      card.appendChild(actionsDiv);
      container.appendChild(card);
    });
  }

  // --- Form submit pour créer une séance ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eleveName = eleveInput.value;
    const appointment_date = dateInput.value;
    const start = startSelect.value;
    const end = endSelect.value;

    if (!eleveName || !appointment_date || !start || !end)
      return showInfoModal("Champs manquants", "Veuillez remplir tous les champs.");

    const selectedDate = new Date(appointment_date);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (selectedDate < now)
      return showInfoModal("Date invalide", "Vous ne pouvez pas créer une séance pour une date passée !");

    const user = allUsers.find(u => `${u.firstname} ${u.lastname}` === eleveName);
    if (!user) return showInfoModal("Erreur", "Utilisateur non trouvé");

    const postData = {
      id_client: user.id,
      id_admin: admin.id,
      appointment_date,
      start_time: start,
      end_time: end
    };

    try {
      await createPost(postData, token);
      await showInfoModal("Succès", "Séance créée !");
      form.reset();
      updateEndOptions(); // reset fin
      await fetchAndRenderSessions();
    } catch (err) {
      console.error(err);
      showInfoModal("Erreur", "Impossible de créer la séance");
    }
  });

  // --- Gestion des actions Modifier / Supprimer ---
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const sessionId = Number(btn.dataset.id);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const card = btn.closest(".card-admin");
    const selects = card.querySelectorAll("select");
    const inputs = card.querySelectorAll("input");

    // Supprimer
    if (btn.classList.contains("delete-button")) {
      const confirm = await showModal(
        "Supprimer ?",
        `Voulez-vous vraiment supprimer la séance de ${session.Client.firstname} ${session.Client.lastname} ?`,
        "Supprimer"
      );
      if (!confirm) return;
      try {
        await deletePost(sessionId, token);
        await showInfoModal("Succès", "Séance supprimée");
        await fetchAndRenderSessions();
      } catch (err) {
        console.error(err);
        showInfoModal("Erreur", "Impossible de supprimer");
      }
    }

    // Modifier
    if (btn.classList.contains("edit-button")) {
      if (btn.dataset.editing === "true") {
        const confirm = await showModal("Modifier ?", "Confirmer modification ?", "Enregistrer");
        if (!confirm) return;

        const updatedData = {
          appointment_date: inputs[0].value,
          start_time: selects[0].value,
          end_time: selects[1].value
        };

        const selectedDate = new Date(updatedData.appointment_date);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (selectedDate < now) return showInfoModal("Date invalide", "Impossible de mettre une date passée !");

        try {
          await updatePost(sessionId, updatedData, token);
          await showInfoModal("Succès", "Séance modifiée");
          await fetchAndRenderSessions();
        } catch (err) {
          console.error(err);
          showInfoModal("Erreur", "Impossible de modifier");
        }
      } else {
        selects.forEach(s => s.disabled = false);
        inputs.forEach(i => i.disabled = false);
        btn.dataset.editing = "true";
        btn.querySelector("p").textContent = "Enregistrer";
        btn.querySelector("i").className = "bx bx-save";
      }
    }
  });

  // --- Chargement initial des séances ---
  await fetchAndRenderSessions();
});