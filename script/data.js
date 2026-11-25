// მონაცემების ჩატვირთვა და ნორმალიზება. აქ არ არის DOM-ი, ფილტრაცია ან რენდერი.
import { SHEET_URLS, REQUEST_TIMEOUT_MS, CACHE_PREFIX } from "./config.js";
import { parseCsv, rowsToObjects } from "./csv.js";
import { storageGet, storageSet } from "./storage.js";

const LANGS = ["ka", "en", "ru"];
const SORT_LAST = 1e9; // არასწორი/ცარიელი sort_order ბოლოში ჩავარდეს
const SITE_ROOT = new URL("../", import.meta.url); // პროექტის ფესვი (GitHub Pages-ის ქვეგზაზეც სწორია)

// სავალდებულო სვეტები. დანარჩენი სვეტები არასავალდებულოა.
const REQUIRED_COLUMNS = {
  restaurant: ["key", "value_ka"],
  categories: ["id", "category_ka"],
  dishes: ["id", "category_id", "name_ka", "price"],
};

/* ---------- პატარა დამხმარე ფუნქციები ---------- */

// "TRUE"/"FALSE" (და 1/0, yes/no). ცარიელი ან უცნობი მნიშვნელობა → defaultValue
export function parseBoolean(value, defaultValue) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return defaultValue;
}

// "12.5", "12,50", "12.50 ₾" → რიცხვი. არასწორი მნიშვნელობა → null
export function parsePrice(value) {
  let s = String(value ?? "").replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else s = s.replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseSortOrder(value) {
  const n = Number(String(value ?? "").trim());
  return String(value ?? "").trim() !== "" && Number.isFinite(n) ? n : SORT_LAST;
}

// მხოლოდ http(s) ბმულები (ან ფარდობითი გზა პროექტის ფესვიდან). სხვა → ""
export function safeUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, SITE_ROOT);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

// სამენოვანი ველების შეგროვება: { ka, en, ru }
function translated(record, prefix) {
  const result = {};
  for (const lang of LANGS) result[lang] = record[`${prefix}_${lang}`] ?? "";
  return result;
}

const hasText = (obj) => LANGS.some((lang) => obj[lang] !== "");

function sortItems(items) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.sortOrder - b.item.sortOrder || a.index - b.index)
    .map(({ item }) => item);
}

/* ---------- ნორმალიზება ---------- */

export function normalizeRestaurant(records) {
  const byKey = {};
  for (const record of records) {
    if (!record.key) continue;
    byKey[record.key.trim().toLowerCase()] = translated(record, "value");
  }
  const field = (key) => byKey[key] ?? { ka: "", en: "", ru: "" };

  return {
    name: field("restaurant_name"),
    intro: field("intro"),
    address: field("address"),
    openingHours: field("opening_hours"),
    // ენისგან დამოუკიდებელი მნიშვნელობები ყოველთვის value_ka-დან იკითხება
    phone: field("phone").ka,
    mapUrl: safeUrl(field("map_url").ka),
    logoUrl: safeUrl(field("logo_url").ka),
    coverImageUrl: safeUrl(field("cover_image_url").ka),
  };
}

export function normalizeCategories(records) {
  const seen = new Set();
  const items = [];
  for (const record of records) {
    const name = translated(record, "category");
    if (!record.id || !hasText(name) || seen.has(record.id)) continue;
    seen.add(record.id);
    items.push({ id: record.id, name, sortOrder: parseSortOrder(record.sort_order) });
  }
  return sortItems(items);
}

export function normalizeDishes(records) {
  const seen = new Set();
  const items = [];
  for (const record of records) {
    const name = translated(record, "name");
    if (!record.id || !hasText(name) || seen.has(record.id)) continue;
    seen.add(record.id);
    items.push({
      id: record.id,
      categoryId: record.category_id,
      name,
      description: translated(record, "desc"),
      price: parsePrice(record.price),
      available: parseBoolean(record.available, true), // ცარიელი = ხელმისაწვდომია
      imageUrl: safeUrl(record.image_url),
      sortOrder: parseSortOrder(record.sort_order),
    });
  }
  return sortItems(items);
}

/* ---------- ვალიდაცია (ქეშის დასაცავად) ---------- */

const isLangObject = (v) =>
  v && typeof v === "object" && LANGS.every((lang) => typeof v[lang] === "string");

export function isValidData(data) {
  return Boolean(
    data &&
      isLangObject(data.restaurant?.name) &&
      Array.isArray(data.categories) &&
      data.categories.every(
        (c) => typeof c.id === "string" && isLangObject(c.name) && typeof c.sortOrder === "number",
      ) &&
      Array.isArray(data.dishes) &&
      data.dishes.every(
        (d) =>
          typeof d.id === "string" &&
          typeof d.categoryId === "string" &&
          isLangObject(d.name) &&
          isLangObject(d.description) &&
          (d.price === null || typeof d.price === "number") &&
          typeof d.available === "boolean" &&
          typeof d.imageUrl === "string" &&
          typeof d.sortOrder === "number",
      ),
  );
}

/* ---------- ქსელი ---------- */

async function fetchTable(name) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(SHEET_URLS[name], {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);

    const table = rowsToObjects(parseCsv(await response.text()));
    for (const column of REQUIRED_COLUMNS[name]) {
      if (!table.columns.includes(column)) {
        throw new Error(`${name}: აკლია სვეტი "${column}"`);
      }
    }
    return table.records;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- ქეში: ბოლო წარმატებული მონაცემები ამავე workbook-იდან ---------- */

function cacheKey() {
  const match = SHEET_URLS.restaurant.match(/\/d\/e\/([^/]+)\//);
  return CACHE_PREFIX + (match ? match[1] : SHEET_URLS.restaurant);
}

function saveCache(data) {
  storageSet(cacheKey(), JSON.stringify({ version: 1, savedAt: Date.now(), data }));
}

function readCache() {
  const raw = storageGet(cacheKey());
  if (!raw) return null;
  try {
    const cached = JSON.parse(raw);
    if (cached.version === 1 && typeof cached.savedAt === "number" && isValidData(cached.data)) {
      return cached;
    }
  } catch {
    // დაზიანებული ქეში უბრალოდ იგნორირდება
  }
  return null;
}

/* ---------- მთავარი ფუნქცია ---------- */

// აბრუნებს { data, source: "network" | "cache", fetchedAt }. თუ ორივე ვერ მოხერხდა, აგდებს შეცდომას.
export async function loadMenuData() {
  try {
    const [restaurant, categories, dishes] = await Promise.all([
      fetchTable("restaurant"),
      fetchTable("categories"),
      fetchTable("dishes"),
    ]);
    const data = {
      restaurant: normalizeRestaurant(restaurant),
      categories: normalizeCategories(categories),
      dishes: normalizeDishes(dishes),
    };
    if (!isValidData(data)) throw new Error("მონაცემების ფორმატი არასწორია");

    saveCache(data);
    return { data, source: "network", fetchedAt: Date.now() };
  } catch (error) {
    console.error("მენიუს ჩატვირთვა ვერ მოხერხდა:", error);
    const cached = readCache();
    if (cached) return { data: cached.data, source: "cache", fetchedAt: cached.savedAt };
    throw error;
  }
}
