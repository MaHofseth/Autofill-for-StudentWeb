// Runs on StudentWeb pages (fsweb.no and studentweb.uio.no).
// - On resultater.jsf: shows the credit-weighted grade average above the table.
// - Elsewhere: if the popup's "Calculate grade average" button was just used,
//   continue to resultater.jsf once logged in.
// Firefox provides `browser`, Chrome provides `chrome`.
const api = globalThis.browser ?? globalThis.chrome;
const t = (key, subs) => api.i18n.getMessage(key, subs);

const PENDING_MAX_AGE = 10 * 60_000;
const GRADE_POINTS = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const LETTERS = ["F", "E", "D", "C", "B", "A"];

(async () => {
  const page = location.pathname.split("/").pop();

  //Checks if the user on the resultater page
  if (page !== "resultater.jsf") {
    // The login and institution pages are handled by login.js / content.js.
    if (page === "login.jsf" || page === "velgInstitusjon.jsf") return;
    const { pendingResults = 0 } = await api.storage.local.get("pendingResults");
    if (Date.now() - pendingResults < PENDING_MAX_AGE) {
      await api.storage.local.remove("pendingResults");
      location.assign("resultater.jsf");
    }
    return;
  }

  await api.storage.local.remove("pendingResults");

  const form = document.getElementById("resultatlisteForm");
  if (!form) return;

  const box = document.createElement("section");
  box.id = "autofill-studentweb-average";
  box.setAttribute("role", "status");
  box.style.cssText =
    "margin:0 0 16px;padding:12px 16px;border:1px solid #b9cbe0;border-radius:6px;" +
    "background:#eef4fb;color:#1d2b3a;font:14px/1.5 system-ui,sans-serif;";

  const render = () => {
    // Only the student's own results table; results from other institutions
    // ("Eksterne resultater") are listed in a separate panel and never count.
    const table = [...form.querySelectorAll("table.table-standard")].find(
      (tb) => !tb.closest('[id$=":eksterneResultaterPanel"]')
    );
    if (!table) return;
    const stats = computeAverage(readCourses(table));
    box.replaceChildren(...describe(stats));
    if (!box.isConnected) table.before(box);
    saveForPopup(stats);
  };

  render();
  // StudentWeb re-renders the table when the filter ("Bare gyldige" etc.)
  // changes. Our own box is inside the form too, so ignore changes to it.
  let pending = 0;
  new MutationObserver((records) => {
    if (records.every((r) => box.contains(r.target) || [...r.addedNodes].includes(box))) return;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(render);
  }).observe(form, { childList: true, subtree: true });
})();

// The popup shows the last average per institution. Only the summary is
// stored, not the courses or grades themselves.
async function saveForPopup({ average, letter, courses, credits }) {
  // Which institution: from the logo's address (inst=…), as on the login
  // page, else the one saved in the popup.
  const logo = document.querySelector("img.logo");
  let inst = logo && new URL(logo.src).searchParams.get("inst");
  if (location.hostname === "studentweb.uio.no" && inst === "FSPROD") inst = "FSUIO";
  const { averageByInst = {}, inst: savedInst } = await api.storage.local.get(["averageByInst", "inst"]);
  inst ||= savedInst;
  if (!inst) return;
  averageByInst[inst] = { average, letter, courses, credits, updated: Date.now() };
  await api.storage.local.set({ averageByInst });
}

// One entry per course row. Rows without a course name are parts of the
// course above (delresultater) and don't count on their own.
function readCourses(table) {
  const text = (el) => (el ? el.textContent.trim() : "");
  const courses = [];
  for (const row of table.querySelectorAll("tbody > tr")) {
    const emne = row.querySelector("td.col2Emne");
    const name = text(emne?.querySelector(".column-info .infoLinje:not([aria-hidden])"));
    if (!name) continue;
    courses.push({
      code: text(emne.querySelector(".column-info .uuHidden")) || name,
      result: text(row.querySelector("td.col6Resultat .infoLinje span")).toUpperCase(),
      credits: parseFloat(text(row.querySelector("td.col7Studiepoeng span")).replace(",", ".")) || 0,
    });
  }
  return courses;
}

// Norwegian standard: A=5 … E=1, weighted by credits. Pass/fail results and
// F don't count, and for a retaken course only the best grade counts.
// With the page's "Alle" filter, old attempts are listed without credits,
// so only results with credits count.
function computeAverage(courses) {
  const best = new Map();
  for (const c of courses) {
    const points = GRADE_POINTS[c.result];
    if (!points || !c.credits) continue;
    const prev = best.get(c.code);
    if (!prev || points > prev.points) best.set(c.code, { points, credits: Math.max(c.credits, prev?.credits || 0) });
  }
  // Courses with no counted letter grade at all: pass/fail, or not passed (yet).
  const other = new Set(courses.map((c) => c.code).filter((code) => !best.has(code))).size;
  let sum = 0;
  let credits = 0;
  for (const g of best.values()) {
    sum += g.points * g.credits;
    credits += g.credits;
  }
  const average = credits ? sum / credits : null;
  return {
    average,
    letter: average === null ? null : LETTERS[Math.round(average)],
    courses: best.size,
    credits,
    other,
  };
}

function describe({ average, letter, courses, credits, other }) {
  const lang = t("lang");
  const num = (n, digits) =>
    n.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const line = (text, style = "") => {
    const p = document.createElement("p");
    p.style.cssText = "margin:0;" + style;
    p.textContent = text;
    return p;
  };

  const title = document.createElement("h2");
  title.style.cssText = "margin:0 0 4px;font-size:16px;";
  title.textContent = t("avgTitle");

  if (average === null) return [title, line(t("avgNone"))];

  const value = document.createElement("p");
  value.style.cssText = "margin:0 0 4px;font-size:22px;font-weight:600;";
  value.textContent = t("avgValue", [num(average, 2), letter]);

  const parts = [title, value, line(t("avgCounted", [String(courses), num(credits, credits % 1 ? 1 : 0)]))];
  if (other) parts.push(line(t("avgOther", [String(other)])));
  parts.push(line(t("avgRule"), "margin-top:6px;font-size:12px;color:#4a5a6a;"));
  return parts;
}
