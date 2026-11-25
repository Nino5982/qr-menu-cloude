// მენიუს გვერდი: მდგომარეობა, რენდერი და მოვლენები.
// მონაცემების ჩატვირთვა/ნორმალიზება data.js-შია.
import { loadMenuData } from "./data.js";
import { getLanguage, t, pick, applyTranslations } from "./i18n.js";

const LOCALES = { ka: "ka-GE", en: "en-GB", ru: "ru-RU" };
const CURRENCY = " ₾";

const els = {
  brandName: document.getElementById("brandName"),
  brandLogo: document.getElementById("brandLogo"),
  brandSub: document.getElementById("brandSub"),
  status: document.getElementById("menuStatus"),
  notice: document.getElementById("menuNotice"),
  content: document.getElementById("menuContent"),
};

// phase: "loading" | "error" | "ready"
const state = { phase: "loading", data: null, source: null, fetchedAt: null };

/* ---------- ჩატვირთვა ---------- */

async function load() {
  state.phase = "loading";
  render();
  try {
    const result = await loadMenuData();
    state.data = result.data;
    state.source = result.source;
    state.fetchedAt = result.fetchedAt;
    state.phase = "ready";
  } catch {
    state.phase = "error";
  }
  render();
}

/* ---------- რენდერი ---------- */

function render() {
  const lang = getLanguage();
  renderHeader(lang);
  renderStatus(lang);
  renderNotice(lang);
  renderDishes(lang);
}

function renderHeader(lang) {
  const restaurant = state.data?.restaurant;
  const name = restaurant ? pick(restaurant.name, lang) : "";

  els.brandName.textContent = name || t("menu_title", lang);
  els.brandSub.hidden = !name; // "მენიუ" ქვესათაური მხოლოდ მაშინ, როცა სახელი გვაქვს
  document.title = name ? `${t("menu_title", lang)} | ${name}` : t("menu_title", lang);

  const logoUrl = restaurant?.logoUrl ?? "";
  if (!logoUrl) {
    els.brandLogo.hidden = true;
    els.brandLogo.removeAttribute("src");
  } else if (els.brandLogo.getAttribute("src") !== logoUrl) {
    els.brandLogo.hidden = false;
    els.brandLogo.src = logoUrl;
  }
}

function renderStatus(lang) {
  els.status.replaceChildren();

  if (state.phase === "loading") {
    const box = element("div", "status");
    box.append(element("span", "spinner"), element("p", "", t("loading", lang)));
    els.status.append(box);
  }

  if (state.phase === "error") {
    const box = element("div", "status status--error");
    const retry = element("button", "btn btn--accent retry-btn", t("retry", lang));
    retry.type = "button";
    retry.addEventListener("click", load);
    box.append(
      element("h2", "status__title", t("error_title", lang)),
      element("p", "", t("error_text", lang)),
      retry,
    );
    els.status.append(box);
  }
}

function renderNotice(lang) {
  els.notice.replaceChildren();
  if (state.phase === "ready" && state.source === "cache") {
    const time = formatDateTime(state.fetchedAt, lang);
    els.notice.append(element("p", "notice", t("cached_notice", lang).replace("{time}", time)));
  }
}

function renderDishes(lang) {
  els.content.replaceChildren();
  if (state.phase !== "ready") return;

  const { categories, dishes } = state.data;
  if (dishes.length === 0) {
    els.content.append(element("p", "status", t("no_dishes", lang)));
    return;
  }

  for (const group of groupByCategory(categories, dishes)) {
    const section = element("section", "menu-category");
    if (group.category) {
      section.append(element("h2", "menu-category__title", pick(group.category.name, lang)));
    }
    const list = element("ul", "dish-list");
    group.dishes.forEach((dish) => list.append(createDish(dish, lang)));
    section.append(list);
    els.content.append(section);
  }
}

// კატეგორიების თანმიმდევრობით; უკატეგორიო კერძები (არასწორი category_id) ბოლოს
function groupByCategory(categories, dishes) {
  const groups = categories
    .map((category) => ({
      category,
      dishes: dishes.filter((dish) => dish.categoryId === category.id),
    }))
    .filter((group) => group.dishes.length > 0);

  const known = new Set(categories.map((category) => category.id));
  const orphans = dishes.filter((dish) => !known.has(dish.categoryId));
  if (orphans.length > 0) groups.push({ category: null, dishes: orphans });
  return groups;
}

function createDish(dish, lang) {
  const item = element("li", "dish");

  const media = element("div", "dish__media");
  if (dish.imageUrl) {
    const img = new Image();
    img.className = "dish__img";
    img.alt = ""; // სახელი გვერდითაა, ამიტომ სურათი დეკორატიულია
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      img.remove();
      media.classList.add("dish__media--empty");
    });
    img.src = dish.imageUrl;
    media.append(img);
  } else {
    media.classList.add("dish__media--empty");
  }

  const body = element("div", "dish__body");
  body.append(element("h3", "dish__name", pick(dish.name, lang)));
  if (!dish.available) body.append(element("span", "badge", t("unavailable", lang)));

  item.append(media, body);
  if (dish.price !== null) item.append(element("p", "dish__price", formatPrice(dish.price)));
  return item;
}

/* ---------- ფორმატირება და დამხმარე ---------- */

function formatPrice(value) {
  return (Number.isInteger(value) ? String(value) : value.toFixed(2)) + CURRENCY;
}

function formatDateTime(timestamp, lang) {
  try {
    return new Intl.DateTimeFormat(LOCALES[lang], {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/* ---------- დაწყება ---------- */

els.brandLogo.addEventListener("error", () => {
  els.brandLogo.hidden = true;
});

// ენის შეცვლისას თავიდან ვხატავთ უკვე ჩატვირთული მონაცემებით (ქსელში აღარ ვდივართ)
document.addEventListener("languagechange", render);

applyTranslations(getLanguage());
load();
