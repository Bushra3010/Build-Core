export type TenderStatus =
  | "enquiry"
  | "estimating"
  | "review"
  | "submitted"
  | "won"
  | "lost"
  | "declined";

export type Sector =
  | "Commercial"
  | "Residential"
  | "Industrial"
  | "Infrastructure"
  | "Healthcare"
  | "Education"
  | "Fit-out";

export type Procurement = "Open tender" | "Invited" | "Negotiated" | "Design & build";

export type CostType = "material" | "labour" | "equipment" | "subcontract";

export interface RateBreakdown {
  material: number;
  labour: number;
  equipment: number;
  subcontract: number;
}

export interface BoqItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  qty: number;
  rates: RateBreakdown;
}

export interface BoqSection {
  id: string;
  code: string;
  name: string;
  items: BoqItem[];
}

export interface Quote {
  id: string;
  itemId: string;
  vendor: string;
  costType: CostType;
  unitRate: number;
  validUntil: string;
  leadTimeDays: number;
  notes?: string;
  selected: boolean;
}

export interface Markup {
  overheadPct: number;
  contingencyPct: number;
  profitPct: number;
  taxPct: number;
}

export interface Approval {
  role: "Tender Engineer" | "Director";
  name: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  date?: string;
}

export interface ActivityEntry {
  at: string; // ISO datetime
  by: string;
  text: string;
}

export interface Client {
  name: string;
  contact: string;
  email: string;
  phone: string;
}

export interface Tender {
  id: string;
  code: string;
  title: string;
  client: Client;
  location: string;
  sector: Sector;
  procurement: Procurement;
  receivedDate: string;
  siteVisitDate?: string;
  clarificationDate?: string;
  submissionDate: string;
  clientBudget?: number;
  bidBond?: number;
  estimator: string;
  tenderEngineer: string;
  director: string;
  notes?: string;
  status: TenderStatus;
  boq: BoqSection[];
  quotes: Quote[];
  markup: Markup;
  approvals: Approval[];
  activity: ActivityEntry[];
  submittedOn?: string;
  submittedValue?: number;
  outcome?: { date: string; note: string; winningPrice?: number };
  noBidReason?: string;
  projectCode?: string;
}

export interface RateItem {
  id: string;
  code: string;
  category: string;
  description: string;
  unit: string;
  rates: RateBreakdown;
}

export interface Project {
  code: string;
  name: string;
  tenderId: string;
  client: string;
  contractValue: number;
  createdOn: string;
  stage: "Awaiting planning";
}

export type NewTenderInput = Pick<
  Tender,
  | "title"
  | "client"
  | "location"
  | "sector"
  | "procurement"
  | "receivedDate"
  | "siteVisitDate"
  | "clarificationDate"
  | "submissionDate"
  | "clientBudget"
  | "bidBond"
  | "estimator"
  | "tenderEngineer"
  | "director"
  | "notes"
>;
