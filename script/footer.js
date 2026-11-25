async function loadFooter() {
  const host = document.getElementById("site-footer");
  if (!host) return;

  const response = await fetch(
    new URL("../partials/footer.html", import.meta.url),
  );

  if (!response.ok) {
    throw new Error("ფუტერი ვერ ჩაიტვირთა");
  }

  const footerHtml = await response.text();
  const footerTemplate = document.createElement("template");
  footerTemplate.innerHTML = footerHtml;

  // footer.html-ში სურათების გზები პროექტის ფესვიდანაა (images/...),
  // ამიტომ ვაქცევთ აბსოლუტურად — index.html-იდანაც და pages/menu.html-იდანაც სწორია.
  const projectRoot = new URL("../", import.meta.url);
  footerTemplate.content.querySelectorAll("img[src]").forEach((image) => {
    image.src = new URL(image.getAttribute("src"), projectRoot).href;
  });

  host.replaceChildren(footerTemplate.content);

  // კონტროლების ინიციალიზაცია ფუტერის ჩასმის შემდეგ. მოდულები მხოლოდ ერთხელ სრულდება.
  await import("./lang-sweacher.js");
  await import("./dark-light.js");
}

loadFooter().catch((error) => {
  console.error(error);
});
