import { getLanguage, setLanguage, applyTranslations } from "./i18n.js";

const langSwitcher = document.getElementById("langSwitcher");
const langList = langSwitcher.querySelector(".lang-list");
const langItems = langList.querySelectorAll("li");
const langToggleBtn = langSwitcher.querySelector(".lang-toggle-btn");
const overlay = document.getElementById("overlay");

// არჩეული ენის შესაბამის ელემენტს დაედოს active კლასი, დანარჩენს წაეშალოს.
function markActive(lang) {
  langItems.forEach((item) => {
    item.classList.toggle("active", item.getAttribute("data-lang") === lang);
  });
}

// გახსნა / დახურვა
function openLangList() {
  langList.classList.add("open");
  overlay.classList.add("overlay");
  langToggleBtn.setAttribute("aria-expanded", "true");
}

function closeLangList() {
  langList.classList.remove("open");
  overlay.classList.remove("overlay");
  langToggleBtn.setAttribute("aria-expanded", "false");
}

function pickLanguage(lang) {
  setLanguage(lang); // ინახავს ენას, ცვლის <html lang>-ს და თარგმნის [data-lang] ელემენტებს
  markActive(lang);
  closeLangList();
}

langToggleBtn.addEventListener("click", () => {
  if (langList.classList.contains("open")) closeLangList();
  else openLangList();
});

langList.addEventListener("click", (e) => {
  const item = e.target.closest("li[data-lang]");
  if (item) pickLanguage(item.getAttribute("data-lang"));
});

// კლავიატურით მართვა: Tab-ით მისვლა, Enter/Space — არჩევა, Escape — დახურვა
langItems.forEach((item) => item.setAttribute("tabindex", "0"));
langList.addEventListener("keydown", (e) => {
  const item = e.target.closest("li[data-lang]");
  if (item && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    pickLanguage(item.getAttribute("data-lang"));
    langToggleBtn.focus();
  }
});
langSwitcher.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLangList();
    langToggleBtn.focus();
  }
});

// თუ ქლიქი მოხდა გარეთ, მენიუ დაიხუროს!
document.addEventListener("click", (e) => {
  if (!langSwitcher.contains(e.target)) closeLangList();
});

// საწყისი მდგომარეობა (ფუტერი ახლახან ჩაისვა გვერდზე)
markActive(getLanguage());
applyTranslations(getLanguage());
