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

## Build the static site

```bash
npm run build
```

Output goes to `out/` and can be hosted on any static web server.
