document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:3000/api/users"; // API backend

    // Vérifier si un utilisateur est déjà connecté (admin ou user)
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
        // Si déjà connecté, redirection selon rôle
        const userRole = localStorage.getItem("role") || sessionStorage.getItem("role");
        if (userRole === "admin") {
            window.location.href = "/pages/admin/dashboard.html";
        } else {
            window.location.href = "/pages/client/espace-client.html";
        }
        return; // Bloquer l'accès au set-password
    }

    // Fonction pour afficher des modals messages
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

    // Fonction d'évaluation de la conformité du mot de passe
    function evaluatePassword(pwd = "") {
        return {
            length: /.{12,}/.test(pwd),
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /\d/.test(pwd),
            special: /[^A-Za-z0-9]/.test(pwd)
        };
    }

    // Initialise la vérification des critères et correspondance
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

            // Mise à jour visuelle des critères
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
                    icon.style.backgroundImage = "";
                    icon.style.webkitBackgroundClip = "";
                    icon.style.webkitTextFillColor = "";
                    icon.style.color = "#ccc";
                }
            });

            // Vérification correspondance avec confirmation
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

    // Initialise la conformité pour set-password
    initPasswordCriteria("setPassword", "setConfirmPassword", "setPasswordMessage", "setMatchMessage");

    // Gestion du submit du formulaire
    const form = document.getElementById("setPasswordForm");
    if (form) {
        form.addEventListener("submit", async e => {
            e.preventDefault();
            const params = new URLSearchParams(window.location.search);
            const token = params.get("token");
            const password = document.getElementById("setPassword")?.value;
            const confirm = document.getElementById("setConfirmPassword")?.value;

            if (!password || !confirm) return showModal("Veuillez remplir tous les champs", "error");
            if (password !== confirm) return showModal("Les mots de passe ne correspondent pas", "error");

            const result = evaluatePassword(password);
            if (!Object.values(result).every(Boolean)) return showModal("Le mot de passe n'est pas conforme", "error");

            try {
                const res = await fetch(`${API_URL}/set-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, password })
                });
                const data = await res.json();

                if (res.ok) {
                    // Redirection vers login après activation
                    showModal("Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter.", "success");
                    setTimeout(() => window.location.href = "/pages/login.html", 1500);
                } else {
                    showModal(data.message || "Erreur lors de l’activation du compte", "error");
                }
            } catch {
                showModal("Erreur serveur lors de l’activation du compte", "error");
            }
        });
    }

    // Gestion toggle visibilité mot de passe
    const toggle = document.getElementById("toggleSetPassword");
    const toggleConfirm = document.getElementById("toggleSetConfirm");
    const passEl = document.getElementById("setPassword");
    const confirmEl = document.getElementById("setConfirmPassword");

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