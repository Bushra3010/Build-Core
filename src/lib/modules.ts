export interface ModuleInfo {
  no: string;
  slug: string;
  name: string;
  tagline: string;
  steps: [string, string, string, string];
  does: string;
  users: string;
  connects: string;
  value: string;
  color: string; // tailwind bg class
  text: string; // tailwind text class
  live: boolean;
  href: string;
}

export const MODULES: ModuleInfo[] = [
  {
    no: "01", slug: "tender-estimation", name: "Tender & Estimation",
    tagline: "Turn an opportunity into a priced, approved bid.",
    steps: ["Tender enquiry", "Build BOQ + rates", "Review and submit", "Win → create project"],
    does: "The estimating team registers the tender, prepares quantities and item rates, gathers quotes, applies overheads and profit, then submits the approved bid.",
    users: "Estimator · Tender Engineer · Director",
    connects: "A won tender transfers its BOQ, rates and client details to Budgeting & Scheduling.",
    value: "Faster bid preparation and a controlled handoff into project planning.",
    color: "bg-c-magenta", text: "text-c-magenta", live: true, href: "/tenders",
  },
  {
    no: "02", slug: "budgeting-scheduling", name: "Budgeting & Scheduling",
    tagline: "Turn the awarded scope into a cost and time plan.",
    steps: ["Won BOQ", "Create WBS + budget", "Schedule + baseline", "Track cost + progress"],
    does: "The planning team breaks the contract into work packages and activities, assigns cost codes and budgets, schedules the work, then freezes the approved baseline.",
    users: "Planning Engineer · Project Manager",
    connects: "Project teams use the WBS and baseline; procurement checks available budget; Finance returns actual costs.",
    value: "One approved plan for project scope, time and money.",
    color: "bg-c-blue", text: "text-c-blue", live: false, href: "/modules/budgeting-scheduling",
  },
  {
    no: "03", slug: "project-management", name: "Project Management",
    tagline: "Coordinate site work and record what has been completed.",
    steps: ["Plan site work", "DPR + measurements", "Approve bills + changes", "Handover"],
    does: "The site team records daily progress, photos, labour, materials and equipment. Measurements support client and subcontractor bills; approved changes update the project.",
    users: "Project Manager · Site Engineer · Supervisor",
    connects: "Sends resource requests to Procurement, Inventory, Equipment and HR; sends bills and measured work to Finance.",
    value: "Clearer visibility of progress and a faster route from completed work to billing.",
    color: "bg-c-cyan", text: "text-c-cyan", live: false, href: "/modules/project-management",
  },
  {
    no: "04", slug: "procurement", name: "Procurement Management",
    tagline: "Buy materials and services with budget and approval controls.",
    steps: ["Site indent", "Check budget + quotes", "Approve purchase order", "Receive + match bill"],
    does: "The purchase team checks stock and budget, requests and compares vendor quotations, gets the required approval, issues a purchase order and follows delivery.",
    users: "Purchase Officer · Project Manager · Site Engineer",
    connects: "Approved orders flow to Inventory for receiving. Vendor bills flow to Finance for matching and payment.",
    value: "Visible purchasing commitments, vendor choices and delivery status.",
    color: "bg-c-orange", text: "text-c-orange", live: false, href: "/modules/procurement",
  },
  {
    no: "05", slug: "inventory", name: "Inventory Management",
    tagline: "Track stock from receipt to the work that uses it.",
    steps: ["Receive + inspect", "Update store stock", "Issue to activity", "Track value + use"],
    does: "Store teams inspect deliveries, record goods received, control stock across stores, then issue materials to a project activity, subcontractor or equipment.",
    users: "Store Keeper · Site Engineer",
    connects: "Receives expected deliveries from Procurement, sends material cost and stock valuation to Finance.",
    value: "Better control of stock movement, material usage and project cost.",
    color: "bg-c-green", text: "text-c-green", live: false, href: "/modules/inventory",
  },
  {
    no: "06", slug: "equipment", name: "Equipment Management",
    tagline: "Keep equipment available, productive and costed correctly.",
    steps: ["Site request", "Allocate or hire", "Log, fuel + maintain", "Charge project cost"],
    does: "The plant team allocates owned equipment or arranges a hire, tracks operating hours and fuel, manages maintenance, then charges usage to the project activity.",
    users: "Equipment / Plant Manager · Site Engineer",
    connects: "Fuel and spares connect to Inventory; hired equipment and bills connect to Procurement and Finance.",
    value: "Visibility of equipment use, downtime, fuel and cost by project.",
    color: "bg-c-red", text: "text-c-red", live: false, href: "/modules/equipment",
  },
  {
    no: "07", slug: "hr-payroll", name: "HR & Payroll",
    tagline: "Manage the workforce from onboarding to payroll.",
    steps: ["Onboard + assign", "Attendance + timesheets", "Process payroll", "Charge labour cost"],
    does: "HR maintains employee records, documents and visas, captures site attendance and timesheets, then runs payroll with allowances, overtime and deductions.",
    users: "HR Officer · Payroll Officer · Site Supervisor",
    connects: "Timesheets feed labour cost to projects; payroll postings flow to Finance.",
    value: "Accurate labour cost by project and on-time, compliant payroll.",
    color: "bg-lime", text: "text-lime", live: false, href: "/modules/hr-payroll",
  },
  {
    no: "08", slug: "finance", name: "Finance & Accounts",
    tagline: "Bring project transactions into one set of connected books.",
    steps: ["Receive bills + claims", "Review AP / AR", "Post GL, tax + bank", "Report + close period"],
    does: "Finance records supplier bills, client invoices, payroll and operational costs; manages tax, payments, receipts and bank reconciliation; then reports and closes periods.",
    users: "Accountant · CFO · Director",
    connects: "Receives postings from all modules and sends actuals and commitments back to Budgeting & Scheduling.",
    value: "Traceable project profitability, cash, liabilities and financial statements.",
    color: "bg-soft", text: "text-soft", live: false, href: "/modules/finance",
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
