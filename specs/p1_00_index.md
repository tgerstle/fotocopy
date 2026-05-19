# Phase 1 Index: Orchestration Foundation & Discovery

This folder contains the breakdown of the Multi-Pass Pipeline Architecture for Phase 1. The workflow heavily decouples network capture from localized offline analysis, enabling safe, non-destructive data gathering and robust schema extraction.

### Core Specs:

1.  **[Crawler Engine](./p1_01_crawler_engine.md)** - Defensive Playwright configuration, navigation strategies, and snapshot generation.
2.  **[Scenario System](./p1_02_scenario_system.md)** - Adapted heuristics to bypass modals, overlays, and force lazy-loaded assets.
3.  **[DOM Parser Injector](./p1_03_dom_parser_injector.md)** - In-browser script execution to retrieve visual geometry and accessibility semantics.
4.  **[State Management & DLQ](./p1_04_state_management.md)** - Implements SQLite/JSON checkpointing for idempotency, and Dead-Letter-Queues for robust error handling.
5.  **[URL Discovery & Intake](./p1_05_url_discovery.md)** - Defines the deterministic intake valve (Sitemap/CSV) to populate the local ledger before crawling.
