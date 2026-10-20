// Built-in list from fsweb.no/studentweb/velgInstitusjon.jsf (2026-10-20).
// The content script refreshes it in storage whenever the page is visited.
const DEFAULT_INSTITUTIONS = [
  { code: "FSATH", name: "Ansgar University College" },
  { code: "FSAHO", name: "The Oslo School of Architecture and Design" },
  { code: "FSBDUE", name: "Barratt Due Institute of Music" },
  { code: "FSDMMH", name: "Queen Maud University College of Early Childhood Education" },
  { code: "FSFIH", name: "Fjellhaug International University College" },
  { code: "FSMIL", name: "Norwegian Defence University College" },
  { code: "FSHIM", name: "Molde University College - Specialized University in Logistics" },
  { code: "FSHIOF", name: "Østfold University of Applied Sciences" },
  { code: "FSHVO", name: "Volda University College" },
  { code: "FSHVL", name: "Western Norway University of Applied Sciences" },
  { code: "FSHK", name: "Kristiania University of Applied Sciences" },
  { code: "FSKRUS", name: "University College of Norwegian Correctional Service" },
  { code: "FSKHIO", name: "Oslo National Academy of the Arts" },
  { code: "FSLDH", name: "Lovisenberg Deaconal University College" },
  { code: "FSMF", name: "MF Norwegian School of Theology, Religion and Society" },
  { code: "FSNLA", name: "NLA University College" },
  { code: "FSNORD", name: "Nord University" },
  { code: "FSNHH", name: "Norwegian School of Economics" },
  { code: "FSNIH", name: "Norwegian School of Sport Sciences" },
  { code: "FSNMBU", name: "Norwegian University of Life Sciences" },
  { code: "FSNMH", name: "Norwegian Academy of Music" },
  { code: "FSNTNU", name: "Norwegian University of Science and Technology" },
  { code: "FSNUC", name: "Noroff School of technology and digital media" },
  { code: "FSOSLOMET", name: "Oslomet - Oslo Metropolitan University" },
  { code: "FSPHS", name: "Norwegian Police University College" },
  { code: "FSSA", name: "Sámi allaskuvla/Sámi University of Applied Sciences" },
  { code: "FSUIT", name: "UiT The Arctic University of Norway" },
  { code: "FSUIA", name: "University of Agder" },
  { code: "FSUIB", name: "University of Bergen" },
  { code: "FSHINN", name: "University of Inland Norway" },
  { code: "FSUIO", name: "University of Oslo" },
  { code: "FSUIS", name: "University of Stavanger" },
  { code: "FSHSN", name: "University of South-Eastern Norway" },
  { code: "FSVID", name: "VID Specialized University" },
];

// Login methods shown on each institution's login page (scanned 2026-10-20).
// login.js updates this in storage (methodsByInst) whenever a login page is visited.
const ALL_METHODS = { feide: "Feide", fnr: "Fødselsnummer and PIN", idporten: "ID-porten" };
const FIP = ["feide", "idporten", "fnr"];
const FI = ["feide", "idporten"];
const DEFAULT_METHODS = {
  FSATH: FI, FSAHO: FIP, FSBDUE: FIP, FSDMMH: FIP, FSFIH: FIP, FSMIL: FIP,
  FSHIM: FIP, FSHIOF: FI, FSHVO: FI, FSHVL: FI, FSHK: FIP, FSKRUS: FI,
  FSKHIO: FI, FSLDH: FI, FSMF: FIP, FSNLA: FIP, FSNORD: FIP, FSNHH: FIP,
  FSNIH: ["feide", "fnr"], FSNMBU: FIP, FSNMH: FI, FSNTNU: FIP, FSNUC: FI,
  FSOSLOMET: FIP, FSPHS: FIP, FSSA: FIP, FSUIT: ["feide", "fnr"], FSUIA: FI,
  FSUIB: FI, FSHINN: FIP, FSUIO: FI, FSUIS: FI, FSHSN: FI, FSVID: FI,
};

// Feide organisation (org_id on idp.feide.no's "choose affiliation" page)
// for each institution (looked up 2026-10-20).
const FEIDE_ORGS = {
  FSATH: "ansgarhogskole.no", FSAHO: "aho.no", FSBDUE: "bdm.no", FSDMMH: "dmmh.no",
  FSFIH: "fjellhaug.no", FSMIL: "mil.no", FSHIM: "himolde.no", FSHIOF: "hiof.no",
  FSHVO: "hivolda.no", FSHVL: "hvl.no", FSHK: "feide.egms.no", FSKRUS: "krus.no",
  FSKHIO: "khio.no", FSLDH: "ldh.no", FSMF: "mf.no", FSNLA: "nla.no",
  FSNORD: "nord.no", FSNHH: "nhh.no", FSNIH: "nih.no", FSNMBU: "nmbu.no",
  FSNMH: "nmh.no", FSNTNU: "ntnu.no", FSNUC: "noroff.no", FSOSLOMET: "oslomet.no",
  FSPHS: "phs.no", FSSA: "samas.no", FSUIT: "uit.no", FSUIA: "uia.no",
  FSUIB: "uib.no", FSHINN: "inn.no", FSUIO: "uio.no", FSUIS: "uis.no",
  FSHSN: "usn.no", FSVID: "vid.no",
};
