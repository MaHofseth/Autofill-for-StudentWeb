const instSel = document.getElementById("inst");
const auto = document.getElementById("auto");
const method = document.getElementById("method");
const status = document.getElementById("status");

const flash = (msg) => {
  status.textContent = msg;
  setTimeout(() => (status.textContent = ""), 1500);
};

async function render() {
  const { inst, autoContinue, loginMethod, institutions = DEFAULT_INSTITUTIONS } =
    await browser.storage.local.get(["inst", "autoContinue", "loginMethod", "institutions"]);

  instSel.replaceChildren(new Option("(none)", ""));
  for (const i of institutions) instSel.add(new Option(i.name, i.code));
  if (inst && !institutions.some((i) => i.code === inst)) instSel.add(new Option(inst, inst));
  instSel.value = inst || "";

  auto.checked = !!autoContinue;
  method.value = loginMethod || "";
}

instSel.addEventListener("change", async () => {
  if (instSel.value) await browser.storage.local.set({ inst: instSel.value });
  else await browser.storage.local.remove("inst");
  flash("Saved");
});

auto.addEventListener("change", async () => {
  await browser.storage.local.set({ autoContinue: auto.checked });
  flash("Saved");
});

method.addEventListener("change", async () => {
  if (method.value) await browser.storage.local.set({ loginMethod: method.value });
  else await browser.storage.local.remove("loginMethod");
  flash("Saved");
});

document.getElementById("clear").addEventListener("click", async () => {
  await browser.storage.local.remove("inst");
  await render();
  flash("Cleared");
});

render();
