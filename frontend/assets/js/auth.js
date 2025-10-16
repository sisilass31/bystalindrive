import { login } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
    // --- FONCTION : décoder le token ---
    function getTokenPayload() {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch {
            clearToken();
            return null;
        }
    }

    // --- SUPPRIMER TOKEN ---
    function clearToken() {
        localStorage.removeItem("token");
        payload = null;
    }

    let payload = getTokenPayload();

    // --- MODAL ---
    function showModal(message, type = "info") {
        // Overlay
        const modal = document.createElement("div");
        modal.className = "modal-overlay";

        // Contenu du modal
        const content = document.createElement("div");
        content.className = `modal-content ${type}`;

        // Message
        const msg = document.createElement("p");
        msg.textContent = message;

        // Bouton
        const btn = document.createElement("button");
        btn.id = "closeModalBtn";
        btn.className = "button-3d";
        btn.setAttribute("aria-label", "Fermer le modal");
        btn.textContent = "OK";

        // Assemblage
        content.appendChild(msg);
        content.appendChild(btn);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // 🔒 Bloquer le scroll de l'arrière-plan
        document.body.style.overflow = "hidden";

        modal.style.display = "flex";

        // Fonction fermeture
        const closeModal = () => {
            modal.remove();
            // 🔓 Réactiver le scroll
            document.body.style.overflow = "auto";
        };

        btn.addEventListener("click", closeModal);
        modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    }

    // --- REDIRECTION SI CONNECTÉ ---
    if (payload) {
        const role = payload.role?.toLowerCase();
        const currentPage = window.location.pathname;
        if (currentPage.endsWith("login.html")) {
            if (role === "admin") window.location.href = "/pages/admin/dashboard.html";
            else if (role === "client") window.location.href = "/pages/client/espace-client.html";
            else clearToken();
        }
    }

    // --- LOGIN ---
    const form = document.getElementById("loginForm");
    form?.addEventListener("submit", async e => {
        e.preventDefault();
        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value.trim();

        if (!email || !password) return showModal("Veuillez remplir tous les champs", "error");

        clearToken();

        try {
            const result = await login(email, password);
            localStorage.setItem("token", result.token);
            payload = getTokenPayload();

            const role = payload?.role?.toLowerCase();
            const redirect = role === "admin"
                ? "/pages/admin/dashboard.html"
                : "/pages/client/espace-client.html";
            window.location.href = redirect;
        } catch (err) {
            showModal(err.message || "Identifiants incorrects", "error");
        }
    });

    // --- NAVBAR & SIDEBAR ---
    const authContainer = document.getElementById("authBtnContainer");
    const authContainerSidebar = document.getElementById("authBtnContainerSidebar");

    function renderNav(role) {
        // Vider les containers avant de remplir
        if (authContainer) authContainer.textContent = "";
        if (authContainerSidebar) authContainerSidebar.textContent = "";

        const createLink = (href, text, className, iconClass = "") => {
            const a = document.createElement("a");
            a.href = href;
            a.className = className;
            if (iconClass) {
                const i = document.createElement("i");
                i.className = iconClass;
                a.appendChild(i);
            }
            const span = document.createElement("span");
            span.textContent = text;
            a.appendChild(span);
            return a;
        };

        const createSidebarLink = (href, text, iconClass, extraClass = "") => {
            const a = document.createElement("a");
            a.href = href;
            a.className = `sidebar-link ${extraClass}`.trim();
            if (iconClass) {
                const i = document.createElement("i");
                i.className = iconClass;
                a.appendChild(i);
            }
            a.appendChild(document.createTextNode(text));
            return a;
        };

        if (role === "admin") {
            authContainer.appendChild(createLink("/pages/admin/dashboard.html", "Dashboard", "navlinks"));
            authContainer.appendChild(createLink("/pages/admin/users-dashboard.html", "Utilisateurs", "navlinks"));
            authContainer.appendChild(createLink("/pages/admin/posts-dashboard.html", "Séances", "navlinks"));
            const logoutBtn = createLink("#", "Déconnexion", "button-3d height-32", "bx bx-log-out");
            logoutBtn.id = "logoutBtn";
            authContainer.appendChild(logoutBtn);

            const sidebarDiv = document.createElement("div");
            sidebarDiv.className = "flex-sidebar";
            sidebarDiv.appendChild(createSidebarLink("/pages/admin/dashboard.html", "Dashboard", "bx bx-home"));
            sidebarDiv.appendChild(createSidebarLink("/pages/admin/users-dashboard.html", "Utilisateurs", "bx bx-user"));
            sidebarDiv.appendChild(createSidebarLink("/pages/admin/posts-dashboard.html", "Séances", "bx bx-news"));
            authContainerSidebar.appendChild(sidebarDiv);

            const logoutSidebar = createSidebarLink("#", "Déconnexion", "bx bx-log-out", "logout");
            logoutSidebar.id = "logoutBtnSidebar";
            authContainerSidebar.appendChild(logoutSidebar);

        } else if (role === "client") {
            authContainer.appendChild(createLink("/pages/client/espace-client.html", "Espace Client", "navlinks"));
            authContainer.appendChild(createLink("/pages/client/profile.html", "Mon Profil", "navlinks"));
            const logoutBtn = createLink("#", "Déconnexion", "button-3d height-32", "bx bx-log-out");
            logoutBtn.id = "logoutBtn";
            authContainer.appendChild(logoutBtn);

            const sidebarDiv = document.createElement("div");
            sidebarDiv.className = "flex-sidebar";
            sidebarDiv.appendChild(createSidebarLink("/pages/client/espace-client.html", "Espace Client", "bx bx-user-circle"));
            sidebarDiv.appendChild(createSidebarLink("/pages/client/profile.html", "Mon Profil", "bx bx-id-card"));
            authContainerSidebar.appendChild(sidebarDiv);

            const logoutSidebar = createSidebarLink("#", "Déconnexion", "bx bx-log-out", "logout");
            logoutSidebar.id = "logoutBtnSidebar";
            authContainerSidebar.appendChild(logoutSidebar);

        } else {
            authContainer.appendChild(createLink("/pages/login.html", "Connexion", "gradient-button height-32", "bx bx-log-in"));
            authContainerSidebar.appendChild(createSidebarLink("/pages/login.html", "Connexion", "bx bx-log-in"));
        }
    }


    renderNav(payload?.role?.toLowerCase());

    // --- LOGOUT ---
    document.addEventListener("click", e => {
        if (e.target.closest("#logoutBtn") || e.target.closest("#logoutBtnSidebar")) {
            e.preventDefault();
            clearToken();
            renderNav(null);
            window.location.href = "/pages/login.html";
        }
    });

    // --- SIDEBAR TOGGLE ---
    const burgerBtn = document.getElementById("burgerBtn");
    const sidebar = document.getElementById("sidebar");

    if (burgerBtn && sidebar) {
        burgerBtn.addEventListener("click", e => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
        });

        document.addEventListener("click", e => {
            if (sidebar.classList.contains("active") &&
                !sidebar.contains(e.target) &&
                e.target !== burgerBtn) sidebar.classList.remove("active");
        });

        function handleResize() { if (window.innerWidth >= 768) sidebar.classList.remove("active"); }
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