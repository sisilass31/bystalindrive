document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "/pages/login.html";

  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== 'admin') return window.location.href = "/pages/error-404.html";

  console.log("Admin connecté :", payload);

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

  // --- MODALS ---
  const modal = document.createElement("div");
  modal.id = "confirmModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <h3 id="modalTitle"></h3>
      <p id="modalText"></p>
      <div class="modal-actions">
        <button id="cancelBtn" class="button-3d">Annuler</button>
        <button id="confirmBtn" class="delete-button">Confirmer</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  function showModal(title, message, confirmText = "Confirmer") {
    return new Promise(resolve => {
      document.getElementById("modalTitle").textContent = title;
      document.getElementById("modalText").textContent = message;
      const confirmBtn = document.getElementById("confirmBtn");
      const cancelBtn = document.getElementById("cancelBtn");
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

  const infoModal = document.createElement("div");
  infoModal.id = "infoModal";
  infoModal.className = "modal-overlay";
  infoModal.innerHTML = `
    <div class="modal-content">
      <h3 id="infoTitle"></h3>
      <p id="infoText"></p>
      <div class="modal-actions">
        <button id="infoOkBtn" class="button-3d">OK</button>
      </div>
    </div>`;
  document.body.appendChild(infoModal);

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

  // --- DATE MIN TODAY ---
  const dateInput = document.getElementById("date");
  dateInput.setAttribute("min", new Date().toISOString().split("T")[0]);

  const eleveInput = document.getElementById("eleve");
  async function fetchUsersForDatalist() {
    try {
      const res = await fetch("http://localhost:3000/api/users", { headers: { Authorization: `Bearer ${token}` }});
      return res.ok ? await res.json() : [];
    } catch { return []; }
  }

  async function populateDatalist() {
    const users = await fetchUsersForDatalist();
    const datalist = document.getElementById("eleves");
    datalist.innerHTML = "";
    users.forEach(u => datalist.appendChild(Object.assign(document.createElement("option"), { value: `${u.firstname} ${u.lastname}` })));
  }
  await populateDatalist();

  eleveInput.addEventListener("input", async () => {
    const query = eleveInput.value.toLowerCase();
    const users = await fetchUsersForDatalist();
    const datalist = document.getElementById("eleves");
    datalist.innerHTML = "";
    users.filter(u => (`${u.firstname} ${u.lastname}`).toLowerCase().includes(query))
      .forEach(u => datalist.appendChild(Object.assign(document.createElement("option"), { value: `${u.firstname} ${u.lastname}` })));
  });

  const form = document.querySelector(".planification-container form");
  const container = document.querySelector(".cards-container");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eleveName = eleveInput.value;
    const appointment_date = dateInput.value;
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    if (!eleveName || !appointment_date || !start || !end) return showInfoModal("Champs manquants", "Veuillez remplir tous les champs.");

    const selectedDate = new Date(date);
    const now = new Date(); now.setHours(0,0,0,0);
    if (selectedDate < now) return showInfoModal("Date invalide", "Vous ne pouvez pas créer une séance pour une date passée !");

    const users = await fetchUsersForDatalist();
    const user = users.find(u => `${u.firstname} ${u.lastname}` === eleveName);
    if (!user) return showInfoModal("Erreur", "Utilisateur non trouvé");

    const postData = { id_client: user.id, id_admin: admin.id, appointment_date, start_time: start, end_time: end };
    try {
      const res = await fetch("http://localhost:3000/api/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(postData)
      });
      if (!res.ok) throw new Error("Erreur création");
      await showInfoModal("Succès", "Séance créée !");
      form.reset();
      fetchAndRenderSessions();
    } catch (err) { console.error(err); showInfoModal("Erreur", "Impossible de créer la séance"); }
  });

  // --- FETCH & RENDER SESSIONS ---
  let sessions = [];
  async function fetchAndRenderSessions() {
    try {
      const res = await fetch("http://localhost:3000/api/posts", { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error("Erreur fetch sessions");
      sessions = await res.json();
      renderSessions();
    } catch (err) { console.error(err); showInfoModal("Erreur", "Impossible de récupérer les séances"); }
  }

  function renderSessions() {
    container.innerHTML = "";
    sessions.forEach(session => {
      const card = document.createElement("div");
      card.className = "card-admin box-shadow-3d";
      card.innerHTML = `
        <h3>${session.Client.firstname} ${session.Client.lastname}</h3>
        <form>
          <div class="flex-group-card column">
            <div class="form-group"><label>Date</label><input type="date" value="${session.appointment_date}" disabled></div>
            <div class="hours">
              <div class="form-group"><label>Heure début</label><input type="time" value="${session.start_time.slice(0,5)}" disabled></div>
              <div class="form-group"><label>Heure fin</label><input type="time" value="${session.end_time.slice(0,5)}" disabled></div>
            </div>
          </div>
        </form>
        <div class="actions-admin">
          <button class="delete-button" data-id="${session.id}"><p>Supprimer</p><i class='bxr bx-trash'></i></button>
          <button class="edit-button" data-id="${session.id}"><p>Modifier</p><i class='bxr bx-edit'></i></button>
        </div>`;
      container.appendChild(card);
    });
  }

  // --- Event Delegation pour Modifier / Supprimer ---
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const sessionId = Number(btn.dataset.id);
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const card = btn.closest(".card-admin");
    const inputs = card.querySelectorAll("input");

    if (btn.classList.contains("delete-button")) {
      const confirm = await showModal("Supprimer ?", `Voulez-vous vraiment supprimer la séance de ${session.Client.firstname} ${session.Client.lastname} ?`, "Supprimer");
      if (!confirm) return;
      try { await fetch(`http://localhost:3000/api/posts/${sessionId}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } }); await showInfoModal("Succès","Séance supprimée"); fetchAndRenderSessions(); }
      catch(err){ console.error(err); showInfoModal("Erreur","Impossible de supprimer"); }
    }

    if (btn.classList.contains("edit-button")) {
      if (btn.dataset.editing === "true") {
        const confirm = await showModal("Modifier ?", "Confirmer modification ?", "Enregistrer");
        if (!confirm) return;

        const updatedData = { appointment_date: inputs[0].value, start_time: inputs[1].value, end_time: inputs[2].value };
        const selectedDate = new Date(updatedData.appointment_date);
        const now = new Date(); now.setHours(0,0,0,0);
        if (selectedDate < now) return showInfoModal("Date invalide", "Impossible de mettre une date passée !");

        try {
          await fetch(`http://localhost:3000/api/posts/${sessionId}`, { method:"PUT", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json" }, body: JSON.stringify(updatedData) });
          await showInfoModal("Succès", "Séance modifiée"); fetchAndRenderSessions();
        } catch(err){ console.error(err); showInfoModal("Erreur","Impossible de modifier"); }
      } else {
        inputs.forEach(i=>i.disabled=false);
        btn.dataset.editing = "true";
        btn.innerHTML="<p>Enregistrer</p><i class='bxr bx-save'></i>";
      }
    }
  });

  await fetchAndRenderSessions();
});