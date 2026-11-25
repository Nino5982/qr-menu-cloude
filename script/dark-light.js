import { storageSet } from "./storage.js";

const THEME_KEY = "qr-menu-theme";
const themebtns = document.querySelectorAll(".theme-btn");

// საწყის თემას theme-init.js ადგენს (შენახული არჩევანი ან მოწყობილობის თემა),
// აქ მხოლოდ ღილაკებს ვასინქრონებთ.
applyTheme(document.body.dataset.theme === "dark" ? "dark" : "light");

themebtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    applyTheme(btn.dataset.themeValue);
    storageSet(THEME_KEY, btn.dataset.themeValue);
  });
});

function applyTheme(theme) {
  document.body.dataset.theme = theme;

  themebtns.forEach((themeBtn) => {
    if (themeBtn.dataset.themeValue === theme) {
      themeBtn.classList.add("active-theme");
      themeBtn.setAttribute("aria-pressed", "true");
    } else {
      themeBtn.classList.remove("active-theme");
      themeBtn.setAttribute("aria-pressed", "false");
    }
  });
}
