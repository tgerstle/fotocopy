# Phase 7: Production Deployment & CMS Integration

Because the pipeline was built to consume an array of JSON objects, the handoff to the CMS is a perfectly frictionless 1:1 translation.

- **Payload CMS "Blocks" & "Collections" Mapping:** Payload CMS natively supports a schema type called a **"Blocks Field"** for ad-hoc pages (Home, About). For identified templates (from Phase 2), we map data directly to rigid **Collections** (e.g., `Posts`, `Products`) using defined fields (Title, Content, Featured Image).
- **Headless Database Seeding:** A Node script iterates through `/data/manifests/*.json` and `POST`s the arrays directly to the Payload CMS Local/REST API. The data perfectly aligns with Payload's Block Fields or Collection schemas based on the inferred Page Type.
- **Data Source Toggle:** We swap an environment variable in Next.js (e.g., `DATA_SOURCE=payload`). A newly introduced Next.js **Catch-All route** (`app/[...slug]/page.tsx`) acts as the page builder, iterating over the JSON arrays from Payload CMS instead of static files. The frontend dynamically renders the Pipeline-generated UI components.
