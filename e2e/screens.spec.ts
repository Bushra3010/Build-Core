import { YEAR, createTender, expect, isoFromNow, tab, test } from "./helpers";

test("dashboard shows demo KPIs, open tenders and deadlines", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
  await expect(page.getByText("Pipeline value of open tenders")).toBeVisible();
  await expect(page.getByText("6 open")).toBeVisible();
  await expect(page.getByText("3 won")).toBeVisible();
  await expect(page.getByText("60%")).toBeVisible(); // 3 won of 5 decided
  await expect(page.getByRole("link", { name: /Al Noor Mixed-Use Tower/ }).first()).toBeVisible();
  await expect(page.getByText("Needs attention")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Calendar/ })).toBeVisible();

  // Card opens the tender
  await page.getByRole("link", { name: /Seaside Villas Phase 2/ }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seaside Villas Phase 2 — 48 Villas");
});

test("tender register filters, searches and sorts", async ({ page }) => {
  await page.goto("./tenders/");
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(14);

  await page.getByRole("button", { name: /^In review/ }).click();
  await expect(rows).toHaveCount(2);
  await page.getByRole("button", { name: /^Won/ }).click();
  await expect(rows).toHaveCount(3);
  await page.getByRole("button", { name: /^All/ }).click();

  await page.getByPlaceholder("Search title, client, code…").fill("drainage");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("TND-2026-009");
  await page.getByPlaceholder("Search title, client, code…").fill("zzz-nothing");
  await expect(page.getByText("No tenders match")).toBeVisible();
  await page.getByPlaceholder("Search title, client, code…").fill("");

  await page.getByLabel("Sort").selectOption("value");
  await expect(rows.first()).toContainText("Al Noor Mixed-Use Tower");
});

test("enquiry form validates required fields and dates", async ({ page }) => {
  await page.goto("./tenders/new/");
  await page.getByRole("button", { name: "Register tender" }).click();
  await expect(page.getByText("Enter the tender title")).toBeVisible();
  await expect(page.getByText("Enter the client name")).toBeVisible();

  await page.getByLabel("Tender title *").fill("Date check");
  await page.getByLabel("Client name *").fill("Client");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Submission deadline *").fill(isoFromNow(-10));
  await page.getByRole("button", { name: "Register tender" }).click();
  await expect(page.getByText("Submission must be after the date received")).toBeVisible();
  await expect(page.getByText("Enter a valid email")).toBeVisible();
  await expect(page).toHaveURL(/tenders\/new/);

  await page.getByLabel("Email").fill("bids@client.example");
  await page.getByLabel("Submission deadline *").fill(isoFromNow(14));
  await page.getByRole("button", { name: "Register tender" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Date check");
  await expect(page.getByText("14 days left")).toBeVisible();

  // New tender appears in the register
  await page.goto("./tenders/");
  await expect(page.locator("table tbody tr")).toHaveCount(15);
  await expect(page.locator("table").getByText(`TND-${YEAR}-018`)).toBeVisible();
});

test("enquiry details can be edited and persist after reload", async ({ page }) => {
  await createTender(page, "Edit Me");
  await tab(page, "Enquiry");
  await page.getByLabel("Tender title *").fill("Edited Title");
  await page.getByLabel("Sector").selectOption("Healthcare");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Edited Title");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Edited Title");
  await expect(page.getByText("#Healthcare")).toBeVisible();
});

test("BOQ exports to CSV", async ({ page }) => {
  await page.goto("./tenders/");
  await page.getByRole("link", { name: /Al Noor Mixed-Use Tower/ }).first().click();
  await tab(page, "BOQ & rates");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export CSV" }).click()]);
  expect(download.suggestedFilename()).toBe("TND-2026-014-BOQ.csv");
  const csv = await (await import("node:fs/promises")).readFile((await download.path())!, "utf8");
  expect(csv.split("\n")[0]).toContain('"Code","Description","Unit","Qty"');
  expect(csv).toContain("TOTAL DIRECT COST");
  expect(csv).toContain("Bulk excavation in ordinary soil");
});

test("seeded tenders open on the right step for their status", async ({ page }) => {
  const cases: [string, string][] = [
    ["Falcon Logistics Warehouse — Plot 14", "Enquiry details"],
    ["Seaside Villas Phase 2 — 48 Villas", "Approval chain"],
    ["Harmony Clinic — Interior Fit-out", "Project created"],
    ["Gateway School — Science Block Extension", "Lost — price comparison"],
    ["Skyline Residences — Podium & 3 Towers", "No-bid decision"],
  ];
  for (const [title, panel] of cases) {
    await page.goto("./tenders/");
    await page.getByRole("link", { name: new RegExp(title.split(" — ")[0]) }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("heading", { name: panel })).toBeVisible();
  }
});

test("rate library edits, deletes and demo reset", async ({ page }) => {
  await page.goto("./rates/");
  const rows = page.locator("table tbody tr");
  const before = await rows.count();
  await page.getByRole("button", { name: "Add rate" }).click();
  await expect(rows).toHaveCount(before + 1);
  const last = rows.last();
  await last.getByLabel("Description").fill("E2E custom rate");
  await last.getByLabel("Material").fill("12.5");
  await last.getByLabel("Labour").fill("7.5");
  await expect(last).toContainText("20.00");

  await page.reload();
  await expect(page.locator("table tbody tr").last().getByLabel("Description")).toHaveValue("E2E custom rate");

  await page.locator("table tbody tr").last().getByRole("button", { name: "Delete rate" }).click();
  await expect(page.locator("table tbody tr")).toHaveCount(before);

  // Reset restores seeded data
  await page.locator("table tbody tr").first().getByLabel("Description").fill("Changed");
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.locator("table tbody tr").first().getByLabel("Description")).toHaveValue("Site establishment, offices and welfare");
});

test("unknown tender link shows a friendly not-found message", async ({ page }) => {
  await page.goto("./tenders/view/?id=does-not-exist");
  await expect(page.getByText("Tender not found")).toBeVisible();
  await page.getByRole("link", { name: "Back to tender register" }).click();
  await expect(page.getByRole("heading", { name: /Tender register/ })).toBeVisible();
});

test("module pages load from the rail and module list", async ({ page }) => {
  await page.goto("./modules/");
  await expect(page.getByRole("heading", { name: /Modules/, level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /Finance & Accounts/ }).last().click();
  await expect(page.getByRole("heading", { name: "Finance & Accounts", level: 1 })).toBeVisible();
  await expect(page.getByText("In development.")).toBeVisible();
});

test.describe("phone layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ["./", "./tenders/", "./tenders/new/", "./rates/"]) {
    test(`no sideways page scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
  test("no sideways page scroll on a tender's BOQ", async ({ page }) => {
    await page.goto("./tenders/");
    await page.getByRole("link", { name: /Al Noor Mixed-Use Tower/ }).first().click();
    await tab(page, "BOQ & rates");
    await expect(page.getByTestId("boq-section-A")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
