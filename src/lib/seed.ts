import { pricing } from "./calc";
import { isoFromNow, uid } from "./format";
import type { BoqSection, Project, Quote, RateBreakdown, RateItem, Tender } from "./types";

export const PEOPLE = {
  estimators: ["Aisha Rahman", "Omar Siddiqui", "Priya Menon"],
  engineers: ["Daniel Mathew", "Fatima Noor"],
  directors: ["Khalid Hassan"],
};

export const CURRENT_USER = { name: "Aisha Rahman", role: "Estimator" };

export const UNITS = ["m3", "m2", "m", "ton", "kg", "nr", "item", "month", "LS"];

const r = (material = 0, labour = 0, equipment = 0, subcontract = 0): RateBreakdown => ({
  material,
  labour,
  equipment,
  subcontract,
});

/** Master rate library — the starting point for BOQ rates. */
const LIBRARY: Omit<RateItem, "id">[] = [
  { code: "PR-01", category: "Preliminaries", description: "Site establishment, offices and welfare", unit: "item", rates: r(85000, 25000, 15000) },
  { code: "PR-02", category: "Preliminaries", description: "Site supervision and management staff", unit: "month", rates: r(0, 62000) },
  { code: "PR-03", category: "Preliminaries", description: "Temporary works, hoarding and safety", unit: "LS", rates: r(48000, 22000, 9000) },
  { code: "EW-01", category: "Earthworks", description: "Bulk excavation in ordinary soil", unit: "m3", rates: r(0, 12, 18) },
  { code: "EW-02", category: "Earthworks", description: "Backfilling with approved material, compacted", unit: "m3", rates: r(14, 9, 11) },
  { code: "CN-01", category: "Concrete", description: "Plain blinding concrete C15, 50mm", unit: "m3", rates: r(210, 45, 15) },
  { code: "CN-02", category: "Concrete", description: "Reinforced concrete C40 in footings and rafts", unit: "m3", rates: r(320, 60, 25) },
  { code: "CN-03", category: "Concrete", description: "Reinforced concrete C40 in columns and walls", unit: "m3", rates: r(330, 85, 30) },
  { code: "CN-04", category: "Concrete", description: "Reinforced concrete C40 in suspended slabs", unit: "m3", rates: r(325, 70, 30) },
  { code: "CN-05", category: "Concrete", description: "High-yield reinforcement steel, cut, bent and fixed", unit: "ton", rates: r(2600, 450, 50) },
  { code: "CN-06", category: "Concrete", description: "Formwork to vertical and soffit surfaces", unit: "m2", rates: r(25, 30, 5) },
  { code: "WP-01", category: "Waterproofing", description: "Bituminous membrane waterproofing to substructure", unit: "m2", rates: r(0, 0, 0, 45) },
  { code: "MS-01", category: "Masonry", description: "200mm hollow concrete blockwork", unit: "m2", rates: r(38, 22) },
  { code: "FN-01", category: "Finishes", description: "Internal cement plaster, 15mm", unit: "m2", rates: r(9, 16) },
  { code: "FN-02", category: "Finishes", description: "Emulsion paint, 3 coats", unit: "m2", rates: r(7, 8) },
  { code: "FN-03", category: "Finishes", description: "Porcelain floor tiling 600x600", unit: "m2", rates: r(85, 35) },
  { code: "FN-04", category: "Finishes", description: "Gypsum board false ceiling", unit: "m2", rates: r(55, 25) },
  { code: "ME-01", category: "MEP", description: "Electrical installation (subcontract package)", unit: "LS", rates: r(0, 0, 0, 1) },
  { code: "ME-02", category: "MEP", description: "Plumbing and drainage (subcontract package)", unit: "LS", rates: r(0, 0, 0, 1) },
  { code: "ME-03", category: "MEP", description: "HVAC installation (subcontract package)", unit: "LS", rates: r(0, 0, 0, 1) },
  { code: "CV-01", category: "Civil", description: "uPVC drainage pipe 300mm dia, laid and jointed", unit: "m", rates: r(145, 40, 35) },
  { code: "CV-02", category: "Civil", description: "Precast concrete manhole, 1.5m deep", unit: "nr", rates: r(4200, 900, 600) },
];

export function seedRates(): RateItem[] {
  return LIBRARY.map((x) => ({ ...x, id: uid() }));
}

