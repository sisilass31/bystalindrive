document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:3000/api/users";

    // --- FONCTION : décoder le token ---
    function getTokenPayload() {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (err) {
            localStorage.removeItem("token");
            return null;
        }
    }

    let payload = getTokenPayload();

    // --- MODAL D'INFO ---
    function showModal(message, type = "info") {
        // type: info, error, success
        let modal = document.createElement("div");
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-content ${type}">
                <p>${message}</p>
                <button id="closeModalBtn">OK</button>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector("#closeModalBtn");
        closeBtn.addEventListener("click", () => modal.remove());
        modal.addEventListener("click", e => {
            if (e.target === modal) modal.remove();
        });
    }

    // --- REDIRECTION SI CONNECTÉ ---
    if (payload) {
        const role = payload.role?.toLowerCase();
        const currentPage = window.location.pathname;

        if (currentPage.endsWith("login.html")) {
            if (role === "admin") {
                window.location.href = "/pages/admin/dashboard.html";
            } else if (role === "user") {
                window.location.href = "/pages/client/espace-client.html";
            } else {
                localStorage.removeItem("token");
            }
        }
    }

    // --- LOGIN ---
    const form = document.getElementById("loginForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email")?.value.trim();
            const password = document.getElementById("password")?.value.trim();

            if (!email || !password) {
                showModal("Veuillez remplir tous les champs", "error");
                return;
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (response.ok && result.token) {
                    localStorage.setItem("token", result.token);
                    payload = getTokenPayload();
                    const role = payload?.role?.toLowerCase();

                    if (role === "admin") {
                        window.location.href = "/pages/admin/dashboard.html";
                    } else if (role === "user") {
                        window.location.href = result.redirect || "/pages/client/espace-client.html";
                    } else {
                        localStorage.removeItem("token");
                        showModal("Rôle inconnu ❌", "error");
                    }
                } else {
                    showModal("Erreur : " + (result.message || "Identifiants incorrects"), "error");
                }
            } catch (err) {
                showModal("Impossible de contacter le serveur ❌", "error");
            }
        });
    }

    // --- NAVBAR & SIDEBAR DYNAMIQUE ---
    const authContainer = document.getElementById("authBtnContainer");
    const authContainerSidebar = document.getElementById("authBtnContainerSidebar");

    if (authContainer || authContainerSidebar) {
        const role = payload?.role?.toLowerCase();

        let navbarHtml = "";
        let sidebarHtml = "";

        if (role === "admin") {
            navbarHtml = `
                <a href="/pages/admin/dashboard.html" class="navlinks"><span>Dashboard</span></a>
                <a href="/pages/admin/users-dashboard.html" class="navlinks"><span>Utilisateurs</span></a>
                <a href="/pages/admin/posts-dashboard.html" class="navlinks"><span>Séances</span></a>
                <a href="#" id="logoutBtn" class="button-3d height-32"><span>Déconnexion</span><i class='bx bx-log-out'></i></a>
            `;

            sidebarHtml = `
                <div class="flex-sidebar">
                    <a href="/pages/admin/dashboard.html" class="sidebar-link"><i class='bx bx-home'></i>Dashboard</a>
                    <a href="/pages/admin/users-dashboard.html" class="sidebar-link"><i class='bx bx-user'></i>Utilisateurs</a>
                    <a href="/pages/admin/posts-dashboard.html" class="sidebar-link"><i class='bx bx-news'></i>Séances</a>
                </div>
                <a href="#" id="logoutBtnSidebar" class="sidebar-link logout"><i class='bx bx-log-out'></i>Déconnexion</a>
            `;
        } else if (role === "user") {
            navbarHtml = `
                <a href="/pages/client/espace-client.html" class="navlinks"><span>Espace Client</span></a>
                <a href="/pages/client/profile.html" class="navlinks"><span>Mon Profil</span></a>
                <a href="#" id="logoutBtn" class="button-3d height-32"><span>Déconnexion</span><i class='bx bx-log-out'></i></a>
            `;

            sidebarHtml = `
                <div class="flex-sidebar">
                    <a href="/pages/client/espace-client.html" class="sidebar-link"><i class='bx bx-user-circle'></i>Espace Client</a>
                    <a href="/pages/client/profile.html" class="sidebar-link"><i class='bx bx-id-card'></i>Mon Profil</a>
                </div>
                <a href="#" id="logoutBtnSidebar" class="sidebar-link logout"><i class='bx bx-log-out'></i>Déconnexion</a>
            `;
        } else {
            navbarHtml = `
                <a href="/pages/login.html" class="gradient-button height-32"><span>Connexion</span><i class='bx bx-log-in'></i></a>
            `;
            sidebarHtml = `
                <a href="/pages/login.html" class="sidebar-link"><i class='bx bx-log-in'></i> Connexion</a>
            `;
        }

        if (authContainer) authContainer.innerHTML = navbarHtml;
        if (authContainerSidebar) authContainerSidebar.innerHTML = sidebarHtml;

        // Logout (navbar + sidebar)
        const logoutBtn = document.getElementById("logoutBtn");
        const logoutBtnSidebar = document.getElementById("logoutBtnSidebar");

        [logoutBtn, logoutBtnSidebar].forEach(btn => {
            if (btn) {
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    localStorage.removeItem("token");
                    window.location.href = "/pages/login.html";
                });
            }
        });
    }

    // --- SIDEBAR TOGGLE ---
    const burgerBtn = document.getElementById("burgerBtn");
    const sidebar = document.getElementById("sidebar");

    if (burgerBtn && sidebar) {
        burgerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (sidebar.classList.contains("active") &&
                !sidebar.contains(e.target) &&
                e.target !== burgerBtn) {
                sidebar.classList.remove("active");
            }
        });

        function handleResize() {
            if (window.innerWidth >= 768) sidebar.classList.remove("active");
        }

        window.addEventListener("resize", handleResize);
        window.addEventListener("DOMContentLoaded", handleResize);
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