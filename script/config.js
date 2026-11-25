// Google Sheets-ის გამოქვეყნებული CSV ბმულები — ერთადერთი ადგილი, სადაც ისინი ინახება.
export const SHEET_URLS = {
  restaurant:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn4Rlfe4ywiSN5NJSHzflXUEGFL_Cb_3xNozoEHoNHqmXakejhnpLyV13eUrc8PymY6REbipEjb46u/pub?gid=0&single=true&output=csv",
  categories:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn4Rlfe4ywiSN5NJSHzflXUEGFL_Cb_3xNozoEHoNHqmXakejhnpLyV13eUrc8PymY6REbipEjb46u/pub?gid=649364301&single=true&output=csv",
  dishes:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRn4Rlfe4ywiSN5NJSHzflXUEGFL_Cb_3xNozoEHoNHqmXakejhnpLyV13eUrc8PymY6REbipEjb46u/pub?gid=922732437&single=true&output=csv",
};

// რამდენ ხანს ველოდოთ Google-ის პასუხს (მილიწამებში)
export const REQUEST_TIMEOUT_MS = 15000;

// localStorage-ის გასაღების პრეფიქსი ბოლო წარმატებული მონაცემებისთვის
export const CACHE_PREFIX = "qr-menu-data:";