function item(code: string, description: string, unit: string, qty: number, rates: RateBreakdown) {
  return { id: uid(), code, description, unit, qty: Math.round(qty), rates: { ...rates } };
}

/** A standard building BOQ, scaled. `mep` gives lump-sum subcontract values. */
function buildingBoq(scale: number, months: number, mep: [number, number, number]): BoqSection[] {
  return [
    {
      id: uid(), code: "A", name: "Preliminaries",
      items: [
        item("A.1", "Site establishment, offices and welfare", "item", 1, r(85000 * Math.max(scale, 1), 25000, 15000)),
        item("A.2", "Site supervision and management staff", "month", months, r(0, 62000)),
        item("A.3", "Temporary works, hoarding and safety", "LS", 1, r(48000, 22000, 9000)),
      ],
    },
    {
      id: uid(), code: "B", name: "Substructure",
      items: [
        item("B.1", "Bulk excavation in ordinary soil", "m3", 4200 * scale, r(0, 12, 18)),
        item("B.2", "Plain blinding concrete C15, 50mm", "m3", 160 * scale, r(210, 45, 15)),
        item("B.3", "Reinforced concrete C40 in footings and rafts", "m3", 1350 * scale, r(320, 60, 25)),
        item("B.4", "High-yield reinforcement steel", "ton", 160 * scale, r(2600, 450, 50)),
        item("B.5", "Bituminous membrane waterproofing", "m2", 2600 * scale, r(0, 0, 0, 45)),
      ],
    },
    {
      id: uid(), code: "C", name: "Superstructure",
      items: [
        item("C.1", "Reinforced concrete C40 in columns and walls", "m3", 900 * scale, r(330, 85, 30)),
        item("C.2", "Reinforced concrete C40 in suspended slabs", "m3", 2400 * scale, r(325, 70, 30)),
        item("C.3", "High-yield reinforcement steel", "ton", 420 * scale, r(2600, 450, 50)),
        item("C.4", "Formwork to vertical and soffit surfaces", "m2", 14500 * scale, r(25, 30, 5)),
        item("C.5", "200mm hollow concrete blockwork", "m2", 9800 * scale, r(38, 22)),
      ],
    },
    {
      id: uid(), code: "D", name: "Finishes",
      items: [
        item("D.1", "Internal cement plaster, 15mm", "m2", 19000 * scale, r(9, 16)),
        item("D.2", "Emulsion paint, 3 coats", "m2", 19000 * scale, r(7, 8)),
        item("D.3", "Porcelain floor tiling 600x600", "m2", 7200 * scale, r(85, 35)),
        item("D.4", "Gypsum board false ceiling", "m2", 6800 * scale, r(55, 25)),
      ],
    },
    {
      id: uid(), code: "E", name: "MEP Services",
      items: [
        item("E.1", "Electrical installation (subcontract package)", "LS", 1, r(0, 0, 0, mep[0])),
        item("E.2", "Plumbing and drainage (subcontract package)", "LS", 1, r(0, 0, 0, mep[1])),
        item("E.3", "HVAC installation (subcontract package)", "LS", 1, r(0, 0, 0, mep[2])),
      ],
    },
  ];
}

function drainageBoq(): BoqSection[] {
  return [
    {
      id: uid(), code: "A", name: "Preliminaries",
      items: [
        item("A.1", "Site establishment and traffic diversion", "item", 1, r(65000, 30000, 40000)),
        item("A.2", "Site supervision and management staff", "month", 8, r(0, 48000)),
      ],
    },
    {
      id: uid(), code: "B", name: "Drainage Network",
      items: [
        item("B.1", "Trench excavation incl. shoring", "m3", 9800, r(0, 14, 24)),
        item("B.2", "uPVC drainage pipe 300mm dia", "m", 3200, r(145, 40, 35)),
        item("B.3", "Precast concrete manhole, 1.5m deep", "nr", 64, r(4200, 900, 600)),
        item("B.4", "Backfilling with approved material", "m3", 8200, r(14, 9, 11)),
        item("B.5", "Road reinstatement (subcontract)", "m2", 6400, r(0, 0, 0, 95)),
      ],
    },
  ];
}

