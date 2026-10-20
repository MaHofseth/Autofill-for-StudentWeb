// Runs on Feide's "choose affiliation" page:
// https://idp.feide.no/simplesaml/module.php/feide/selectorg
// (institutions.js is loaded first, for FEIDE_ORGS.)
// Firefox provides `browser`, Chrome provides `chrome`.
const api = globalThis.browser ?? globalThis.chrome;

(async () => {
  const { inst, feideAutoContinue } = await api.storage.local.get(["inst", "feideAutoContinue"]);
  const org = inst && FEIDE_ORGS[inst];
  if (!org) return;

  // The list may still be rendering at document_idle; wait up to ~3 s.
  let item;
  for (let i = 0; i < 30 && !item; i++) {
    item = document.querySelector(`li.orglist_item[org_id="${CSS.escape(org)}"]`);
    if (!item) await new Promise((r) => setTimeout(r, 100));
  }
  if (!item) return;

  // Clicking the list item uses Feide's own logic: it fills the hidden org
  // field and the search box, and enables "Continue".
  item.click();
  const button = document.getElementById("selectorg_button");
  if (!button) return;
  button.focus();

  if (!feideAutoContinue) return;

  // Don't auto-continue again if we're back here shortly after (e.g. the user
  // pressed Back to pick a different organisation).
  const KEY = "studentwebDefaultInst.lastFeideAuto";
  const last = Number(sessionStorage.getItem(KEY) || 0);
  if (Date.now() - last < 30_000) return;
  sessionStorage.setItem(KEY, String(Date.now()));
  button.click();
})();
