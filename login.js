// Runs on https://fsweb.no/studentweb/login.jsf
(async () => {
  const { inst, loginMethod } = await browser.storage.local.get(["inst", "loginMethod"]);

  // StudentWeb remembers the last institution in a cookie and skips the
  // choice page, so switch here if it's not the saved one. Loading
  // login.jsf?inst=X also updates that cookie.
  const logo = document.querySelector("img.logo");
  const pageInst = logo && new URL(logo.src).searchParams.get("inst");
  const requested = new URLSearchParams(location.search).get("inst");
  if (inst && pageInst && pageInst !== inst && requested !== inst) {
    location.replace("login.jsf?inst=" + encodeURIComponent(inst));
    return;
  }

  if (!loginMethod) return;

  if (loginMethod === "fnr") {
    const field = document.querySelector('input[id$=":fodselsnummer"]');
    if (field) {
      field.scrollIntoView({ block: "center" });
      field.focus();
    }
    return;
  }

  // Feide / ID-porten are links with generated ids, so find them by their text
  // ("Log in using Feide" / "Logg inn med Feide" etc.).
  const needle = { feide: "feide", idporten: "id-porten" }[loginMethod];
  if (!needle) return;
  const link = [...document.querySelectorAll("a")].find((a) =>
    a.textContent.toLowerCase().includes(needle)
  );
  if (!link) return;

  // Don't auto-click again if we were bounced back here shortly after
  // (failed login, cancelled at the provider, logout redirect).
  const KEY = "studentwebDefaultInst.lastAutoLogin";
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 30_000) {
    link.focus();
    return;
  }
  sessionStorage.setItem(KEY, String(Date.now()));
  link.click();
})();
