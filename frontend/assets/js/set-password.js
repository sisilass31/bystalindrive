// URL de base de l'API
const API_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000/api/users"
    : "https://bystalindrive.onrender.com/api/users";

document.addEventListener("DOMContentLoaded", async () => {

    // Vérifier le token depuis l'URL avant de continuer
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // Redirection si pas de token
    if (!token) {
        window.location.href = "/pages/login.html";
        return;
    } else {
        try {
            const res = await fetch(`${API_URL}/check-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (!res.ok) {
                showModal(data.message || "Lien invalide ou expiré.", "error", () => {
                    window.location.href = "/pages/login.html";
                });
                return;
            }
        } catch (err) {
            console.error("Erreur vérification token :", err);
            showModal("Erreur serveur lors de la vérification du lien.", "error", () => {
                window.location.href = "/pages/login.html";
            });
            return;
        }
    }

    // Bloquer accès si déjà connecté
    const userToken = localStorage.getItem("token");
    if (userToken) {
        try {
            const res = await fetch(`${API_URL.replace("/api/users", "/api/users/me")}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });

            if (res.ok) {
                const user = await res.json();
                if (user.role === "admin") {
                    window.location.href = "/pages/admin/dashboard.html";
                } else {
                    window.location.href = "/pages/client/espace-client.html";
                }
                return;
            }
        } catch (err) {
            console.error("Erreur lors de la vérification du rôle :", err);
        }
    }

    // Fonction pour afficher une modal avec callback sur fermeture
    function showModal(message, type = "info", onClose = null) {
        const modal = document.createElement("div");
        modal.className = "modal-overlay";

        const modalContent = document.createElement("div");
        modalContent.className = `modal-content ${type}`;

        const p = document.createElement("p");
        p.textContent = message;

        const closeBtn = document.createElement("button");
        closeBtn.className = "button-3d";
        closeBtn.textContent = "OK";

        modalContent.append(p, closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        document.body.style.overflow = "hidden";
        modal.style.display = "flex";

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = "auto";
            if (typeof onClose === "function") onClose();
        };

        closeBtn.addEventListener("click", closeModal);
        modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    }

    // Vérification mot de passe
    function checkPassword(pwd = "") {
        return {
            length: /.{12,}/.test(pwd),
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /\d/.test(pwd),
            special: /[^A-Za-z0-9]/.test(pwd)
        };
    }

    // Initialisation critères et correspondance
    function initCriteria(passId, confirmId, criteriaId, matchId) {
        const passEl = document.getElementById(passId);
        const confirmEl = document.getElementById(confirmId);
        const critEl = document.getElementById(criteriaId);
        const matchEl = document.getElementById(matchId);
        if (!passEl || !critEl || !matchEl) return;

        const defs = [
            { key: "length", text: "Au moins 12 caractères" },
            { key: "upper", text: "Une majuscule" },
            { key: "lower", text: "Une minuscule" },
            { key: "number", text: "Un chiffre" },
            { key: "special", text: "Un caractère spécial" }
        ];

        const items = {};
        const ul = document.createElement("ul");
        ul.className = "criteria-list";
        defs.forEach(def => {
            const li = document.createElement("li");
            li.dataset.key = def.key;
            li.className = "invalid";
            const icon = document.createElement("i");
            icon.className = "bx bx-x-circle";
            icon.style.color = "#ccc";
            li.append(icon, document.createTextNode(` ${def.text}`));
            ul.appendChild(li);
            items[def.key] = { li, icon };
        });
        critEl.appendChild(ul);

        const matchIcon = document.createElement("i");
        const matchText = document.createElement("span");
        matchEl.append(matchIcon, matchText);

        function update() {
            const pwd = passEl.value || "";
            const res = checkPassword(pwd);
            defs.forEach(d => {
                const { li, icon } = items[d.key];
                if (res[d.key]) {
                    li.classList.add("valid");
                    li.classList.remove("invalid");
                    icon.className = "bx bx-check-circle";
                    icon.style.color = "green";
                } else {
                    li.classList.add("invalid");
                    li.classList.remove("valid");
                    icon.className = "bx bx-x-circle";
                    icon.style.color = "#ccc";
                }
            });

            if (confirmEl.value.length > 0) {
                if (pwd === confirmEl.value) {
                    matchIcon.className = "bx bx-check-circle";
                    matchIcon.style.color = "green";
                    matchText.textContent = " Les mots de passe correspondent";
                } else {
                    matchIcon.className = "bx bx-x-circle";
                    matchIcon.style.color = "#999";
                    matchText.textContent = " Les mots de passe ne correspondent pas";
                }
            } else {
                matchIcon.className = "";
                matchText.textContent = "";
            }
        }

        passEl.addEventListener("input", update);
        confirmEl.addEventListener("input", update);
        update();
    }

    initCriteria("setPassword", "setConfirmPassword", "setPasswordMessage", "setMatchMessage");

    // Toggle visibilité mot de passe
    function setupToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (!toggle || !input) return;
        toggle.addEventListener("click", () => {
            const isPwd = input.type === "password";
            input.type = isPwd ? "text" : "password";
            toggle.classList.toggle("bx-eye", isPwd);
            toggle.classList.toggle("bx-eye-slash", !isPwd);
        });
    }
    setupToggle("toggleSetPassword", "setPassword");
    setupToggle("toggleSetConfirm", "setConfirmPassword");

    // Formulaire set-password
    const form = document.getElementById("setPasswordForm");
    form?.addEventListener("submit", async e => {
        e.preventDefault();
        const password = document.getElementById("setPassword")?.value;
        const confirm = document.getElementById("setConfirmPassword")?.value;

        if (!password || !confirm) return showModal("Veuillez remplir tous les champs", "error");
        if (password !== confirm) return showModal("Les mots de passe ne correspondent pas", "error");
        if (!Object.values(checkPassword(password)).every(Boolean)) return showModal("Mot de passe non conforme", "error");

        try {
            const res = await fetch(`${API_URL}/set-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();

            if (res.ok) {
                showModal(
                    "Mot de passe défini avec succès. Vous pouvez maintenant vous connecter.",
                    "success",
                    () => window.location.href = "/pages/login.html"
                );
            } else {
                showModal(data.message || "Erreur lors de l’activation du compte", "error");
            }
        } catch {
            showModal("Erreur serveur lors de l’activation du compte", "error");
        }
    });
});