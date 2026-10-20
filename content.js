// Runs on https://fsweb.no/studentweb/velgInstitusjon.jsf
(async () => {
  const select = document.getElementById("institusjonsvalg:institusjonsMenu");
  if (!select) return;

  const enableButton = () => {
    document.querySelectorAll(".valgKnapp").forEach((b) => {
      b.disabled = false;
      b.setAttribute("aria-disabled", "false");
      b.classList.remove("ui-state-disabled");
    });
  };

  // Cache the institution list so the options page can show it.
  const institutions = [...select.options]
    .filter((o) => o.value)
    .map((o) => ({ code: o.value, name: o.text.trim() }));

  const { inst, autoContinue } = await browser.storage.local.get(["inst", "autoContinue"]);
  await browser.storage.local.set({ institutions });

  // Save whatever the user picks.
  select.addEventListener("change", () => {
    if (select.value) browser.storage.local.set({ inst: select.value });
  });

  if (!inst || !institutions.some((i) => i.code === inst)) return;

  if (autoContinue) {
    // Same thing the page's own "Choose" button does.
    location.href = "login.jsf?inst=" + encodeURIComponent(inst);
    return;
  }

  select.value = inst;
  enableButton();
  document.querySelector(".valgKnapp")?.focus();
})();
