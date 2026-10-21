// Firefox provides `browser`, Chrome provides `chrome`.
const api = globalThis.browser ?? globalThis.chrome;

const instSel = document.getElementById("inst");
const auto = document.getElementById("auto");
const feideAuto = document.getElementById("feideAuto");
const method = document.getElementById("method");
const methodNote = document.getElementById("methodNote");
const status = document.getElementById("status");

// Texts come from _locales/<lang>/messages.json; the browser picks the
// language from its own settings (falls back to English).
const t = (key, subs) => api.i18n.getMessage(key, subs);
const norwegian = t("lang") === "nb";
const METHOD_LABELS = { feide: t("methodFeide"), fnr: t("methodFnr"), idporten: t("methodIdporten") };

document.documentElement.lang = t("lang");
for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
for (const el of document.querySelectorAll("[data-i18n-title]")) el.title = t(el.dataset.i18nTitle);

// Built-in names in the popup's language; the cached list from StudentWeb
// is in whatever language that page was shown in.
const instName = (i) =>
  (norwegian ? NB_NAMES[i.code] : DEFAULT_INSTITUTIONS.find((d) => d.code === i.code)?.name) || i.name;

const flash = (msg) => {
  status.textContent = msg;
  setTimeout(() => (status.textContent = ""), 1500);
};

// Methods offered by an institution: what login.js last saw on its login
// page, else the built-in table, else all of them.
async function methodsFor(code) {
  const { methodsByInst = {} } = await api.storage.local.get("methodsByInst");
  return methodsByInst[code] || DEFAULT_METHODS[code] || Object.keys(ALL_METHODS);
}

// Rebuild the method list for the chosen institution. If the saved method
// isn't offered there, reset it to "Ask me" and say why.
async function renderMethods() {
  const { loginMethod } = await api.storage.local.get("loginMethod");
  const available = await methodsFor(instSel.value);

  method.replaceChildren(new Option(t("methodAsk"), ""));
  for (const [key, label] of Object.entries(METHOD_LABELS)) {
    if (available.includes(key)) method.add(new Option(label, key));
  }

  methodNote.hidden = true;
  if (loginMethod && !available.includes(loginMethod)) {
    await api.storage.local.remove("loginMethod");
    const name = instSel.selectedOptions[0]?.text || instSel.value;
    methodNote.textContent = t("methodReset", [METHOD_LABELS[loginMethod] || loginMethod, name]);
    methodNote.hidden = false;
    method.value = "";
  } else {
    method.value = loginMethod || "";
  }
}

// The last average results.js saved for the chosen institution.
async function renderAverage() {
  const { averageByInst = {} } = await api.storage.local.get("averageByInst");
  // With no institution chosen, show the most recently calculated one and
  // name its institution.
  let code = instSel.value;
  if (!code) {
    code = Object.keys(averageByInst).sort(
      (a, b) => averageByInst[b].updated - averageByInst[a].updated
    )[0];
  }
  const saved = code && averageByInst[code];
  const prefix = !instSel.value && saved ? instName({ code, name: code }) + ": " : "";
  const value = document.getElementById("avgValue");
  const details = document.getElementById("avgDetails");
  const lang = t("lang");
  const num = (n, digits) =>
    n.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  value.classList.toggle("empty", !saved?.average);
  if (!saved) {
    value.textContent = t("avgNotYet");
    details.textContent = t("avgNotYetHint");
    return;
  }
  const updated = t("avgUpdated", [
    new Date(saved.updated).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" }),
  ]);
  if (saved.average === null) {
    value.textContent = t("avgNone");
    details.textContent = prefix + updated;
    return;
  }
  value.textContent = t("avgValue", [num(saved.average, 2), saved.letter]);
  const credits = num(saved.credits, saved.credits % 1 ? 1 : 0);
  details.textContent = prefix + t("avgCounted", [String(saved.courses), credits]) + " " + updated;
}

async function render() {
  const { inst, autoContinue, feideAutoContinue, institutions = DEFAULT_INSTITUTIONS } =
    await api.storage.local.get(["inst", "autoContinue", "feideAutoContinue", "institutions"]);

  instSel.replaceChildren(new Option(t("none"), ""));
  const sorted = institutions
    .map((i) => ({ code: i.code, name: instName(i) }))
    .sort((a, b) => a.name.localeCompare(b.name, t("lang")));
  for (const i of sorted) instSel.add(new Option(i.name, i.code));
  if (inst && !institutions.some((i) => i.code === inst)) instSel.add(new Option(inst, inst));
  instSel.value = inst || "";

  auto.checked = !!autoContinue;
  feideAuto.checked = !!feideAutoContinue;
  await renderMethods();
  await renderAverage();
}

instSel.addEventListener("change", async () => {
  if (instSel.value) await api.storage.local.set({ inst: instSel.value });
  else await api.storage.local.remove("inst");
  await renderMethods();
  await renderAverage();
  flash(t("saved"));
});

auto.addEventListener("change", async () => {
  await api.storage.local.set({ autoContinue: auto.checked });
  flash(t("saved"));
});

feideAuto.addEventListener("change", async () => {
  await api.storage.local.set({ feideAutoContinue: feideAuto.checked });
  flash(t("saved"));
});

method.addEventListener("change", async () => {
  if (method.value) await api.storage.local.set({ loginMethod: method.value });
  else await api.storage.local.remove("loginMethod");
  methodNote.hidden = true;
  flash(t("saved"));
});

document.getElementById("clear").addEventListener("click", async () => {
  await api.storage.local.remove("inst");
  await render();
  flash(t("cleared"));
});

document.getElementById("clearMethod").addEventListener("click", async () => {
  await api.storage.local.remove("loginMethod");
  await renderMethods();
  flash(t("cleared"));
});

const settingsToggle = document.getElementById("settingsToggle");
settingsToggle.addEventListener("click", () => {
  const settings = document.getElementById("settings");
  settings.hidden = !settings.hidden;
  settingsToggle.setAttribute("aria-expanded", String(!settings.hidden));
});

// Update while the popup is open, e.g. when the results page finishes.
api.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.averageByInst) renderAverage();
});

// Open the results page; results.js recalculates and saves the average there. If StudentWeb
// asks for a login first, the flag sends the user on to the results page
// afterwards.
document.getElementById("average").addEventListener("click", async () => {
  const { inst } = await api.storage.local.get("inst");
  const host = inst === "FSUIO" ? "studentweb.uio.no" : "fsweb.no";
  await api.storage.local.set({ pendingResults: Date.now() });
  await api.tabs.create({ url: `https://${host}/studentweb/resultater.jsf` });
  window.close();
});

render();
