import { expect, test as base, type Page } from "@playwright/test";

/** Every test starts with fresh demo data and auto-accepts confirm()/alert(). */
export const test = base.extend<{ dialogs: string[] }>({
  dialogs: [
    async ({ page }, use) => {
    const seen: string[] = [];
    page.on("dialog", async (d) => {
      seen.push(d.message());
      await d.accept();
    });
    await use(seen);
    },
    { auto: true },
  ],
});
export { expect };

export const YEAR = new Date().getFullYear();

export function isoFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const fmt = (n: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(Math.round(n));

/** Mirrors src/lib/calc.ts pricing() — an independent check of the numbers on screen. */
export function expectedBid(direct: number, m = { oh: 8, cont: 3, profit: 10, vat: 5 }) {
  const cost = direct * (1 + m.oh / 100 + m.cont / 100);
  const bid = cost * (1 + m.profit / 100);
  return { bid, total: bid * (1 + m.vat / 100) };
}

export async function createTender(page: Page, title: string, client = "E2E Client LLC") {
  await page.goto("./tenders/new/");
  await page.getByLabel("Tender title *").fill(title);
  await page.getByLabel("Client name *").fill(client);
  await page.getByLabel("Project location").fill("Dubai");
  await page.getByRole("button", { name: "Register tender" }).click();
  await expect(page).toHaveURL(/tenders\/view\/\?id=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
}

export const tab = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).click();

export const header = (page: Page) => page.locator("main > div > div").first();

export async function openSeeded(page: Page, title: string) {
  await page.goto("./tenders/");
  await page.getByRole("link", { name: new RegExp(title) }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
}
