// კლასიკური (არა-მოდულური) სკრიპტი: სრულდება body-ს დასაწყისში, რომ გვერდმა არ "იციმციმოს".
// პირველ ვიზიტზე იყენებს მოწყობილობის თემას, შემდეგ — შენახულ არჩევანს.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem("qr-menu-theme");
  } catch (e) {
    // მეხსიერება მიუწვდომელია — გამოვიყენებთ მოწყობილობის თემას
  }
  if (theme !== "dark" && theme !== "light") {
    var prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme = prefersDark ? "dark" : "light";
  }
  document.body.dataset.theme = theme;
})();
