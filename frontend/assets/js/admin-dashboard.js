// --- ADMIN ---
export async function initAdmin() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/pages/login.html";
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch (err) {
    console.error("Token invalide :", err);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
    return null;
  }

  if (payload.role !== "admin") {
    window.location.href = "/pages/error-404.html";
    return null;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/users/${payload.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Impossible de récupérer les infos admin");
    const admin = await res.json();
    console.log("✅ Admin connecté :", admin);
    return { token, admin };
  } catch (err) {
    console.error(err);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
    return null;
  }
}