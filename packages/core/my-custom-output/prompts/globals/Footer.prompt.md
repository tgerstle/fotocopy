# Context

You are building a Next.js Server Component that acts as a global UI Singleton Shell block for Payload CMS.
The target block is: `Footer`

### Reference Footprint HTML
```html
Appearance: 100%
Preview: <FOOTER class="aa-footer csx-footer footer"><DIV class="container"><P></P></DIV></FOOTER>...
```

### Reference Footprint HTML
```html
Appearance: 100%
Preview: <FOOTER class="aa-footer csx-footer footer"><DIV class="container"><P></P></DIV></FOOTER>...
```

# Architecture

Since this is a Singleton Shell block (like a Header, Footer, or Navigation), it MUST accept `children?: React.ReactNode` as it will wrap page elements inside Next.js layouts.

# Design System

Use Tailwind CSS classes exclusively. Here are the W3C Design Tokens extracted from the site:
```json
{
  "color": {
    "primary": {
      "$value": "rgb(61, 61, 68)",
      "$type": "color"
    },
    "background": {
      "$value": "rgba(0, 0, 0, 0)",
      "$type": "color"
    },
    "container-width": {
      "$value": "calc(100% - 20px)",
      "$type": "color"
    },
    "color-white": {
      "$value": "#f3f3f5",
      "$type": "color"
    },
    "color-black": {
      "$value": "#3d3d44",
      "$type": "color"
    },
    "color-bluegray": {
      "$value": "#707FB7",
      "$type": "color"
    },
    "color-skyblue": {
      "$value": "#4098E8",
      "$type": "color"
    },
    "color-bluepurple": {
      "$value": "#6D6698",
      "$type": "color"
    },
    "color-bluedark": {
      "$value": "#2F345F",
      "$type": "color"
    },
    "color-light": {
      "$value": "var(--color-white)",
      "$type": "color"
    },
    "color-light-accent": {
      "$value": "var(--color-bluegray)",
      "$type": "color"
    },
    "color-main": {
      "$value": "var(--color-skyblue)",
      "$type": "color"
    },
    "color-dark": {
      "$value": "var(--color-bluepurple)",
      "$type": "color"
    },
    "color-dark-accent": {
      "$value": "var(--color-bluedark)",
      "$type": "color"
    },
    "system-ui": {
      "$value": "system-ui, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\"",
      "$type": "color"
    },
    "pagefind-ui-scale": {
      "$value": ".8",
      "$type": "color"
    },
    "pagefind-ui-primary": {
      "$value": "#393939",
      "$type": "color"
    },
    "pagefind-ui-background": {
      "$value": "#ffffff",
      "$type": "color"
    },
    "pagefind-ui-border": {
      "$value": "#eeeeee",
      "$type": "color"
    },
    "pagefind-ui-tag": {
      "$value": "#eeeeee",
      "$type": "color"
    },
    "pagefind-ui-border-width": {
      "$value": "2px",
      "$type": "color"
    },
    "pagefind-ui-border-radius": {
      "$value": "8px",
      "$type": "color"
    },
    "pagefind-ui-image-border-radius": {
      "$value": "8px",
      "$type": "color"
    },
    "pagefind-ui-image-box-ratio": {
      "$value": "3 / 2",
      "$type": "color"
    },
    "nav-color-white": {
      "$value": "#ffffff",
      "$type": "color"
    },
    "nav-color-black": {
      "$value": "var(--color-black,#000000)",
      "$type": "color"
    },
    "navWidth": {
      "$value": "calc(100% - 40px)",
      "$type": "color"
    },
    "navXPadding": {
      "$value": "calc(50% - (var(--navWidth) / 2))",
      "$type": "color"
    },
    "weight-bold": {
      "$value": "700",
      "$type": "color"
    },
    "navBgColor": {
      "$value": "var(--nav-color-white)",
      "$type": "color"
    }
  },
  "fontFamily": {
    "pagefind-ui-text": {
      "$value": "#393939",
      "$type": "fontFamily"
    },
    "pagefind-ui-font": {
      "$value": "system, -apple-system, \"BlinkMacSystemFont\", \".SFNSText-Regular\", \"San Francisco\", \"Roboto\", \"Segoe UI\", \"Helvetica Neue\", \"Lucida Grande\", \"Ubuntu\", \"arial\", sans-serif",
      "$type": "fontFamily"
    }
  }
}
```

# Layout Best Practices (Skills)
- Global layout components like Navigations and Footers must be absolute semantics: `<nav>`, `<header>`, `<footer>`.
- Design for Accessibility (A11y): Include "Skip to Content" links where applicable, ensure contrast.
- Ensure the `children` prop is safely wrapped in a primary layout container (e.g., `<main>`).
- Use the `lucide-react` library for icons if standard icons are missing or required.

# Instructions

1. Output exactly two Markdown code blocks.
2. In the first code block, output `Footer.tsx`. Do not use client hooks (`useState`, `useEffect`) unless explicitly necessary for mobile menus or interactions. Incorporate the `children` prop properly where appropriate.
3. In the second code block, output a perfectly valid Storybook stories file named `Footer.stories.tsx`. Include realistic mock data fitting your inferred schema for the `args` so it renders richly in isolation. Handle the `children` prop with dummy semantic HTML content in the story.
4. Style the component matching standard modern UI practices, using the W3C tokens provided.
5. STRICT TAILWIND RULE: DO NOT use arbitrary hex codes or hardcoded colors like `bg-[#2F345F]`. You MUST USE semantic Tailwind variables mapped to the tokens provided above (e.g. `bg-[var(--color-bluedark)]`). Your output must be fully themeable.