const approvalsFor = (engineer: string, director: string, state: "pending" | "engineer" | "all"): Tender["approvals"] => [
  {
    role: "Tender Engineer",
    name: engineer,
    status: state === "pending" ? "pending" : "approved",
    date: state === "pending" ? undefined : isoFromNow(-2),
    comment: state === "pending" ? undefined : "Quantities checked against drawings.",
  },
  {
    role: "Director",
    name: director,
    status: state === "all" ? "approved" : "pending",
    date: state === "all" ? isoFromNow(-1) : undefined,
    comment: state === "all" ? "Approved at proposed margin." : undefined,
  },
];

const stamp = (daysAgo: number, by: string, text: string) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(9 + (daysAgo % 8), 15, 0, 0);
  return { at: d.toISOString(), by, text };
};

interface Spec {
  code: string;
  title: string;
  client: Tender["client"];
  location: string;
  sector: Tender["sector"];
  procurement: Tender["procurement"];
  received: number;
  submission: number;
  clientBudget?: number;
  estimator: string;
  engineer: string;
  status: Tender["status"];
  boq: BoqSection[];
  markup?: Partial<Tender["markup"]>;
}

function make(s: Spec): Tender {
  const director = PEOPLE.directors[0];
  const t: Tender = {
    id: uid(),
    code: s.code,
    title: s.title,
    client: s.client,
    location: s.location,
    sector: s.sector,
    procurement: s.procurement,
    receivedDate: isoFromNow(s.received),
    siteVisitDate: isoFromNow(s.received + 4),
    clarificationDate: isoFromNow(s.submission - 7),
    submissionDate: isoFromNow(s.submission),
    clientBudget: s.clientBudget,
    bidBond: s.clientBudget ? Math.round((s.clientBudget * 0.02) / 1000) * 1000 : undefined,
    estimator: s.estimator,
    tenderEngineer: s.engineer,
    director,
    status: s.status,
    boq: s.boq,
    quotes: [],
    markup: { overheadPct: 8, contingencyPct: 3, profitPct: 10, taxPct: 5, ...s.markup },
    approvals: approvalsFor(s.engineer, director, "pending"),
    activity: [stamp(-s.received, s.estimator, "Tender enquiry registered")],
  };
  if (s.status !== "enquiry" && s.status !== "declined") {
    t.activity.push(stamp(-s.received - 2, s.estimator, "Estimation started"));
  }
  return t;
}

