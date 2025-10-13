// URL de base de l'API
const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:3000/api/users"
  : "https://bystalindrive.onrender.com/api/users";

document.addEventListener("DOMContentLoaded", () => {

    // --- Sécurité : redirection si déjà connecté ---
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const role = payload.role?.toLowerCase();
            if (role === "admin") return window.location.href = "/pages/admin/dashboard.html";
            if (role === "user" || role === "client") return window.location.href = "/pages/client/espace-client.html";
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
        } catch {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
        }
    }

    // --- Création modale dynamique ---
    function showModal(message, type = "info") {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";

        const content = document.createElement("div");
        content.className = `modal-content ${type}`;

        const msg = document.createElement("p");
        msg.textContent = message;

        const btn = document.createElement("button");
        btn.id = "closeModalBtn";
        btn.className = "button-3d";
        btn.setAttribute("aria-label", "Fermer le modal");
        btn.textContent = "OK";

        content.append(msg, btn);
        modal.appendChild(content);
        document.body.appendChild(modal);

        modal.style.display = "flex";
        btn.addEventListener("click", () => modal.remove());
        modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    }

    // --- Vérification conformité mot de passe ---
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

            const icon = document.createElement("i");
            icon.className = "bxr bx-x-circle";

            li.append(icon, document.createTextNode(` ${def.text}`));
            criteriaList.appendChild(li);
        });

        messageEl.appendChild(criteriaList);

        function updateCriteria() {
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

            matchEl.textContent = "";
            if (confirmEl.value.length > 0) {
                const icon = document.createElement("i");
                if (pwd === confirmEl.value) {
                    icon.className = "bxr bx-check-circle";
                    matchEl.append(icon, document.createTextNode(" Les mots de passe correspondent"));
                } else {
                    icon.className = "bxr bx-x-circle";
                    matchEl.append(icon, document.createTextNode(" Les mots de passe ne correspondent pas"));
                }
            }
        }

        passEl.addEventListener("input", updateCriteria);
        confirmEl.addEventListener("input", updateCriteria);
        updateCriteria();
    }

    initPasswordCriteria("resetPassword", "resetConfirmPassword", "resetMessage", "resetMatchMessage");

    // --- Form reset password ---
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

    // --- Toggle visibilité mot de passe ---
    const togglePass = document.getElementById("toggleResetPassword");
    const toggleConfirm = document.getElementById("toggleResetConfirm");
    const passEl = document.getElementById("resetPassword");
    const confirmEl = document.getElementById("resetConfirmPassword");

    if (togglePass && passEl) {
        togglePass.addEventListener("click", () => {
            const isPassword = passEl.type === "password";
            passEl.type = isPassword ? "text" : "password";
            togglePass.classList.toggle("bx-eye", isPassword);
            togglePass.classList.toggle("bx-eye-slash", !isPassword);
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