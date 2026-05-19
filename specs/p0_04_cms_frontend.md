# Phase 0, Step 4: Component Rendering & Frontend Mocks

This spec outlines the final target for our Tracer Bullet. Rather than prematurely wrestling with Payload CMS schema definitions and database seeding, we will build a pure Next.js frontend that consumes our `03_cms_ready.json` directly from the local file system.

We will layer Payload CMS over this existing routing structure later (in Phase 5) once the React components and extraction pipeline are fully proven.

## 1. Project Initialization

- `npx create-next-app@latest demo-frontend --typescript --tailwind --app --eslint`
- Validate that Tailwind configuration natively consumes the W3C DTCG tokens.

## 2. Mocking the API Layer

Instead of seeding a database, we just place the output of Step 3 (`03_cms_ready.json`) into `/demo-frontend/data/mock-api/index.json`.

## 3. Next.js Routing

In `/demo-frontend/src/app/[...slug]/page.tsx`:

1. Use `fs.promises.readFile` to fetch the mock JSON file matching the URL slug (acting as our mock Payload API).
2. Parse the JSON and pass the structured data: `<BlockRenderer blocks={pageData.layout} />`.
3. Create `components/blocks/Hero.tsx` defined by strict TypeScript interfaces matching the JSON shape.

## Verification & Tests

1. Start `npm run dev`.
2. Navigate to `http://localhost:3000/`.
3. The server-renderer successfully reads `index.json` and renders the `Hero` component.
4. The text "Welcome to Fotocopy" is printed on screen without errors.
5. **The Styles Match:** The title inherits the exact `text-primary` token (`#E24A4A`) extracted back in Mock 1.

By rendering directly from the Local JSON mock, we can rapidly cycle UI component development and schema changes purely in code, before migrating them to Payload CMS later.
