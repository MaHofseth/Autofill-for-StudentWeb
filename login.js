// Runs on https://fsweb.no/studentweb/login.jsf and https://studentweb.uio.no/studentweb/login.jsf
// Firefox provides `browser`, Chrome provides `chrome`.
const api = globalThis.browser ?? globalThis.chrome;

(async () => {
  const { inst, loginMethod } = await api.storage.local.get(["inst", "loginMethod"]);

  // fsweb.no sends UiO to its own StudentWeb at studentweb.uio.no, where the
  // institution is called FSPROD instead of FSUIO.
  const onUio = location.hostname === "studentweb.uio.no";
  const toCode = (code) => (onUio && code === "FSPROD" ? "FSUIO" : code);

  // StudentWeb remembers the last institution in a cookie and skips the
  // choice page, so switch here if it's not the saved one. Loading
  // login.jsf?inst=X on fsweb.no also updates that cookie (and forwards
  // FSUIO to studentweb.uio.no).
  const logo = document.querySelector("img.logo");
  const pageInst = logo && toCode(new URL(logo.src).searchParams.get("inst"));
  const requested = toCode(new URLSearchParams(location.search).get("inst"));
  if (inst && pageInst && pageInst !== inst && requested !== inst) {
    location.replace("https://fsweb.no/studentweb/login.jsf?inst=" + encodeURIComponent(inst));
    return;
  }

  // Record which methods this institution actually shows, so the popup only
  // offers those. Hidden ones (e.g. the fødselsnummer form at some
  // institutions) don't count.
  const visible = (el) => !!el && el.getClientRects().length > 0 &&
    getComputedStyle(el).visibility !== "hidden";
  const visibleLink = (needle) => [...document.querySelectorAll("a")].find((a) =>
    a.textContent.toLowerCase().includes(needle) && visible(a)
  );
  const available = [];
  if (visibleLink("feide")) available.push("feide");
  if (visibleLink("id-porten")) available.push("idporten");
  if (visible(document.querySelector('input[id$=":fodselsnummer"]'))) available.push("fnr");
  if (pageInst && available.length) {
    const { methodsByInst = {} } = await api.storage.local.get("methodsByInst");
    methodsByInst[pageInst] = available;
    await api.storage.local.set({ methodsByInst });
  }

  if (!loginMethod || !available.includes(loginMethod)) return;

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
  const link = visibleLink({ feide: "feide", idporten: "id-porten" }[loginMethod]);
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
