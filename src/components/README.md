# Components

Each `.html` file here is a reusable HTML partial. Pages include them with `{{> name }}` syntax (no extension), resolved at build time by `build.mjs`.

## Available components

| File                | Purpose                                                                                          |
|---------------------|--------------------------------------------------------------------------------------------------|
| `skip-link.html`    | First child of `<body>`. A11y skip-to-content target.                                            |
| `header.html`       | Site header: brand SVG, primary nav with mega-dropdowns, CTA, mobile toggle button.              |
| `mobile-drawer.html`| Off-canvas mobile menu. Opens via the `.nav-toggle` button in `header.html`.                     |
| `plan-finder.html`  | Two-question chip selector + live recommendation card. JS in `src/scripts/main.js`.              |
| `footer.html`       | Five-column footer nav, giant `m2m one` wordmark, copyright, social icons.                       |

## Conventions

- **Strip the `<!-- ... -->` documentation comment at the top.** The build automatically removes the first HTML comment from each component before inlining.
- **Self-contained.** A component should not depend on markup that lives in another component or in the page wrapping it. The exception is `header.html` and `mobile-drawer.html`, which share state via classes and ARIA attributes - keep them in sync.
- **No `<head>` or `<body>` tags.** Components are inserted into the layout, not wrapped by it.
- **No data attributes that conflict with the JS bindings in `src/scripts/main.js`.** If you add new interactivity, add the corresponding section to `main.js`.

## Adding a new component

1. Create `src/components/your-component.html`.
2. Optional: add a leading `<!-- ... -->` comment describing what it is and where it is used.
3. Include it from any page with `{{> your-component }}`.
4. Add styles to `src/styles/styles.css` (or `tokens.css` if you are introducing new tokens).
5. Add behaviour to `src/scripts/main.js` if needed.
