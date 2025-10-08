
// ---------------- CALENDRIER ----------------
const daysContainer = document.getElementById("days");
const monthYear = document.getElementById("monthYear");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

let date = new Date(); // commence sur le mois actuel

function renderCalendar() {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Affiche le mois et l’année en texte
  monthYear.textContent = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // Nettoyer le conteneur avant de recréer les jours
  daysContainer.textContent = "";

  // Décalage pour aligner les jours (Lundi en premier)
  const startIndex = (firstDay + 6) % 7;
  for (let i = 0; i < startIndex; i++) {
    const emptyDiv = document.createElement("div");
    daysContainer.appendChild(emptyDiv);
  }

  // Jours du mois
  const today = new Date(); // date du jour
  for (let i = 1; i <= lastDate; i++) {
    const day = document.createElement("div");
    day.classList.add("day");
    day.textContent = i;

    // Applique la classe "active" si c’est le jour actuel
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      i === today.getDate()
    ) {
      day.classList.add("active");
    }

    daysContainer.appendChild(day);
  }
}

prevBtn.addEventListener("click", () => {
  date.setMonth(date.getMonth() - 1);
  renderCalendar();
});

nextBtn.addEventListener("click", () => {
  date.setMonth(date.getMonth() + 1);
  renderCalendar();
});

renderCalendar();