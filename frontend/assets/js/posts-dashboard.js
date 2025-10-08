// Attendre que le DOM soit chargé avant d’exécuter le script
document.addEventListener("DOMContentLoaded", async () => {
  // --- Vérification de l’authentification ---
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "/pages/login.html";

  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== 'admin') return window.location.href = "/pages/error-404.html";

  console.log("Admin connecté :", payload);

  // --- Récupération des infos de l’admin ---
  let admin;
  try {
    const res = await fetch(`http://localhost:3000/api/users/${payload.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Impossible de récupérer les infos admin");
    admin = await res.json();
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

  const modalTitle = document.createElement("h3");
  modalTitle.id = "modalTitle";
  const modalText = document.createElement("p");
  modalText.id = "modalText";

  const modalActions = document.createElement("div");
  modalActions.className = "modal-actions";
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

      function cleanUp() {
        confirmBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        modal.style.display = "none";
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
  const infoContent = document.createElement("div");
  infoContent.className = "modal-content";
  const infoTitle = document.createElement("h3");
  infoTitle.id = "infoTitle";
  const infoText = document.createElement("p");
  infoText.id = "infoText";
  const infoActions = document.createElement("div");
  infoActions.className = "modal-actions";
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

  async function fetchUsersForDatalist() {
    try {
      const res = await fetch("http://localhost:3000/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  }

  async function populateDatalist() {
    const users = await fetchUsersForDatalist();
    const datalist = document.getElementById("eleves");
    datalist.textContent = "";
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = `${u.firstname} ${u.lastname}`;
      datalist.appendChild(opt);
    });
  }
  await populateDatalist();

  eleveInput.addEventListener("input", async () => {
    const query = eleveInput.value.toLowerCase();
    const users = await fetchUsersForDatalist();
    const datalist = document.getElementById("eleves");
    datalist.textContent = "";
    users
      .filter(u => (`${u.firstname} ${u.lastname}`).toLowerCase().includes(query))
      .forEach(u => {
        const opt = document.createElement("option");
        opt.value = `${u.firstname} ${u.lastname}`;
        datalist.appendChild(opt);
      });
  });

  // --- Gestion du formulaire ---
  const form = document.querySelector(".planification-container form");
  const container = document.querySelector(".cards-container");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eleveName = eleveInput.value;
    const appointment_date = dateInput.value;
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    if (!eleveName || !appointment_date || !start || !end)
      return showInfoModal("Champs manquants", "Veuillez remplir tous les champs.");

    const selectedDate = new Date(appointment_date);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (selectedDate < now)
      return showInfoModal("Date invalide", "Vous ne pouvez pas créer une séance pour une date passée !");

    const users = await fetchUsersForDatalist();
    const user = users.find(u => `${u.firstname} ${u.lastname}` === eleveName);
    if (!user) return showInfoModal("Erreur", "Utilisateur non trouvé");

    const postData = {
      id_client: user.id,
      id_admin: admin.id,
      appointment_date,
      start_time: start,
      end_time: end
    };

    try {
      const res = await fetch("http://localhost:3000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(postData)
      });
      if (!res.ok) throw new Error("Erreur création");
      await showInfoModal("Succès", "Séance créée !");
      form.reset();
      fetchAndRenderSessions();
    } catch (err) {
      console.error(err);
      showInfoModal("Erreur", "Impossible de créer la séance");
    }
  });

  // --- Fetch et affichage des séances ---
  let sessions = [];

  async function fetchAndRenderSessions() {
    try {
      const res = await fetch("http://localhost:3000/api/posts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erreur fetch sessions");
      sessions = await res.json();
      renderSessions();
    } catch (err) {
      console.error(err);
      showInfoModal("Erreur", "Impossible de récupérer les séances");
    }
  }

  // --- Affichage sécurisé des séances ---
  function renderSessions() {
    container.textContent = "";

    sessions.forEach(session => {
      const card = document.createElement("div");
      card.className = "card-admin box-shadow-3d";

      const title = document.createElement("h3");
      title.textContent = `${session.Client.firstname} ${session.Client.lastname}`;
      card.appendChild(title);

      const form = document.createElement("form");
      const flexGroup = document.createElement("div");
      flexGroup.className = "flex-group-card column";

      // Date
      const dateGroup = document.createElement("div");
      dateGroup.className = "form-group";
      const dateLabel = document.createElement("label");
      dateLabel.textContent = "Date";
      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = session.appointment_date;
      dateInput.disabled = true;
      dateGroup.append(dateLabel, dateInput);

      // Heures
      const hoursDiv = document.createElement("div");
      hoursDiv.className = "hours";

      const startGroup = document.createElement("div");
      startGroup.className = "form-group";
      const startLabel = document.createElement("label");
      startLabel.textContent = "Heure début";
      const startInput = document.createElement("input");
      startInput.type = "time";
      startInput.value = session.start_time.slice(0, 5);
      startInput.disabled = true;
      startGroup.append(startLabel, startInput);

      const endGroup = document.createElement("div");
      endGroup.className = "form-group";
      const endLabel = document.createElement("label");
      endLabel.textContent = "Heure fin";
      const endInput = document.createElement("input");
      endInput.type = "time";
      endInput.value = session.end_time.slice(0, 5);
      endInput.disabled = true;
      endGroup.append(endLabel, endInput);

      hoursDiv.append(startGroup, endGroup);
      flexGroup.append(dateGroup, hoursDiv);
      form.appendChild(flexGroup);
      card.appendChild(form);

      // Actions
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "actions-admin";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-button";
      deleteBtn.dataset.id = session.id;
      deleteBtn.setAttribute("aria-label", "Supprimer le rendez-vous");
      const deleteText = document.createElement("p");
      deleteText.textContent = "Supprimer";
      const deleteIcon = document.createElement("i");
      deleteIcon.className = "bx bx-trash";
      deleteBtn.append(deleteText, deleteIcon);

      const editBtn = document.createElement("button");
      editBtn.className = "edit-button";
      editBtn.dataset.id = session.id;
      editBtn.setAttribute("aria-label", "Modifier le rendez-vous");
      const editText = document.createElement("p");
      editText.textContent = "Modifier";
      const editIcon = document.createElement("i");
      editIcon.className = "bx bx-edit";
      editBtn.append(editText, editIcon);

      actionsDiv.append(deleteBtn, editBtn);
      card.appendChild(actionsDiv);
      container.appendChild(card);
    });
  }

  // --- Gestion des actions Modifier / Supprimer ---
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const sessionId = Number(btn.dataset.id);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const card = btn.closest(".card-admin");
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
        await fetch(`http://localhost:3000/api/posts/${sessionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        await showInfoModal("Succès", "Séance supprimée");
        fetchAndRenderSessions();
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
          start_time: inputs[1].value,
          end_time: inputs[2].value
        };
        const selectedDate = new Date(updatedData.appointment_date);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (selectedDate < now) return showInfoModal("Date invalide", "Impossible de mettre une date passée !");

        try {
          await fetch(`http://localhost:3000/api/posts/${sessionId}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
          });
          await showInfoModal("Succès", "Séance modifiée");
          fetchAndRenderSessions();
        } catch (err) {
          console.error(err);
          showInfoModal("Erreur", "Impossible de modifier");
        }
      } else {
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