export function seedTenders(): { tenders: Tender[]; projects: Project[]; seq: number } {
  const [aisha, omar, priya] = PEOPLE.estimators;
  const [daniel, fatima] = PEOPLE.engineers;

  const tower = make({
    code: "TND-2026-014", title: "Al Noor Mixed-Use Tower — Shell & Core",
    client: { name: "Noor Developments LLC", contact: "Rashid Karim", email: "tenders@noordev.example", phone: "+971 4 555 0141" },
    location: "Business Bay, Dubai", sector: "Commercial", procurement: "Invited",
    received: -9, submission: 12, clientBudget: 48_000_000, estimator: aisha, engineer: daniel, status: "estimating",
    boq: buildingBoq(1.6, 22, [3_900_000, 2_100_000, 4_300_000]),
  });

  const villas = make({
    code: "TND-2026-012", title: "Seaside Villas Phase 2 — 48 Villas",
    client: { name: "Seaside Living Properties", contact: "Mariam Yousef", email: "procurement@seaside.example", phone: "+971 2 555 0122" },
    location: "Saadiyat, Abu Dhabi", sector: "Residential", procurement: "Open tender",
    received: -18, submission: 5, clientBudget: 30_000_000, estimator: omar, engineer: fatima, status: "review",
    boq: buildingBoq(1, 16, [2_400_000, 1_650_000, 2_200_000]),
  });
  villas.approvals = approvalsFor(fatima, PEOPLE.directors[0], "engineer");
  villas.activity.push(stamp(3, omar, "Sent for review"), stamp(2, fatima, "Approved by Tender Engineer"));
  villas.quotes = [
    { id: uid(), itemId: villas.boq[4].items[0].id, vendor: "Brightline Electromechanical", costType: "subcontract", unitRate: 2_400_000, validUntil: isoFromNow(40), leadTimeDays: 30, selected: true },
    { id: uid(), itemId: villas.boq[4].items[0].id, vendor: "Volt Systems Contracting", costType: "subcontract", unitRate: 2_580_000, validUntil: isoFromNow(25), leadTimeDays: 21, selected: false },
    { id: uid(), itemId: villas.boq[4].items[2].id, vendor: "CoolAir HVAC", costType: "subcontract", unitRate: 2_200_000, validUntil: isoFromNow(30), leadTimeDays: 45, selected: true },
  ];

  const warehouse = make({
    code: "TND-2026-016", title: "Falcon Logistics Warehouse — Plot 14",
    client: { name: "Falcon Logistics", contact: "Imran Qureshi", email: "projects@falconlog.example", phone: "+971 4 555 0167" },
    location: "Jebel Ali, Dubai", sector: "Industrial", procurement: "Design & build",
    received: -2, submission: 21, clientBudget: 18_500_000, estimator: priya, engineer: daniel, status: "enquiry",
    boq: [],
  });

  const drainage = make({
    code: "TND-2026-009", title: "Coastal Road Storm Drainage Upgrade",
    client: { name: "Municipal Works Department", contact: "Eng. Salem Obaid", email: "tenders@works.example", phone: "+971 6 555 0190" },
    location: "Sharjah", sector: "Infrastructure", procurement: "Open tender",
    received: -34, submission: -6, clientBudget: 9_800_000, estimator: omar, engineer: fatima, status: "submitted",
    boq: drainageBoq(), markup: { profitPct: 8 },
  });
  drainage.approvals = approvalsFor(fatima, PEOPLE.directors[0], "all");
  drainage.submittedOn = drainage.submissionDate;
  drainage.submittedValue = Math.round(pricing(drainage).bidPrice);
  drainage.activity.push(stamp(9, omar, "Sent for review"), stamp(8, fatima, "Approved by Tender Engineer"), stamp(7, PEOPLE.directors[0], "Approved by Director"), stamp(6, omar, "Bid submitted to client"));

  const clinic = make({
    code: "TND-2026-004", title: "Harmony Clinic — Interior Fit-out",
    client: { name: "Harmony Healthcare", contact: "Dr. Leena Shah", email: "facilities@harmony.example", phone: "+971 4 555 0104" },
    location: "Al Barsha, Dubai", sector: "Healthcare", procurement: "Negotiated",
    received: -70, submission: -41, clientBudget: 6_200_000, estimator: aisha, engineer: daniel, status: "won",
    boq: buildingBoq(0.18, 6, [620_000, 410_000, 780_000]), markup: { profitPct: 12 },
  });
  clinic.approvals = approvalsFor(daniel, PEOPLE.directors[0], "all");
  clinic.submittedOn = clinic.submissionDate;
  clinic.submittedValue = Math.round(pricing(clinic).bidPrice);
  clinic.outcome = { date: isoFromNow(-20), note: "Awarded after commercial negotiation." };
  clinic.projectCode = "PRJ-2026-003";
  clinic.activity.push(stamp(41, aisha, "Bid submitted to client"), stamp(20, aisha, "Tender won"), stamp(19, aisha, "Project PRJ-2026-003 created and handed to Budgeting & Scheduling"));

  const school = make({
    code: "TND-2026-006", title: "Gateway School — Science Block Extension",
    client: { name: "Gateway Education Trust", contact: "Hannah Brooks", email: "estates@gateway.example", phone: "+971 4 555 0176" },
    location: "Mirdif, Dubai", sector: "Education", procurement: "Invited",
    received: -60, submission: -35, clientBudget: 11_000_000, estimator: priya, engineer: fatima, status: "lost",
    boq: buildingBoq(0.4, 10, [980_000, 620_000, 1_150_000]),
  });
  school.approvals = approvalsFor(fatima, PEOPLE.directors[0], "all");
  school.submittedOn = school.submissionDate;
  school.submittedValue = Math.round(pricing(school).bidPrice);
  school.outcome = { date: isoFromNow(-15), note: "Lost on price; competitor 6% lower.", winningPrice: Math.round(school.submittedValue * 0.94) };
  school.activity.push(stamp(35, priya, "Bid submitted to client"), stamp(15, priya, "Tender lost"));

  const substation = make({
    code: "TND-2026-015", title: "Northline Logistics Hub — 11kV Substation",
    client: { name: "Northline Logistics", contact: "Victor Alvarez", email: "bids@northline.example", phone: "+971 7 555 0155" },
    location: "Ras Al Khaimah", sector: "Infrastructure", procurement: "Invited",
    received: -5, submission: 18, clientBudget: 7_400_000, estimator: aisha, engineer: fatima, status: "estimating",
    boq: buildingBoq(0.22, 9, [2_100_000, 180_000, 420_000]),
  });

  // Vendor quotes on the estimating tenders
  const q = (t: Tender, sec: number, idx: number, vendor: string, costType: Quote["costType"], unitRate: number, valid: number, lead: number, selected = false, notes?: string): Quote => ({
    id: uid(), itemId: t.boq[sec].items[idx].id, vendor, costType, unitRate, validUntil: isoFromNow(valid), leadTimeDays: lead, selected, notes,
  });
  tower.quotes = [
    q(tower, 1, 3, "Gulf Steel Traders", "material", 2550, 21, 10, false, "Ex-works, excl. delivery"),
    q(tower, 1, 3, "Emirates Rebar Supply", "material", 2600, 14, 7, true),
    q(tower, 1, 4, "AquaSeal Waterproofing", "subcontract", 42, 30, 14, false, "Includes 10-yr warranty"),
    q(tower, 1, 4, "ShieldTech Membranes", "subcontract", 45, 45, 10, true),
    q(tower, 4, 0, "Brightline Electromechanical", "subcontract", 3_900_000, 35, 30, true),
    q(tower, 4, 0, "Volt Systems Contracting", "subcontract", 4_120_000, 35, 21),
    q(tower, 4, 2, "CoolAir HVAC", "subcontract", 4_300_000, 28, 45, true),
    q(tower, 4, 2, "Polar Climate Systems", "subcontract", 4_480_000, -3, 40, false, "Validity lapsed — re-quote requested"),
  ];
  substation.quotes = [
    q(substation, 4, 0, "PowerGrid Engineering", "subcontract", 2_100_000, 25, 60, true, "Incl. 2× 1500kVA transformers"),
    q(substation, 4, 0, "Arc Electrical Works", "subcontract", 2_240_000, 25, 50),
  ];

  const pastSubmitted = (t: Tender, daysAgo: number, approveBy: string) => {
    t.approvals = approvalsFor(approveBy, PEOPLE.directors[0], "all");
    t.submittedOn = isoFromNow(-daysAgo);
    t.submittedValue = Math.round(pricing(t).bidPrice);
    t.activity.push(stamp(daysAgo + 3, t.estimator, "Sent for review"), stamp(daysAgo + 2, approveBy, "Approved by Tender Engineer"), stamp(daysAgo + 1, PEOPLE.directors[0], "Approved by Director"), stamp(daysAgo, t.estimator, "Bid submitted to client"));
  };

  const mall = make({
    code: "TND-2026-017", title: "Oasis Community Mall — Retail Podium",
    client: { name: "Oasis Retail Holdings", contact: "Nadia Farouk", email: "tenders@oasisretail.example", phone: "+971 4 555 0177" },
    location: "Dubai Silicon Oasis", sector: "Commercial", procurement: "Open tender",
    received: -1, submission: 26, clientBudget: 36_000_000, estimator: omar, engineer: daniel, status: "enquiry", boq: [],
  });
  mall.notes = "Drawings and specs received (Rev B). Site visit booked; clarification log to be opened.";

  const hostel = make({
    code: "TND-2026-013", title: "Staff Accommodation Block — 320 Beds",
    client: { name: "Crescent Facilities Management", contact: "Joseph Thomas", email: "projects@crescentfm.example", phone: "+971 6 555 0113" },
    location: "Ajman Industrial Area", sector: "Residential", procurement: "Invited",
    received: -12, submission: 9, clientBudget: 14_000_000, estimator: priya, engineer: daniel, status: "review",
    boq: buildingBoq(0.5, 11, [1_150_000, 980_000, 1_300_000]),
  });
  hostel.activity.push(stamp(1, priya, "Sent for review"));

  const bridge = make({
    code: "TND-2026-011", title: "Wadi Crossing Pedestrian Bridge",
    client: { name: "Municipal Works Department", contact: "Eng. Salem Obaid", email: "tenders@works.example", phone: "+971 6 555 0190" },
    location: "Fujairah", sector: "Infrastructure", procurement: "Open tender",
    received: -40, submission: -14, clientBudget: 5_600_000, estimator: aisha, engineer: fatima, status: "submitted",
    boq: drainageBoq(), markup: { profitPct: 9 },
  });
  pastSubmitted(bridge, 14, fatima);

  const lab = make({
    code: "TND-2026-008", title: "Medilab Diagnostics Centre — Fit-out",
    client: { name: "Medilab Group", contact: "Dr. Arjun Pillai", email: "estates@medilab.example", phone: "+971 4 555 0108" },
    location: "Healthcare City, Dubai", sector: "Fit-out", procurement: "Negotiated",
    received: -95, submission: -70, clientBudget: 4_900_000, estimator: priya, engineer: daniel, status: "won",
    boq: buildingBoq(0.14, 5, [540_000, 380_000, 690_000]), markup: { profitPct: 13 },
  });
  pastSubmitted(lab, 70, daniel);
  lab.outcome = { date: isoFromNow(-52), note: "LOA received. Contract signed at submitted value." };
  lab.projectCode = "PRJ-2026-002";
  lab.activity.push(stamp(52, priya, "Tender won"), stamp(51, priya, "Project PRJ-2026-002 created and handed to Budgeting & Scheduling"));

  const factory = make({
    code: "TND-2026-005", title: "Pearl Foods Production Hall Extension",
    client: { name: "Pearl Foods Industries", contact: "Samir Haddad", email: "capex@pearlfoods.example", phone: "+971 6 555 0105" },
    location: "Sharjah Industrial Area 15", sector: "Industrial", procurement: "Design & build",
    received: -120, submission: -96, clientBudget: 16_500_000, estimator: omar, engineer: fatima, status: "lost",
    boq: buildingBoq(0.7, 12, [1_400_000, 900_000, 1_900_000]),
  });
  pastSubmitted(factory, 96, fatima);
  factory.outcome = { date: isoFromNow(-80), note: "Client chose a design & build bidder with faster programme.", winningPrice: Math.round(factory.submittedValue! * 0.97) };
  factory.activity.push(stamp(80, omar, "Tender lost"));

  const tower2 = make({
    code: "TND-2026-010", title: "Skyline Residences — Podium & 3 Towers",
    client: { name: "Skyline Real Estate", contact: "Elena Petrova", email: "procurement@skyline.example", phone: "+971 4 555 0110" },
    location: "JVC, Dubai", sector: "Residential", procurement: "Open tender",
    received: -30, submission: -8, clientBudget: 120_000_000, estimator: aisha, engineer: daniel, status: "declined", boq: [],
  });
  tower2.noBidReason = "Exceeds current bonding capacity; 6-week tender period too short for the scope.";
  tower2.activity.push(stamp(26, aisha, `No-bid: ${tower2.noBidReason}`));

  const school2 = make({
    code: "TND-2026-003", title: "Al Waha Primary School — New Campus",
    client: { name: "Gateway Education Trust", contact: "Hannah Brooks", email: "estates@gateway.example", phone: "+971 4 555 0176" },
    location: "Al Ain", sector: "Education", procurement: "Invited",
    received: -150, submission: -125, clientBudget: 22_000_000, estimator: priya, engineer: daniel, status: "won",
    boq: buildingBoq(0.85, 14, [1_900_000, 1_100_000, 2_300_000]), markup: { profitPct: 9 },
  });
  pastSubmitted(school2, 125, daniel);
  school2.outcome = { date: isoFromNow(-100), note: "Awarded; lowest compliant bid." };
  school2.projectCode = "PRJ-2026-001";
  school2.activity.push(stamp(100, priya, "Tender won"), stamp(99, priya, "Project PRJ-2026-001 created and handed to Budgeting & Scheduling"));

  const proj = (t: Tender, created: number): Project => ({
    code: t.projectCode!, name: t.title, tenderId: t.id, client: t.client.name, contractValue: t.submittedValue!, createdOn: isoFromNow(-created), stage: "Awaiting planning",
  });
  const projects: Project[] = [proj(clinic, 19), proj(lab, 51), proj(school2, 99)];

  return {
    tenders: [tower, villas, hostel, warehouse, mall, substation, drainage, bridge, clinic, lab, school2, school, factory, tower2],
    projects,
    seq: 17,
  };
}

export const emptyQuote = (itemId: string): Omit<Quote, "id"> => ({
  itemId,
  vendor: "",
  costType: "subcontract",
  unitRate: 0,
  validUntil: isoFromNow(30),
  leadTimeDays: 14,
  selected: false,
});
