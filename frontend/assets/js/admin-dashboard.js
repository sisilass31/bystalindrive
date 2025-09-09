document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/pages/login.html";
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== 'admin') {
    window.location.href = "/pages/error-404.html";
    return;
  }

  console.log("Admin connecté :", payload);

  let admin;
  try {
    const res = await fetch(`http://localhost:3000/api/users/${payload.id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Impossible de récupérer les infos admin");
    admin = await res.json();
  } catch (err) {
    console.error(err);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
    return;
  }

  // -------------- Auto-complétion input élève --------------
  const eleveInput = document.getElementById("eleve");

  async function fetchUsersForDatalist() {
    try {
      const res = await fetch("http://localhost:3000/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Erreur récupération users :", err);
      return [];
    }
  }

  async function populateDatalist() {
    const users = await fetchUsersForDatalist();
    const datalist = document.getElementById("eleves");
    datalist.innerHTML = "";
    users.forEach(u => {
      const option = document.createElement("option");
      option.value = `${u.firstname} ${u.lastname}`;
      datalist.appendChild(option);
    });
  }
  populateDatalist();

  eleveInput.addEventListener("input", async () => {
    const query = eleveInput.value.toLowerCase();
    const users = await fetchUsersForDatalist();
    const datalist = document.getElementById("eleves");
    datalist.innerHTML = "";
    users
      .filter(u => (`${u.firstname} ${u.lastname}`).toLowerCase().includes(query))
      .forEach(u => {
        const option = document.createElement("option");
        option.value = `${u.firstname} ${u.lastname}`;
        datalist.appendChild(option);
      });
  });

  // -------------- MODAL CONFIRMATION --------------
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
    </div>
  `;
  document.body.appendChild(modal);

  function showModal(title, message, confirmText = "Confirmer") {
    return new Promise((resolve) => {
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

      function onConfirm() {
        cleanUp();
        resolve(true);
      }

      function onCancel() {
        cleanUp();
        resolve(false);
      }

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
    });
  }

  // -------------- MODAL INFO (Succès / Erreur) --------------
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
    </div>
  `;
  document.body.appendChild(infoModal);

  function showInfoModal(title, message) {
    return new Promise((resolve) => {
      document.getElementById("infoTitle").textContent = title;
      document.getElementById("infoText").textContent = message;
      const okBtn = document.getElementById("infoOkBtn");

      infoModal.style.display = "flex";

      function cleanUp() {
        okBtn.removeEventListener("click", onOk);
        infoModal.style.display = "none";
      }

      function onOk() {
        cleanUp();
        resolve();
      }

      okBtn.addEventListener("click", onOk);
    });
  }

  // -------------- DATE MIN = AUJOURD'HUI --------------
  const dateInput = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", today);

  // -------------- CRÉER UNE SÉANCE --------------
  const form = document.querySelector(".planification-container form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eleveName = document.getElementById("eleve").value;
    const date = document.getElementById("date").value;
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    if (!eleveName || !date || !start || !end) {
      return showInfoModal("Champs manquants", "Veuillez remplir tous les champs.");
    }

    // Vérif date future
    const selectedDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (selectedDate < now) {
      return showInfoModal("Date invalide", "Vous ne pouvez pas créer une séance pour une date passée !");
    }

    // Trouver élève
    const resUsers = await fetch("http://localhost:3000/api/users", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const users = await resUsers.json();
    const user = users.find(u => `${u.firstname} ${u.lastname}` === eleveName);
    if (!user) return showInfoModal("Erreur", "Utilisateur non trouvé");

    const postData = { id_user: user.id, id_admin: admin.id, date, start_time: start, end_time: end };

    try {
      const res = await fetch("http://localhost:3000/api/posts", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(postData)
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("Erreur backend :", result);
        return showInfoModal("Erreur", "Erreur lors de la création de la séance : " + (result.message || "Inconnue"));
      }

      await showInfoModal("Succès", "Séance créée !");
      form.reset();
      fetchAndRenderSessions();
    } catch (err) {
      console.error("Erreur réseau :", err);
      showInfoModal("Erreur réseau", "Impossible de contacter le serveur");
    }
  });

  // -------------- RÉCUPÉRER ET AFFICHER LES SÉANCES --------------
  async function fetchAndRenderSessions() {
    try {
      const res = await fetch("http://localhost:3000/api/posts", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) return [];
      const sessions = await res.json();
      renderSessions(sessions);
    } catch (err) {
      console.error("Erreur récupération séances :", err);
    }
  }

  function renderSessions(sessions) {
    const container = document.querySelector(".cards-container");
    container.innerHTML = "";

    sessions.forEach(session => {
      const card = document.createElement("div");
      card.className = "card-admin box-shadow-3d";
      card.innerHTML = `
      <h3>${session.User.firstname} ${session.User.lastname}</h3>
      <form action="#">
        <div class="flex-group-card column">
          <div class="form-group">
            <label>Date de la séance</label>
            <input type="date" value="${session.date}" disabled>
          </div>
          <div class="hours">
            <div class="form-group">
              <label>Heure de début</label>
              <input type="time" value="${session.start_time.slice(0, 5)}" disabled>
            </div>
            <div class="form-group">
              <label>Heure de fin</label>
              <input type="time" value="${session.end_time.slice(0, 5)}" disabled>
            </div>
          </div>
        </div>
      </form>
      <div class="actions-admin">
        <button class="delete-button" data-id="${session.id}"><p>Supprimer</p><i class='bxr bx-trash'></i></button>
        <button class="edit-button" data-id="${session.id}"><p>Modifier</p><i class='bxr bx-edit'></i></button>
      </div>
    `;
      container.appendChild(card);

      // --- Supprimer ---
      card.querySelector(".delete-button").addEventListener("click", async (e) => {
        e.preventDefault();
        const confirm = await showModal(
          "Supprimer le rendez-vous ?",
          "Êtes-vous sûr ? Cette action entraînera la suppression définitive du rendez-vous.",
          "Supprimer"
        );
        if (!confirm) return;

        try {
          const res = await fetch(`http://localhost:3000/api/posts/${session.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Erreur suppression");
          fetchAndRenderSessions();
        } catch (err) {
          console.error(err);
          showInfoModal("Erreur", "Erreur suppression séance");
        }
      });

      // --- Modifier / Enregistrer ---
      const editBtn = card.querySelector(".edit-button");
      editBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const formInputs = card.querySelectorAll("input");

        if (editBtn.textContent.includes("Modifier")) {
          // Activer la modif
          formInputs.forEach(input => input.disabled = false);
          editBtn.innerHTML = "<p>Enregistrer</p><i class='bxr bx-save'></i>";
        } else {
          // Confirmer modal
          const confirm = await showModal(
            "Modifier le rendez-vous ?",
            "Êtes-vous sûr ? Cette action entraînera la modification du rendez-vous.",
            "Enregistrer"
          );
          if (!confirm) return;

          const updatedData = {
            date: formInputs[0].value,
            start_time: formInputs[1].value,
            end_time: formInputs[2].value
          };

          // Vérifier date future
          const selectedDate = new Date(updatedData.date);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          if (selectedDate < now) {
            return showInfoModal("Date invalide", "Vous ne pouvez pas mettre une date passée !");
          }

          try {
            const res = await fetch(`http://localhost:3000/api/posts/${session.id}`, {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(updatedData)
            });

            const result = await res.json();
            if (!res.ok) {
              console.error("Erreur backend :", result);
              return showInfoModal("Erreur", "Erreur modification : " + (result.message || "Inconnue"));
            }

            fetchAndRenderSessions();
          } catch (err) {
            console.error(err);
            showInfoModal("Erreur", "Erreur modification séance");
          }
        }
      });
    });
  }

  fetchAndRenderSessions();
});