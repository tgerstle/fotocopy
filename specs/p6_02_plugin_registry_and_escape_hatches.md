# Phase 6.2: Plugin Registry & Application Escape Hatches

## Objective

To prevent the automated pipeline from crashing on highly complex, un-renderable third-party widgets and bespoke interactive scripts.

## 1. Architectural Design

The LLM instructions (in `global_prompt_generator.ts`) are extended with explicit "Escape Hatch" clauses. If the LLM identifies a known integration or an impossible layout (like `<canvas>`), it yields a manual tag instead of hallucinating code. We configure known plugins inside the primary static config.

## 2. Types & Config Update

```typescript
// fotocopy.config.ts addition
export const fotocopyConfig = {
  // ...
  plugins: [
    { matcher: "iframe[src*='youtube.com']", tag: "PLUGIN:YOUTUBE" },
    { matcher: "form.hubspot-form", tag: "PLUGIN:HUBSPOT" },
  ],
};
```

### The LLM Output Scheme

```json
{
  "inferredBlockType": "EXT_PLUGIN_YOUTUBE",
  "data": {
    "url": "https://youtube.com/embed/12345"
  }
}
```

Or for an unknown complex widget:

```json
{
  "inferredBlockType": "MANUAL_INTERVENTION",
  "data": {
    "reason": "Contains complex WebGL canvas interaction",
    "originalNodeId": "id-593"
  }
}
```

## 3. Scaffold Generating Placeholders

When generating `.tsx` files, if the Pipeline recognizes `MANUAL_INTERVENTION`, it outputs a high-visibility placeholder that compiles flawlessly but clearly indicates missing logic.

```tsx
// packages/sandbox/src/components/generated/ManualWidgetPlaceholder.tsx
export const ManualWidgetPlaceholder = ({ reason, originalNodeId }: any) => {
  return (
    <div className="border-4 border-red-500 bg-red-100 p-8 my-4 text-red-900 rounded">
      <h2 className="text-2xl font-black">Manual Migration Required</h2>
      <p>
        <strong>Reason:</strong> {reason}
      </p>
      <p>
        <strong>Node Ref:</strong> {originalNodeId}
      </p>
    </div>
  );
};
```

## 4. Testing & Regression Strategy

### Integration Tests (`escape_hatches.test.ts`)

- **Plugin Matching Test:** Feed an HTML chunk containing a `<iframe src="https://youtube.com...">` to the orchestrator.
- **Assertion:** Verify it maps correctly to `PLUGIN:YOUTUBE` in the JSON blueprint without interacting with the LLM.
- **Placeholder Scaffold Test:** Pass a mock `MANUAL_INTERVENTION` JSON object to the component generator. Verify the React Storybook compiler yields the red warning box without throwing React compile errors.
