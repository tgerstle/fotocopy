# Phase 6.3: "Dumb" UI Components for Stateful Global Data

## Objective

To handle components that rely on active application state (e.g., Search Results, Live Carts, Dynamic Recent Posts). The visual architecture can be entirely migrated by the AI, but the state must be securely decoupled for manual CMS integration later.

## 1. Architectural Design

The LLM operates on a "Frontend-First" constraint. When confronted with a "Search" block, it is explicitly prompted to decouple the dummy search results from the structural `SearchContainer.tsx`. The output is a pure React component relying solely on props.

## 2. Scaffold Output Expectations

### Simulated LLM Component Generation

When the AI parses a grid of search results, it generates:

```tsx
// packages/sandbox/src/components/generated/GlobalSearchGrid.tsx

interface SearchGridProps {
  queryTerm?: string;
  results: Array<{
    id: string;
    title: string;
    excerpt: string;
    permalink: string;
  }>;
}

export const GlobalSearchGrid = ({ queryTerm, results }: SearchGridProps) => {
  return (
    <section className="w-full max-w-7xl mx-auto py-12">
      {queryTerm && (
        <h2 className="text-2xl mb-6">Results for "{queryTerm}"</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {results.map((item) => (
          <a
            key={item.id}
            href={item.permalink}
            className="border p-4 rounded shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-bold text-lg">{item.title}</h3>
            <p className="text-sm mt-2">{item.excerpt}</p>
          </a>
        ))}
      </div>
    </section>
  );
};
```

### Storybook Validation

The AI also provides the `.stories.tsx` to instantly prove the layout works gracefully.

```tsx
// packages/sandbox/src/components/generated/GlobalSearchGrid.stories.tsx
import { GlobalSearchGrid } from "./GlobalSearchGrid";

export default { component: GlobalSearchGrid };

export const Default = {
  args: {
    queryTerm: "Migration",
    results: [
      {
        id: "1",
        title: "How to Migrate",
        excerpt: "Details...",
        permalink: "/mig",
      },
      { id: "2", title: "API Specs", excerpt: "Specs...", permalink: "/api" },
    ],
  },
};
```

## 3. React Container Components (Phase 7 Pre-requisite)

These dumb components are designed to be wrapped by a human in Phase 7. The pipeline takes no responsibility for database fetching logic.

```tsx
// Example of Future Implementation (Not auto-generated)
export default async function SearchWrapper() {
  const liveResults = await fetchLiveCMS("/api/search"); // Human written
  return <GlobalSearchGrid results={liveResults} />; // Pipeline generated
}
```

## 4. Testing & Regression Strategy

### AST & Typescript Checks (`dumb_components.test.ts`)

- **Prop Extraction Regex Validation:** After the AI writes the `.tsx` file, run an AST parser over the file.
- **Assertion:** Verify it exports an interface containing `Props` and does not contain hardcoded fetch requests or `window.location` logic. This tests the prompt adherence of the generator model.
