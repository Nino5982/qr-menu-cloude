// ენის მდგომარეობა და თარგმანები — საერთოა ფუტერის ენის გადამრთველისთვის და გვერდებისთვის.
import { translations } from "./translations.js";
import { storageGet, storageSet } from "./storage.js";

const LANG_KEY = "appLang";
const SUPPORTED = ["ka", "en", "ru"];

function readSavedLanguage() {
  const saved = storageGet(LANG_KEY);
  return SUPPORTED.includes(saved) ? saved : "ka";
}

let currentLanguage = readSavedLanguage();
document.documentElement.lang = currentLanguage;

export function getLanguage() {
  return currentLanguage;
}

// UI ტექსტი translations.js-იდან; თუ აკლია — ქართული
export function t(key, lang = currentLanguage) {
  return translations[lang]?.[key] ?? translations.ka[key] ?? key;
}

// ცხრილიდან მოსული ტექსტი: { ka, en, ru } → არჩეული ენა, თუ ცარიელია — ქართული
export function pick(values, lang = currentLanguage) {
  return values?.[lang] || values?.ka || "";
}

// ყველა [data-lang] ელემენტის ტექსტი გადათარგმნე.
// (დინამიკურად შექმნილ ელემენტებზე data-lang არ გამოიყენოთ — მათ menu.js თავად თარგმნის.)
export function applyTranslations(lang = currentLanguage, root = document) {
  root.querySelectorAll("[data-lang]").forEach((element) => {
    const text = translations[lang]?.[element.getAttribute("data-lang")];
    if (text) element.textContent = text;
  });
}

export function setLanguage(lang) {
  if (!SUPPORTED.includes(lang)) return;
  currentLanguage = lang;
  storageSet(LANG_KEY, lang);
  document.documentElement.lang = lang;
  applyTranslations(lang);
  document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang } }));
}
