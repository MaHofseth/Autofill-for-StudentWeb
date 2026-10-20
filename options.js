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
}

instSel.addEventListener("change", async () => {
  if (instSel.value) await api.storage.local.set({ inst: instSel.value });
  else await api.storage.local.remove("inst");
  await renderMethods();
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

render();
