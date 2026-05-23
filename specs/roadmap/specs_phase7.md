## 🚀 Phase 7: Production Deployment & CMS Integration

**Objective:** Move the verified, working local site to the high-availability Cloudflare edge.

### **7.1. Global Shell Generation**

- **Need:** Scaffolding the React structural components (Headers, Footers, Navigation) mathematically discovered outside the page-level array.
- **Technical Implementation (How):**
  - **Tool:** Global Classifier and Global Prompt Generator.
  - **Detail:** Iterating across the purged structural layout nodes (removed by the hashing orchestrator in Phase 2.1), we pass isolated chunks into the LLM classifier specifically requesting Singleton definitions alongside reference HTML. We then generate Copilot Prompts appending the `children` prop architecture rules.
  - **Deliverable:** Individual Markdown files describing overarching global shell layouts (e.g., `Navigation.prompt.md`), ready for Next.js Layout rendering.

### **7.2. Database Seeding & CMS Mapping**

- **Need:** Populate the Payload CMS SQLite database natively using the sanitized JSON schema manifests without manual data entry.
- **Technical Implementation (How):**
  - **Tool:** Payload CMS Local API Scripting.
  - **Detail:** Node scripts iterate over the `output/hydration/` JSON blueprints. Using mapped JSON-Schema configuration flags (established in `fotocopy.components.json`), the script maps JSON arrays dynamically to Payload `Blocks` fields.
  - **Deliverable:** A fully populated Local SQLite Payload CMS backend instantly reflecting the pipeline output.

### **7.3. Edge Network Hand-off (Cloudflare Deploy)**

- **Need:** Deploy the finalized Next.js application bundle and configuration files to the edge network.
- **Technical Implementation (How):**
  - **Tool:** OpenNext (`@opennextjs/cloudflare`) and Wrangler CLI.
  - **Detail:** The deployment script must package the entire stack (Next.js code + component scaffolds + manifest definitions) and execute the required wrangler command, ensuring environment variables point to the correct R2/D1 endpoints.
  - **Deliverable:** A production-ready, globally distributed URL hosting the entire Pipeline result.
