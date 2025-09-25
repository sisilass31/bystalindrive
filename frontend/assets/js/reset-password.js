document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:3000/api/users";

    function showModal(message, type = "info") {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
      <div class="modal-content ${type}">
        <p>${message}</p>
        <button id="closeModalBtn" class="button-3d">OK</button>
      </div>
    `;
        document.body.appendChild(modal);
        modal.style.display = "flex";
        modal.querySelector("#closeModalBtn").addEventListener("click", () => modal.remove());
        modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    }

    function evaluatePassword(pwd = "") {
        return {
            length: /.{12,}/.test(pwd),
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /\d/.test(pwd),
            special: /[^A-Za-z0-9]/.test(pwd)
        };
    }

    function initPasswordCriteria(passwordInputId, confirmInputId, criteriaId, matchId) {
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
            li.innerHTML = `<i class='bxr bx-x-circle'></i> ${def.text}`;
            criteriaList.appendChild(li);
        });

        messageEl.appendChild(criteriaList);

        function updateCriteria() {
            const pwd = passEl.value || "";
            const result = evaluatePassword(pwd);

            // Critères
            criteriaDefs.forEach(def => {
                const li = criteriaList.querySelector(`li[data-key="${def.key}"]`);
                const icon = li.querySelector("i");
                if (result[def.key]) {
                    li.classList.replace("invalid", "valid");
                    icon.className = "bxr bx-check-circle";
                    icon.style.backgroundImage = "linear-gradient(90deg, #ef7f09, #e75617)";
                    icon.style.webkitBackgroundClip = "text";
                    icon.style.webkitTextFillColor = "transparent";
                    icon.style.color = "transparent";
                } else {
                    li.classList.replace("valid", "invalid");
                    icon.className = "bxr bx-x-circle";
                    // RESET COMPLET DES STYLES
                    icon.style.backgroundImage = "";
                    icon.style.webkitBackgroundClip = "";
                    icon.style.webkitTextFillColor = "";
                    icon.style.color = "#ccc"; // couleur neutre
                }
            });


            // Correspondance
            if (confirmEl.value.length > 0) {
                if (pwd === confirmEl.value) {
                    matchEl.innerHTML = `<i class='bxr bx-check-circle' style="background: linear-gradient(90deg, #ef7f09, #e75617); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: transparent;"></i> Les mots de passe correspondent`;
                } else {
                    matchEl.innerHTML = `<i class='bxr bx-x-circle' style="color: #999;"></i> Les mots de passe ne correspondent pas`;
                }
            } else {
                matchEl.textContent = "";
            }
        }

        passEl.addEventListener("input", updateCriteria);
        confirmEl.addEventListener("input", updateCriteria);
        updateCriteria();
    }

    initPasswordCriteria("resetPassword", "resetConfirmPassword", "resetMessage", "resetMatchMessage");

    // RESET FORM SUBMIT
    const resetForm = document.getElementById("resetForm");
    if (resetForm) {
        resetForm.addEventListener("submit", async e => {
            e.preventDefault();
            const params = new URLSearchParams(window.location.search);
            const token = params.get("token");
            const password = document.getElementById("resetPassword")?.value;
            const confirm = document.getElementById("resetConfirmPassword")?.value;

            if (!password || !confirm) return showModal("Veuillez remplir tous les champs", "error");
            if (password !== confirm) return showModal("Les mots de passe ne correspondent pas", "error");

            const result = evaluatePassword(password);
            if (!Object.values(result).every(Boolean)) return showModal("Le mot de passe n'est pas conforme", "error");

            try {
                const res = await fetch(`${API_URL}/reset-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, newPassword: password })
                });
                const data = await res.json();
                if (res.ok) {
                    showModal("Mot de passe réinitialisé avec succès", "success");
                    window.location.href = "/pages/login.html";
                } else {
                    showModal(data.message || "Erreur lors de la réinitialisation", "error");
                }
            } catch {
                showModal("Erreur serveur lors de la réinitialisation", "error");
            }
        });
    }

    // TOGGLE PASSWORD
    const toggle = document.getElementById("toggleResetPassword");
    const toggleConfirm = document.getElementById("toggleResetConfirm");
    const passEl = document.getElementById("resetPassword");
    const confirmEl = document.getElementById("resetConfirmPassword");

    if (toggle && passEl) {
        toggle.addEventListener("click", () => {
            const isPassword = passEl.type === "password";
            passEl.type = isPassword ? "text" : "password";
            toggle.classList.toggle("bx-eye", isPassword);
            toggle.classList.toggle("bx-eye-slash", !isPassword);
        });
    }
    if (toggleConfirm && confirmEl) {
        toggleConfirm.addEventListener("click", () => {
            const isPassword = confirmEl.type === "password";
            confirmEl.type = isPassword ? "text" : "password";
            toggleConfirm.classList.toggle("bx-eye", isPassword);
            toggleConfirm.classList.toggle("bx-eye-slash", !isPassword);
        });
    }
});