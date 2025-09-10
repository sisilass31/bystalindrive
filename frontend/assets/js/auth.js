document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:3000/api/users";

    // --- VÉRIFICATION SI DÉJÀ CONNECTÉ(E) ---
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Token existant payload :", payload);

            const role = payload.role.toLowerCase(); // Normalisation
            const currentPage = window.location.pathname;

            // Rediriger SEULEMENT si on est sur login.html
            if (currentPage.endsWith("login.html")) {
                if (role === "admin") {
                    window.location.href = "/pages/admin/posts-dashboard.html";
                } else if (role === "user") {
                    window.location.href = "/pages/client/espace-client.html";
                } else {
                    console.warn("Rôle inconnu dans token :", role);
                    localStorage.removeItem("token");
                }
            }

        } catch (err) {
            console.error("Erreur décodage token :", err);
            localStorage.removeItem("token");
        }
    }

    // --- LOGIN ---
    const form = document.getElementById("loginForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();
                console.log("Résultat login :", result);

                if (response.ok && result.token) {
                    localStorage.setItem("token", result.token);

                    const payload = JSON.parse(atob(result.token.split('.')[1]));
                    const role = payload.role.toLowerCase(); // Normalisation

                    if (role === "admin") {
                        window.location.href = "/pages/admin/posts-dashboard.html";
                    } else if (role === "user") {
                        window.location.href = result.redirect || "/pages/client/espace-client.html";
                    } else {
                        localStorage.removeItem("token");
                        alert("Rôle inconnu ❌");
                    }
                } else {
                    alert("Erreur : " + (result.message || "Identifiants incorrects"));
                }

            } catch (err) {
                console.error("Erreur réseau :", err);
                alert("Impossible de contacter le serveur ❌");
            }
        });
    }

    // --- NAVBAR / Logout ---
    const authContainer = document.getElementById("authBtnContainer");
    if (authContainer) {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload.role.toLowerCase(); // Normalisation
                let html = "";

                if (role === "admin") {
                    html = `
                        <a href="/pages/admin/posts-dashboard.html" class="button-3d height-32">
                            <span>Dashboard</span>
                            <i class='bx bx-layout'></i>
                        </a>
                    `;
                } else if (role === "user") {
                    html = `
                        <a href="/pages/client/espace-client.html" class="button-3d height-32">
                            <span>Mon espace client</span>
                            <i class='bx bx-user-circle'></i>
                        </a>
                    `;
                }

                html += `
                    <a href="#" id="logoutBtn" class="gradient-button height-32">
                        <span>Déconnexion</span>
                        <i class='bx bx-log-out'></i>
                    </a>
                `;

                authContainer.innerHTML = html;

                document.getElementById("logoutBtn").addEventListener("click", (e) => {
                    e.preventDefault();
                    localStorage.removeItem("token");
                    window.location.href = "/pages/login.html";
                });

            } catch (err) {
                console.error("Erreur décodage token :", err);
                localStorage.removeItem("token");
            }
        } else {
            authContainer.innerHTML = `
                <a href="/pages/login.html" class="gradient-button height-32">
                    <span>Connexion</span>
                    <i class='bx bx-log-in'></i>
                </a>
            `;
        }
    }

    // --- TOGGLE PASSWORD ---
    const passwordInput = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");
    if (passwordInput && toggle) {
        toggle.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            toggle.classList.toggle("bx-eye", isPassword);
            toggle.classList.toggle("bx-eye-slash", !isPassword);
        });
    }
});