# BuildCore ERP

Construction ERP frontend. Module 01 **Tender & Estimation** is complete; modules 02–08 are shown as "coming soon".

- Frontend only — no backend. Demo data is seeded on first visit and saved in the browser (`localStorage`). Use **Reset** on the dashboard to restore it.
- Live site: deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## End-to-end tests

```bash
npm run test:e2e
```

Playwright builds the static site, serves it, and runs the full tender lifecycle (enquiry → BOQ → quotes → pricing → review → submit → win → project) plus screen, validation and phone-layout checks. The deploy workflow runs the same tests and only publishes when they pass.

To run them against the live site:

```bash
E2E_BASE_URL=https://bushra3010.github.io/Build-Core/ npm run test:e2e
```

## Build the static site

```bash
npm run build
```

Output goes to `out/` and can be hosted on any static web server.
