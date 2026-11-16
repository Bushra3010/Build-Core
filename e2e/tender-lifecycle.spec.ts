import { YEAR, createTender, expect, expectedBid, fmt, tab, test } from "./helpers";

const status = (page: import("@playwright/test").Page, label: string) =>
  expect(page.getByText(label, { exact: true }).first()).toBeVisible();

test("full tender lifecycle: enquiry → BOQ → quotes → pricing → review → submit → win → project", async ({ page, dialogs }) => {
  // ── 1. Tender enquiry ───────────────────────────────────────────────
  await createTender(page, "E2E Lifecycle Tower");
  await expect(page.getByText(`TND-${YEAR}-018`)).toBeVisible();
  await status(page, "Enquiry");
  await expect(page.getByText("Not priced")).toBeVisible();

  await page.getByRole("button", { name: "Start estimation" }).click();
  await status(page, "Estimating");
  await expect(page.getByText("No bill of quantities yet")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send for review" })).toBeDisabled();

  // ── 2. Build BOQ + rates ───────────────────────────────────────────
  await page.getByRole("button", { name: "Use standard sections" }).click();
  for (const code of ["A", "B", "C", "D", "E"]) await expect(page.getByTestId(`boq-section-${code}`)).toBeVisible();

  // From the rate library: excavation (30/m3) into Substructure
  await page.getByRole("button", { name: "Add from rate library" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Search rates…").fill("excavation");
  await dialog.getByRole("checkbox", { name: /Bulk excavation/ }).check();
  await dialog.getByLabel("Target section").selectOption({ label: "Into B · Substructure" });
  await dialog.getByRole("button", { name: "Add 1 item" }).click();
  await expect(dialog).toBeHidden();

  // From the rate library: site supervision (62,000/month) into Preliminaries
  await page.getByRole("button", { name: "Add from rate library" }).click();
  await dialog.getByRole("checkbox", { name: /Site supervision/ }).check();
  await dialog.getByRole("button", { name: "Add 1 item" }).click();

  const row = (code: string) => page.getByTestId(`boq-row-${code}`);
  await expect(row("B.1").getByLabel("Description")).toHaveValue("Bulk excavation in ordinary soil");
  await row("B.1").getByLabel("Quantity").fill("1000");
  await row("A.1").getByLabel("Quantity").fill("6");

  // Manual item in MEP
  await page.getByTestId("boq-section-E").getByRole("button", { name: "Add item" }).click();
  await row("E.1").getByLabel("Description").fill("Fire alarm system");
  await row("E.1").getByLabel("Unit").selectOption("LS");
  await row("E.1").getByLabel("Quantity").fill("1");
  await row("E.1").getByLabel("Subcontract rate").fill("150000");

  // Item amounts and direct cost: 30,000 + 372,000 + 150,000
  await expect(row("B.1")).toContainText("30,000");
  await expect(row("A.1")).toContainText("372,000");
  await expect(page.getByText("Direct cost AED 552,000")).toBeVisible();

  // A temporary item can be removed again
  await page.getByTestId("boq-section-D").getByRole("button", { name: "Add item" }).click();
  await expect(row("D.1")).toBeVisible();
  await row("D.1").getByRole("button", { name: "Delete item" }).click();
  await expect(row("D.1")).toHaveCount(0);

  // ── Vendor quotes ──────────────────────────────────────────────────
  await tab(page, "Quotes");
  await page.getByRole("button", { name: "Add quote" }).click();
  await expect(page.getByText("Enter the vendor name")).toBeVisible();

  const addQuote = async (vendor: string, rate: string) => {
    await page.getByLabel("BOQ item").selectOption({ label: "E.1 — Fire alarm system" });
    await page.getByLabel("Vendor / subcontractor").fill(vendor);
    await page.getByLabel("Applies to").selectOption("subcontract");
    await page.getByLabel(/Unit rate/).fill(rate);
    await page.getByRole("button", { name: "Add quote" }).click();
  };
  await addQuote("SafeGuard Fire", "140000");
  await addQuote("Blaze Systems", "155000");

  const safeguard = page.locator("li", { hasText: "SafeGuard Fire" });
  await expect(safeguard).toContainText("Lowest");
  await expect(page.locator("li", { hasText: "Blaze Systems" })).not.toContainText("Lowest");
  await safeguard.getByRole("button", { name: "Apply rate" }).click();
  await expect(safeguard).toContainText("Applied");

  await tab(page, "BOQ & rates");
  await expect(row("E.1").getByLabel("Subcontract rate")).toHaveValue("140000");
  await expect(row("E.1")).toContainText("2 quotes");
  let direct = 542_000;
  await expect(page.getByText(`Direct cost AED ${fmt(direct)}`)).toBeVisible();

  // ── Pricing: overheads 8%, contingency 3%, profit 10%, VAT 5% ──────
  await tab(page, "Pricing");
  const bidBox = page.getByText("Bid price (excl. VAT)").locator("..");
  await expect(bidBox).toContainText(fmt(expectedBid(direct).bid)); // 661,782
  await expect(page.getByText("Total incl. VAT").locator("..")).toContainText(fmt(expectedBid(direct).total));

  await page.getByLabel("Profit %").fill("12");
  const m12 = { oh: 8, cont: 3, profit: 12, vat: 5 };
  await expect(bidBox).toContainText(fmt(expectedBid(direct, m12).bid));
  await expect(bidBox).toContainText("Margin 10.7%");

  // ── 3. Review: return for changes ──────────────────────────────────
  await page.getByRole("button", { name: "Send for review" }).click();
  await status(page, "In review");
  await expect(page.getByText("Locked while in review")).toHaveCount(0); // on Review tab, no lock banner
  await page.getByRole("button", { name: "Return for changes" }).click();
  expect(dialogs.at(-1)).toContain("Add a comment");
  await status(page, "In review");

  await page.getByPlaceholder("Comment (required when returning)").fill("Check excavation quantity");
  await page.getByRole("button", { name: "Return for changes" }).click();
  await status(page, "Estimating");

  // Rework the BOQ, resubmit for review
  await tab(page, "BOQ & rates");
  await row("B.1").getByLabel("Quantity").fill("1200");
  direct = 548_000;
  await expect(page.getByText(`Direct cost AED ${fmt(direct)}`)).toBeVisible();

  await page.getByRole("button", { name: "Send for review" }).click();
  await status(page, "In review");
  await expect(page.getByRole("button", { name: "Submit bid", exact: true })).toBeDisabled();

  // Locked while in review
  await tab(page, "BOQ & rates");
  await expect(page.getByText("Locked while in review")).toBeVisible();
  await expect(row("B.1").getByLabel("Quantity")).toBeDisabled();

  // ── Approvals: Tender Engineer then Director ───────────────────────
  await tab(page, "Review & submit");
  await page.getByRole("button", { name: "Approve as Daniel" }).click();
  await page.getByRole("button", { name: "Approve as Khalid" }).click();
  const expectedSubmitted = Math.round(expectedBid(direct, m12).bid); // 681,274
  const submitInPanel = page.getByRole("button", { name: `Submit bid · AED ${fmt(expectedSubmitted)}` });
  await expect(submitInPanel).toBeVisible();
  await submitInPanel.click();
  expect(dialogs.at(-1)).toContain("Pricing will be locked");

  await status(page, "Submitted");
  await expect(page.getByText("Submitted value")).toBeVisible();
  await expect(page.getByText(`AED ${fmt(expectedSubmitted)}`).first()).toBeVisible();

  await tab(page, "Pricing");
  await expect(page.getByText(`Submitted value frozen at AED ${fmt(expectedSubmitted)}`)).toBeVisible();
  await expect(page.getByLabel("Profit %")).toBeDisabled();

  // ── 4. Win → create project ────────────────────────────────────────
  await tab(page, "Outcome");
  await page.getByRole("button", { name: "Mark as won" }).click();
  await status(page, "Won");
  await expect(page.getByText("What transfers")).toBeVisible();
  await page.getByRole("button", { name: "Create project" }).last().click();
  await expect(page.getByText(`PRJ-${YEAR}-004`).first()).toBeVisible();
  await expect(page.getByText("Awaiting planning")).toBeVisible();

  // Activity log captured every step
  await tab(page, "Activity");
  for (const e of [
    "Tender enquiry registered",
    "Estimation started",
    "Quote from SafeGuard Fire added for E.1",
    "Returned to estimating by Tender Engineer: Check excavation quantity",
    "Approved by Director",
    "Bid submitted to client",
    "Tender won",
    `Project PRJ-${YEAR}-004 created`,
  ]) {
    await expect(page.getByText(e, { exact: false }).first()).toBeVisible();
  }

  // ── Persists across reload and shows on dashboard ─────────────────
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Lifecycle Tower");
  await status(page, "Won");
  await page.goto("./");
  await expect(page.getByText("4 won")).toBeVisible();
});

test("lost tender records the winning price and the gap", async ({ page }) => {
  await page.goto("./tenders/");
  await page.getByRole("link", { name: /Coastal Road Storm Drainage Upgrade/ }).first().click();
  await status(page, "Submitted");
  await page.getByLabel(/Winning price/).fill("3000000");
  await page.getByLabel("Notes").fill("Lost on price");
  await page.getByRole("button", { name: "Mark as lost" }).click();
  await status(page, "Lost");
  await expect(page.getByText("Lost — price comparison")).toBeVisible();
  await expect(page.getByText("AED 3,000,000")).toBeVisible();
  await expect(page.getByText(/^\+\d+\.\d%$/)).toBeVisible();
});

test("no-bid needs a reason, can be re-opened, and an enquiry can be deleted", async ({ page }) => {
  await createTender(page, "E2E No-bid Tender");
  await page.getByRole("button", { name: "No-bid" }).click();
  const confirm = page.getByRole("button", { name: "Confirm no-bid" });
  await expect(confirm).toBeDisabled();
  await page.getByRole("dialog").getByLabel("Reason").fill("Outside our capacity");
  await confirm.click();
  await status(page, "No-bid");
  await expect(page.getByText("Outside our capacity").first()).toBeVisible();

  await page.getByRole("button", { name: "Re-open" }).click();
  await status(page, "Enquiry");

  await tab(page, "Enquiry");
  await page.getByRole("button", { name: "Delete tender" }).click();
  await expect(page).toHaveURL(/\/tenders\/$/);
  await expect(page.getByText("E2E No-bid Tender")).toHaveCount(0);
});

test("send for review stays disabled until every BOQ item is priced", async ({ page }) => {
  await createTender(page, "E2E Readiness");
  await page.getByRole("button", { name: "Start estimation" }).click();
  await page.getByRole("button", { name: "Use standard sections" }).click();
  await page.getByTestId("boq-section-A").getByRole("button", { name: "Add item" }).click();
  const send = page.getByRole("button", { name: "Send for review" });
  await expect(send).toBeDisabled();

  await tab(page, "Review & submit");
  await expect(page.getByText("1 item(s) unpriced")).toBeVisible();

  await tab(page, "BOQ & rates");
  const r = page.getByTestId("boq-row-A.1");
  await r.getByLabel("Description").fill("Mobilisation");
  await r.getByLabel("Quantity").fill("1");
  await r.getByLabel("Labour rate").fill("5000");
  await expect(send).toBeEnabled();

  // Item codes are never reused after a deletion
  const sectionB = page.getByTestId("boq-section-B");
  await sectionB.getByRole("button", { name: "Add item" }).click();
  await sectionB.getByRole("button", { name: "Add item" }).click();
  await page.getByTestId("boq-row-B.1").getByRole("button", { name: "Delete item" }).click();
  await sectionB.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByTestId("boq-row-B.2")).toHaveCount(1);
  await expect(page.getByTestId("boq-row-B.3")).toHaveCount(1);
});

test("rate library picker starts with a fresh search each time", async ({ page }) => {
  await createTender(page, "E2E Picker");
  await page.getByRole("button", { name: "Start estimation" }).click();
  await page.getByRole("button", { name: "Use standard sections" }).click();
  await page.getByRole("button", { name: "Add from rate library" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Search rates…").fill("excavation");
  await dialog.getByRole("checkbox", { name: /Bulk excavation/ }).check();
  await dialog.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Add from rate library" }).click();
  await expect(dialog.getByPlaceholder("Search rates…")).toHaveValue("");
  await expect(dialog.getByRole("checkbox", { name: /Site supervision/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Add items" })).toBeDisabled();
});
