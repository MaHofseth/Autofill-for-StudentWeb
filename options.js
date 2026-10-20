// Firefox provides `browser`, Chrome provides `chrome`.
const api = globalThis.browser ?? globalThis.chrome;

const instSel = document.getElementById("inst");
const auto = document.getElementById("auto");
const feideAuto = document.getElementById("feideAuto");
const method = document.getElementById("method");
const methodNote = document.getElementById("methodNote");
const status = document.getElementById("status");

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

  method.replaceChildren(new Option("Ask me (do nothing)", ""));
  for (const [key, label] of Object.entries(ALL_METHODS)) {
    if (available.includes(key)) method.add(new Option(label, key));
  }

  methodNote.hidden = true;
  if (loginMethod && !available.includes(loginMethod)) {
    await api.storage.local.remove("loginMethod");
    const instName = instSel.selectedOptions[0]?.text || instSel.value;
    methodNote.textContent = `${ALL_METHODS[loginMethod] || loginMethod} isn't offered at ${instName}, so the login method was reset.`;
    methodNote.hidden = false;
    method.value = "";
  } else {
    method.value = loginMethod || "";
  }
}

async function render() {
  const { inst, autoContinue, feideAutoContinue, institutions = DEFAULT_INSTITUTIONS } =
    await api.storage.local.get(["inst", "autoContinue", "feideAutoContinue", "institutions"]);

  instSel.replaceChildren(new Option("(none)", ""));
  for (const i of institutions) instSel.add(new Option(i.name, i.code));
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
  flash("Saved");
});

auto.addEventListener("change", async () => {
  await api.storage.local.set({ autoContinue: auto.checked });
  flash("Saved");
});

feideAuto.addEventListener("change", async () => {
  await api.storage.local.set({ feideAutoContinue: feideAuto.checked });
  flash("Saved");
});

method.addEventListener("change", async () => {
  if (method.value) await api.storage.local.set({ loginMethod: method.value });
  else await api.storage.local.remove("loginMethod");
  methodNote.hidden = true;
  flash("Saved");
});

document.getElementById("clear").addEventListener("click", async () => {
  await api.storage.local.remove("inst");
  await render();
  flash("Cleared");
});

document.getElementById("clearMethod").addEventListener("click", async () => {
  await api.storage.local.remove("loginMethod");
  await renderMethods();
  flash("Cleared");
});

render();
