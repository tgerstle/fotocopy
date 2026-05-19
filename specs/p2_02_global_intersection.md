# Phase 2, Step 2: Global Intersection (Hashing Engine)

Legacy websites frequently lack semantic `<header>` or `<footer>` tags, relying instead on `<div id="navbar">` or even meaningless class names. We must algorithmically find these repeating global structures so we don't send 500 identical top navigation menus to the LLM (which wastes tokens and risks hallucination drift).

## 1. The Hashing Algorithm

The crawler captures the DOM for every page. An offline Node.js algorithm then analyzes the geometric and structural topology of these files.

**The Hash Signature:**
For every node (e.g., a `div`), we generate a SHA-256 hash derived from:

- The tag name (`DIV`, `UL`, `LI`)
- The depth of its children
- Its structural class names (ignoring dynamic state classes like `.active` or `aria-current="..."`)

## 2. The Intersection Logic

Once every DOM tree is hashed, the engine compares them:

1.  **Threshold Match:** If a specific structural hash appears on `> 90%` of all crawled URLs, it is statistically proven to be a global boundary element (e.g., the Header, the Footer, or a global Sidebar).
2.  **Output Manifest:** The engine outputs a `globals_manifest.json` file detailing these target hashes.

## 3. The Purge

Before the **Chunk Slicer** (`p2_01`) begins cutting the page, it reads the `globals_manifest.json` and cleanly deletes any nodes from the DOM tree that match those global hashes. The page is now pure, unique content.
