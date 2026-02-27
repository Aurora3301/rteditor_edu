# Phase 1: Core Foundation — Learning Analysis for Junior Developers

> **Purpose:** Educational breakdown of what a junior developer learns by building Phase 1 of the RTE project.
> **Audience:** Junior developers, mentors, technical educators
> **Date:** 2026-02-27

---

## Executive Summary

**Phase 1 is a HARD but EXCELLENT learning project.** It teaches production-grade patterns across 7 technical domains. A junior with 6-12 months of JavaScript experience will struggle initially but emerge with senior-level understanding of editor architecture, state management, and plugin systems.

**Time estimate:** 40-60 hours for a junior (vs 15-20 hours for a senior)
**Difficulty:** 7/10 overall (ranges from 3/10 to 9/10 per task)
**Prerequisite knowledge:** JavaScript ES6+, basic TypeScript, Vue 3 Composition API, npm/build tools

---

## 1. Skills Map — What You Learn by Building Phase 1

### 1.1 JavaScript/TypeScript Fundamentals

| Skill | Where You Learn It | Difficulty |
|-------|-------------------|------------|
| **TypeScript interfaces & generics** | `types/index.ts`, all function signatures | Medium |
| **Module system (ESM)** | Every `import`/`export`, understanding `index.ts` re-exports | Easy |
| **Closures & higher-order functions** | `buildKeymap()`, `createPlugins()` — functions that return functions | Medium |
| **Object destructuring** | Props, state access (`const { from, to } = state.selection`) | Easy |
| **Immutability patterns** | ProseMirror transactions (never mutate `state.doc` directly) | Hard |
| **Type narrowing & guards** | Checking `node.type === schema.nodes.heading` | Medium |
| **Regex for parsing** | Input rules (`/^#\s$/` for headings) | Medium |

### 1.2 Vue 3 Patterns

| Skill | Where You Learn It | Difficulty |
|-------|-------------------|------------|
| **Composition API** | `useEditor.ts` composable | Medium |
| **Reactive refs vs shallowRef** | Why `shallowRef` for EditorView (avoid deep reactivity on non-Vue objects) | Hard |
| **Template refs** | `ref="editorRef"` to mount ProseMirror | Easy |
| **Two-way binding (v-model)** | `v-model:html` and `v-model:json` with `update:html` emits | Medium |
| **Lifecycle hooks** | `onMounted`, `onBeforeUnmount` for setup/teardown | Easy |
| **Watch with guards** | Watching props without causing infinite loops | Hard |
| **defineExpose** | Exposing methods from `<script setup>` | Easy |

### 1.3 ProseMirror Concepts (The Hard Part)

| Concept | Where You Learn It | Difficulty |
|---------|-------------------|------------|
| **Schema = document model** | `schema/nodes.ts`, `schema/marks.ts` | Medium |
| **Nodes vs Marks** | Nodes are blocks/atoms, marks are inline formatting | Medium |
| **Content expressions** | `content: 'block+'`, `content: 'inline*'` — what can go where | Hard |
| **parseDOM & toDOM** | Bidirectional HTML ↔ ProseMirror conversion | Hard |
| **EditorState (immutable)** | State never changes — transactions create NEW state | Hard |
| **Transactions** | How to modify content (`tr.replaceWith`, `tr.addMark`) | Hard |
| **Commands** | Functions with signature `(state, dispatch?, view?) => boolean` | Medium |
| **Plugins** | Extending editor behavior (keymap, input rules, decorations) | Hard |
| **Selection & positions** | `$from`, `$to`, `pos` — how cursor position works | Very Hard |
| **DOMParser & DOMSerializer** | Schema-driven HTML parsing | Medium |

### 1.4 Software Architecture Patterns

| Pattern | Where You Learn It | Transferable To |
|---------|-------------------|-----------------|
| **Two-layer architecture** | Core (framework-agnostic) + UI (Vue) separation | Any plugin system |
| **Plugin architecture** | ProseMirror plugins array, ordered execution | Webpack, Vite, Rollup, Express middleware |
| **Factory functions** | `buildKeymap(schema)`, `createPlugins(options)` | Dependency injection, testability |
| **Immutable state + reducers** | EditorState + transactions | Redux, Zustand, any state management |
| **Command pattern** | All commands in `commands/formatting.ts` | Undo/redo systems, macro recording |
| **Serialization/deserialization** | HTML ↔ JSON ↔ ProseMirror Node | API design, data persistence |
| **Separation of concerns** | Schema (data) / Commands (logic) / View (UI) | MVC, Clean Architecture |

### 1.5 CSS/Design System

| Skill | Where You Learn It | Difficulty |
|-------|-------------------|------------|
| **CSS custom properties (variables)** | `tokens/*.css` — design tokens pattern | Easy |
| **BEM-like naming** | `.rte-toolbar__button--active` | Easy |
| **Scoped styling** | `.rte-editor .ProseMirror p` — namespace to avoid global pollution | Easy |
| **Modular CSS architecture** | 7 layers (tokens → base → components → content → themes → responsive) | Medium |
| **Semantic HTML** | `<strong>`, `<em>`, `<blockquote>` instead of `<span class="bold">` | Easy |
| **Accessibility (ARIA)** | `role="toolbar"`, `aria-label`, `aria-pressed` | Medium |

### 1.6 Build Tooling

| Skill | Where You Learn It | Difficulty |
|-------|-------------------|------------|
| **Vite library mode** | `vite.config.ts` — building ESM + CJS bundles | Medium |
| **TypeScript declaration generation** | `vite-plugin-dts` — producing `.d.ts` files | Easy |
| **Package.json exports field** | Modern dual-format package publishing | Medium |
| **Peer dependencies** | Why Vue is `peerDependencies` not `dependencies` | Medium |
| **Tree-shaking** | Why we mark CSS as `sideEffects` | Hard |

### 1.7 General Engineering Practices

| Practice | Where You Learn It | Difficulty |
|----------|-------------------|------------|
| **Reading documentation** | ProseMirror docs are dense — you MUST learn to read API docs | Hard |
| **Debugging complex state** | EditorState is opaque — learn to use `console.log(state.doc.toJSON())` | Medium |
| **Type-driven development** | TypeScript forces you to understand data shapes before coding | Medium |
| **Incremental building** | Start with minimal schema, add features one by one | Easy |
| **Testing strategy** | Unit tests for commands, integration tests for plugins | Medium |

---

## 2. Concept-by-Task Mapping — What Each Task Teaches

### Task 1: Project Setup (package.json, tsconfig.json, vite.config.ts)

**Concepts learned:**
- npm package structure for libraries (vs applications)
- Difference between `dependencies`, `devDependencies`, `peerDependencies`
- TypeScript compiler options (`strict`, `declaration`, `moduleResolution: bundler`)
- Vite library mode configuration (ESM + CJS output)
- Build tool plugin system (`@vitejs/plugin-vue`, `vite-plugin-dts`)

**Difficulty:** Easy (3/10) — mostly copy-paste with understanding

**Common mistakes:**
- Forgetting to mark Vue as `peerDependencies` → bloats bundle
- Wrong `tsconfig.json` paths → import errors
- Missing `sideEffects: ["**/*.css"]` → CSS gets tree-shaken away

---

### Task 2: Schema — Nodes (C.1 schema/nodes.ts)

**Concepts learned:**
- ProseMirror `NodeSpec` structure
- Content expressions (`block+`, `inline*`, `paragraph block*`)
- `parseDOM` rules — how to parse HTML into ProseMirror nodes
- `toDOM` rules — how to serialize nodes back to HTML
- Node attributes (`level` for heading, `start` for ordered_list, `textAlign` for paragraph)
- `getAttrs` functions in parseDOM (extracting data from DOM)

**Difficulty:** Hard (7/10) — this is where juniors hit the first wall

**Why it's hard:**
- Content expressions are a mini-language you've never seen before
- `parseDOM` is an array of rules with priority — order matters
- `getAttrs` returns `null` (match) or `false` (no match) — counterintuitive
- Understanding what `0` means in `toDOM` (hole for child content)

**Common mistakes:**
- Wrong content expression → "Invalid content for node" errors at runtime
- Forgetting `{ tag: 'li' }` parseDOM for `list_item` → pasted lists break
- Not handling `textAlign` attribute → loses alignment on paste
- Confusing `group: 'block'` with `content: 'block+'`

**Learning wall:** Understanding the relationship between `content`, `group`, and parent-child constraints. Junior will need to re-read ProseMirror schema guide 3-4 times.

---

### Task 3: Schema — Marks (C.2 schema/marks.ts)

**Concepts learned:**
- ProseMirror `MarkSpec` structure
- Difference between nodes (structural) and marks (formatting)
- `excludes` property (why `code` mark excludes all other marks)
- Parsing multiple HTML representations of the same mark (e.g., `<strong>`, `<b>`, `font-weight: bold`)
- CSS style parsing in `parseDOM` (`style: 'font-weight=bold'`)

**Difficulty:** Medium (5/10) — easier than nodes because marks are simpler

**Common mistakes:**
- Forgetting `excludes: '_'` on `code` mark → bold code is possible (weird UX)
- Not handling `<b>` tag → pasted Word content loses bold
- Wrong regex in `getAttrs` for font-weight → doesn't parse `font-weight: 700`

---

### Task 4: Schema Assembly (C.3 schema/index.ts)

**Concepts learned:**
- How to instantiate a ProseMirror `Schema`
- Re-exporting for clean API design

**Difficulty:** Easy (2/10) — just glue code

**Common mistakes:**
- Forgetting to include `text` node in `nodes` object → "Unknown node type 'text'" error

---

### Task 5: Keymap Plugin (C.4 plugins/keymap.ts)

**Concepts learned:**
- ProseMirror command signature: `(state, dispatch?, view?) => boolean`
- `toggleMark` command from `prosemirror-commands`
- `Mod-` prefix (Cmd on Mac, Ctrl on Windows/Linux)
- Plugin ordering (custom keymap before baseKeymap)
- List-specific commands (`splitListItem`, `sinkListItem`, `liftListItem`)
- Custom command implementation (Shift-Enter for hard break)

**Difficulty:** Medium (6/10)

**Why it's tricky:**
- Understanding the `dispatch` parameter — if null, command is just tested (doesn't execute)
- List commands have complex logic (when to indent vs when to exit list)
- `baseKeymap` conflicts — need to understand priority

**Common mistakes:**
- Calling `toggleMark(schema.marks.bold)()` instead of `toggleMark(schema.marks.bold)` — extra parens
- Not returning `true` from custom commands → event propagates, causes double input
- Wrong plugin order → custom shortcuts don't work

---

### Task 6: Input Rules Plugin (C.5 plugins/inputRules.ts)

**Concepts learned:**
- Auto-formatting patterns (Markdown-style shortcuts)
- `textblockTypeInputRule` — converts paragraph to another block type
- `wrappingInputRule` — wraps content in a container node
- Custom `InputRule` for horizontal rule
- Regex patterns for text matching

**Difficulty:** Medium (5/10)

**Common mistakes:**
- Regex doesn't match because of missing `$` anchor → triggers mid-word
- Horizontal rule rule doesn't add paragraph after → cursor gets stuck
- Ordered list rule doesn't capture starting number → always starts at 1

---

### Task 7: Placeholder Plugin (C.6 plugins/placeholder.ts)

**Concepts learned:**
- ProseMirror `Plugin` class with state fields
- `Decoration` system (adding visual elements without changing document)
- `DecorationSet` — efficient decoration management
- Checking document emptiness (exactly one empty paragraph)
- CSS `::before` pseudo-element with `data-*` attributes

**Difficulty:** Hard (7/10) — first time writing a custom plugin from scratch

**Why it's hard:**
- Understanding the plugin lifecycle (`state.init`, `state.apply`)
- Decoration API is abstract — "what's a decoration vs a node?"
- Efficiently checking if doc is empty (can't just check `doc.textContent === ''` — what about nested blocks?)

**Common mistakes:**
- Creating new DecorationSet on every transaction → performance issue
- Decoration range is wrong → placeholder appears in wrong place
- Not returning `DecorationSet.empty` when not empty → placeholder persists

**Learning wall:** Understanding that decorations are VIEW-ONLY (don't affect document state). This is a key ProseMirror concept.

---

### Task 8: Formatting Commands (C.7 commands/formatting.ts)

**Concepts learned:**
- Implementing ProseMirror commands
- `setBlockType` command (paragraph ↔ heading)
- `wrapIn` and `lift` commands (blockquote, lists)
- `wrapInList` from `prosemirror-schema-list`
- Checking current block type to toggle (if already heading, convert to paragraph)
- Walking up the node tree (`$from.node(-1)`)

**Difficulty:** Medium-Hard (6/10)

**Common mistakes:**
- `toggleBlockquote` doesn't check if already in blockquote → wraps twice
- `toggleBulletList` doesn't handle nested lists → breaks structure
- Not focusing editor after command → user loses cursor position

---

### Task 9: HTML Serializer (C.8 serializers/html.ts)

**Concepts learned:**
- `DOMSerializer.fromSchema()` — automatic serialization from schema's `toDOM`
- `serializeFragment()` — converting ProseMirror content to DOM
- Using temporary DOM elements for string conversion
- `DOMParser.fromSchema()` — parsing HTML into ProseMirror
- Bidirectional conversion (HTML ↔ ProseMirror)

**Difficulty:** Easy-Medium (4/10) — mostly using built-in APIs

**Common mistakes:**
- Forgetting to create temporary `<div>` → no way to get HTML string
- Not handling empty document → returns empty string (should return `<p></p>`)
- Parsing HTML without schema → uses wrong parser

---

### Task 10: JSON Serializer (C.9 serializers/json.ts)

**Concepts learned:**
- ProseMirror's built-in JSON format
- `doc.toJSON()` and `Node.fromJSON(schema, json)`
- Error handling for malformed JSON
- Fallback to empty document on parse failure

**Difficulty:** Easy (3/10) — ProseMirror does the heavy lifting

**Common mistakes:**
- Not wrapping `fromJSON` in try-catch → crashes on bad data
- Forgetting to pass `schema` to `fromJSON` → "Cannot read property 'nodes' of undefined"

---

### Task 11: Plugin Setup (C.10 setup.ts)

**Concepts learned:**
- Plugin ordering matters (keymap priority, history after keymaps)
- Composing multiple plugins into a single array
- `baseKeymap` from `prosemirror-commands`
- `history()`, `dropCursor()`, `gapCursor()` plugins

**Difficulty:** Easy-Medium (4/10)

**Common mistakes:**
- Wrong plugin order → custom shortcuts don't work
- Forgetting `history()` → undo/redo doesn't work
- Not passing `placeholder` option → always shows default text

---

### Task 12: useEditor Composable (D.3 composables/useEditor.ts)

**Concepts learned:**
- Vue Composition API patterns
- `shallowRef` vs `ref` — when to avoid deep reactivity
- `onMounted` / `onBeforeUnmount` lifecycle
- `dispatchTransaction` callback — how ProseMirror updates state
- Wiring ProseMirror to Vue reactivity
- Cleanup on unmount (`view.destroy()`)

**Difficulty:** Hard (8/10) — this is the integration layer, lots of moving parts

**Why it's hard:**
- Understanding why `shallowRef` is needed (deep reactivity on EditorView breaks ProseMirror)
- `dispatchTransaction` is called on EVERY keystroke — must be efficient
- Avoiding infinite loops when syncing external props to editor state
- Properly cleaning up DOM listeners

**Common mistakes:**
- Using `ref` instead of `shallowRef` → Vue tries to make EditorView reactive → crashes
- Not calling `view.destroy()` → memory leak
- Emitting `update:html` on every transaction without debouncing → performance issue
- Watching `html` prop and dispatching transaction → infinite loop

**Learning wall:** Understanding the boundary between Vue's reactivity and ProseMirror's state management. This is the hardest conceptual leap in Phase 1.

---

### Task 13: RTEditor.vue Component (D.1)

**Concepts learned:**
- Vue component with two-way binding (`v-model:html`, `v-model:json`)
- Template refs (`ref="editorRef"`)
- `defineExpose` for public API
- Watching props with guards to prevent loops
- Emitting events (`update:html`, `change`, `focus`, `blur`)
- Conditional rendering based on state

**Difficulty:** Medium (6/10)

**Common mistakes:**
- Not guarding `watch(html)` → infinite loop when typing
- Forgetting to call `view.destroy()` in `onBeforeUnmount` → memory leak
- Not exposing methods via `defineExpose` → parent can't call `focus()`

---

### Task 14: RTToolbar.vue Component (D.2)

**Concepts learned:**
- Reading active state from EditorState (`markType.isInSet(...)`)
- Dispatching commands from UI
- Refocusing editor after toolbar click
- Checking command availability (`undo(state, null)` to test)
- Building a dropdown (heading selector)
- ARIA attributes for accessibility (`role="toolbar"`, `aria-pressed`)

**Difficulty:** Medium-Hard (7/10)

**Why it's hard:**
- Active state detection is different for marks vs block types
- For lists: need to walk up node tree to check if inside list
- Dropdown state management (open/close, keyboard navigation)
- Ensuring toolbar doesn't steal focus permanently

**Common mistakes:**
- Not refocusing editor after button click → user has to click editor to continue typing
- Active state check is wrong → button shows active when it shouldn't
- Dropdown doesn't close when clicking outside → UX bug
- Not disabling undo/redo buttons when unavailable → confusing UX

---

### Task 15: Types (D.4 types/index.ts)

**Concepts learned:**
- TypeScript interface design
- Re-exporting types from dependencies
- Documenting public API with types

**Difficulty:** Easy (2/10)

**Common mistakes:**
- Not re-exporting ProseMirror types → consumers have to import from `prosemirror-*` directly

---

### Task 16: Main Entry Point (src/index.ts)

**Concepts learned:**
- Barrel exports (re-exporting from multiple modules)
- Public API design (what to expose vs keep internal)
- Tree-shaking considerations

**Difficulty:** Easy (2/10)

**Common mistakes:**
- Exporting internal utilities → pollutes public API
- Not exporting types → TypeScript users can't type their code

---

### Task 17: Demo App (demo/App.vue, demo/main.ts)

**Concepts learned:**
- How to consume your own library
- Importing CSS separately (`import 'rte-v3/style.css'`)
- Two-way binding with `v-model`
- Debugging with HTML/JSON output display

**Difficulty:** Easy (3/10)

**Common mistakes:**
- Forgetting to import CSS → editor has no styles
- Not using `v-model:html` and `v-model:json` → one-way binding only

---

### Task 18: Vite Build Configuration (vite.config.ts)

**Concepts learned:**
- Library mode vs app mode in Vite
- Externalizing peer dependencies
- Generating multiple output formats (ESM + CJS)
- CSS extraction and bundling
- TypeScript declaration generation with `vite-plugin-dts`

**Difficulty:** Medium (5/10)

**Common mistakes:**
- Not externalizing Vue → bundle includes Vue (huge size increase)
- Wrong `fileName` function → output files have wrong names
- Not setting `rollupTypes: true` in dts plugin → generates separate `.d.ts` per file instead of rolled-up single file

---

### Task 19: Package.json Exports (package.json)

**Concepts learned:**
- Modern `exports` field (vs legacy `main`/`module`)
- Dual-format publishing (ESM + CJS)
- Exporting CSS separately (`"./style.css"`)
- `sideEffects` field for tree-shaking
- `files` field to control what gets published

**Difficulty:** Medium (5/10)

**Common mistakes:**
- Not including `"./style.css"` in exports → consumers can't import CSS
- Wrong `sideEffects` → CSS gets tree-shaken away in production builds
- Not setting `"files": ["dist"]` → publishes source code and node_modules

---

## 3. Difficulty Curve — Task-by-Task Ratings

| Task # | Task Name | Difficulty | Time (Junior) | Learning Wall? |
|--------|-----------|------------|---------------|----------------|
| 1 | Project setup | 3/10 | 2h | No |
| 2 | Schema nodes | **7/10** | 6h | **YES** — content expressions |
| 3 | Schema marks | 5/10 | 3h | No |
| 4 | Schema assembly | 2/10 | 0.5h | No |
| 5 | Keymap plugin | 6/10 | 4h | No |
| 6 | Input rules | 5/10 | 3h | No |
| 7 | Placeholder plugin | **7/10** | 5h | **YES** — decorations |
| 8 | Formatting commands | 6/10 | 4h | No |
| 9 | HTML serializer | 4/10 | 2h | No |
| 10 | JSON serializer | 3/10 | 1h | No |
| 11 | Plugin setup | 4/10 | 1h | No |
| 12 | useEditor composable | **8/10** | 8h | **YES** — Vue ↔ ProseMirror integration |
| 13 | RTEditor.vue | 6/10 | 4h | No |
| 14 | RTToolbar.vue | 7/10 | 6h | No |
| 15 | Types | 2/10 | 1h | No |
| 16 | Main entry | 2/10 | 0.5h | No |
| 17 | Demo app | 3/10 | 2h | No |
| 18 | Vite config | 5/10 | 3h | No |
| 19 | Package.json | 5/10 | 2h | No |

**Total estimated time:** 57.5 hours for a junior developer

**Learning walls (where juniors get stuck for hours):**
1. **Task 2 (Schema nodes)** — Content expressions and parseDOM/toDOM rules
2. **Task 7 (Placeholder plugin)** — Understanding decorations
3. **Task 12 (useEditor composable)** — Integrating ProseMirror with Vue reactivity

---

## 4. Real-World Patterns — Transferable Knowledge

### 4.1 Plugin Architecture (Highly Transferable)

**What you learn:**
- Plugins are ordered functions that extend core behavior
- Each plugin is isolated but can communicate via shared state
- Priority matters (first plugin gets first chance to handle events)

**Where this pattern appears:**
- **Webpack/Vite/Rollup:** Build plugins work exactly the same way
- **Express.js:** Middleware is the same pattern (ordered, next() to pass control)
- **Babel/ESLint:** Transform plugins
- **WordPress:** Action/filter hooks
- **VS Code:** Extension API

**Key insight:** Plugin architecture is THE pattern for extensible systems. Master it here, use it everywhere.

---

### 4.2 Immutable State + Transactions (Redux/Zustand Pattern)

**What you learn:**
- State is never mutated directly
- Changes are described as transactions/actions
- New state is derived from old state + transaction
- Time-travel debugging (undo/redo) comes for free

**Where this pattern appears:**
- **Redux:** `(state, action) => newState`
- **Zustand:** Immutable updates
- **React useState:** `setState` doesn't mutate
- **Git:** Commits are immutable, branches are pointers
- **Event sourcing:** Store events, derive state

**Key insight:** Immutability makes complex state manageable. ProseMirror's transaction system is a masterclass in this pattern.

---

### 4.3 Command Pattern (Undo/Redo, Macros)

**What you learn:**
- Commands are objects/functions that encapsulate actions
- Commands return `true` (success) or `false` (can't execute)
- Commands can be tested without executing (`dispatch = null`)
- Commands can be composed (run multiple commands in sequence)

**Where this pattern appears:**
- **Game engines:** Input handling, replay systems
- **Photo editors:** Every tool is a command
- **Databases:** Transactions
- **CLI tools:** Every subcommand is a command object

**Key insight:** Commands make actions first-class citizens. You can store them, test them, replay them.

---

### 4.4 Schema-Driven Parsing (Declarative Data Transformation)

**What you learn:**
- Define data structure once (schema)
- Parsing and serialization are automatic (driven by schema)
- Invalid data is rejected at parse time
- Schema is the single source of truth

**Where this pattern appears:**
- **GraphQL:** Schema defines API, validation is automatic
- **JSON Schema / Zod / Yup:** Validation libraries
- **ORMs (Prisma, TypeORM):** Schema defines DB structure and queries
- **Protocol Buffers / Avro:** Binary serialization

**Key insight:** Declarative schemas are more maintainable than imperative parsing code.

---

### 4.5 Two-Layer Architecture (Framework-Agnostic Core)

**What you learn:**
- Layer 1: Pure TypeScript, no framework dependencies
- Layer 2: Framework-specific UI (Vue components)
- Core logic is testable without mounting components
- Can swap UI layer (Vue → React) without rewriting core

**Where this pattern appears:**
- **Headless UI libraries:** Radix, Headless UI, Downshift
- **Game engines:** Engine core + renderer
- **Compilers:** Parser/AST (core) + code generator (output-specific)
- **Any plugin system:** Core API + framework adapters

**Key insight:** Separating core logic from UI makes code reusable and testable.

---

### 4.6 Factory Functions (Dependency Injection)

**What you learn:**
- Functions that return configured objects
- Dependencies are passed as parameters (not imported globally)
- Makes code testable (can inject mocks)

**Example from Phase 1:**
```typescript
function buildKeymap(schema: Schema): Plugin {
  // schema is injected, not imported
  return keymap({
    'Mod-b': toggleMark(schema.marks.bold)
  })
}
```

**Where this pattern appears:**
- **React hooks:** `useEffect`, `useMemo` — functions that return configured behavior
- **Dependency injection frameworks:** NestJS, Angular
- **Testing:** Injecting mocks instead of real dependencies

**Key insight:** Dependency injection via parameters is simpler than DI frameworks for most cases.

---

### 4.7 Separation of Concerns (Schema / Commands / View)

**What you learn:**
- **Schema** = data structure (what CAN exist)
- **Commands** = business logic (what you can DO)
- **View** = presentation (how it LOOKS)
- Each layer has a single responsibility

**Where this pattern appears:**
- **MVC architecture:** Model / Controller / View
- **Clean Architecture:** Entities / Use Cases / Adapters
- **Hexagonal Architecture:** Domain / Ports / Adapters

**Key insight:** Separation of concerns is not about folders, it's about dependencies. Schema doesn't know about View. Commands don't know about Vue.

---

## 5. Common Mistakes — What to Watch Out For

### 5.1 Schema Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong content expression | "Invalid content for node paragraph" error | Check parent's `content` allows this node's `group` |
| Missing `text` node | "Unknown node type 'text'" | Always include `text: { group: 'inline' }` in nodes |
| `parseDOM` returns `false` instead of `null` | Pasted content is stripped | `getAttrs` should return `null` to match, `false` to reject |
| `toDOM` missing `0` for content hole | Node renders but children disappear | `toDOM: ['p', 0]` — the `0` is where children go |
| Forgetting `group: 'block'` | Node can't be inserted | Nodes need a group to be referenced in content expressions |

### 5.2 State Management Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Mutating `state.doc` directly | Crashes or silent corruption | NEVER mutate. Always use transactions: `state.tr.replaceWith(...)` |
| Using `ref` instead of `shallowRef` for EditorView | Vue crashes with "Maximum call stack exceeded" | Use `shallowRef` for non-Vue objects |
| Not calling `view.destroy()` | Memory leak, event listeners persist | Always destroy in `onBeforeUnmount` |
| Infinite loop in `watch(html)` | Browser freezes | Guard with flag: `if (isInternalUpdate) return` |

### 5.3 Command Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Not returning `true` from command | Event propagates, causes double input | Always `return true` if command executes |
| Calling command with wrong signature | Command doesn't execute | Signature is `(state, dispatch?, view?) => boolean` |
| Not checking if mark/node exists in schema | Crashes when schema changes | Defensive: `if (!schema.marks.bold) return false` |

### 5.4 Plugin Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Wrong plugin order | Custom shortcuts don't work | Custom keymap BEFORE baseKeymap |
| Creating new DecorationSet every transaction | Performance degrades | Only create new set when decorations actually change |
| Plugin state not serializable | Can't save/restore editor state | Plugin state must be JSON-serializable |

### 5.5 Build/Config Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Not externalizing Vue | Bundle is 500KB+ | `rollupOptions.external: ['vue']` |
| Missing `sideEffects: ["**/*.css"]` | CSS missing in production | Add to package.json |
| Wrong `exports` field | Import fails in some environments | Test with both ESM and CJS consumers |
| Not generating `.d.ts` | TypeScript users get no autocomplete | Use `vite-plugin-dts` |

### 5.6 CSS Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Not scoping styles | Styles leak to host app | Prefix all selectors with `.rte-editor` |
| Using `!important` | Styles can't be overridden | Use specificity instead |
| Hardcoding colors | Can't theme | Use CSS custom properties |

---

## 6. Learning Path Recommendation

### 6.1 Prerequisites (Study BEFORE starting Phase 1)

**Must have:**
1. **JavaScript ES6+** (2-3 months experience)
   - Arrow functions, destructuring, spread operator
   - Promises, async/await
   - Array methods (map, filter, reduce)
   - Modules (import/export)

2. **TypeScript basics** (1 month experience)
   - Type annotations (`: string`, `: number`)
   - Interfaces and types
   - Generics (basic understanding)
   - Union types (`string | null`)

3. **Vue 3 Composition API** (1 month experience)
   - `ref`, `reactive`, `computed`
   - `onMounted`, `onBeforeUnmount`
   - Template refs
   - Basic component props and emits

4. **npm and build tools** (basic familiarity)
   - Installing packages
   - Running scripts (`npm run dev`, `npm run build`)
   - Understanding `package.json`

**Nice to have:**
- CSS custom properties (CSS variables)
- Regex basics
- Git basics

### 6.2 Study Order (Before Coding)

**Week 1: ProseMirror Fundamentals**
1. Read [ProseMirror Guide](https://prosemirror.net/docs/guide/) — Introduction, Document, State, View (4 hours)
2. Read [Schema Guide](https://prosemirror.net/docs/guide/#schema) — understand nodes, marks, content expressions (3 hours)
3. Play with [ProseMirror examples](https://prosemirror.net/examples/) — basic editor, schema (2 hours)
4. Read [Commands Guide](https://prosemirror.net/docs/guide/#commands) (2 hours)

**Week 2: Deep Dive**
1. Read [Transform Guide](https://prosemirror.net/docs/guide/#transform) — transactions, steps (3 hours)
2. Read [Plugin Guide](https://prosemirror.net/docs/guide/#state.plugins) (3 hours)
3. Study `prosemirror-schema-basic` source code — see how nodes/marks are defined (2 hours)
4. Study `prosemirror-commands` source code — see how commands are implemented (2 hours)

**Total study time before coding:** ~20 hours

**Why this matters:** ProseMirror docs are dense. Reading them BEFORE coding saves 20+ hours of debugging later.

---

### 6.3 Coding Order (Task Sequence)

**Phase A: Foundation (No UI)**
1. Task 1: Project setup
2. Task 4: Schema assembly (empty schema first)
3. Task 2: Schema nodes (add one node at a time: doc → paragraph → text)
4. Task 3: Schema marks (add bold only first)
5. Task 9: HTML serializer (test with minimal schema)
6. Task 10: JSON serializer

**Checkpoint:** Can create a schema, parse HTML, serialize to JSON. No UI yet.

---

**Phase B: Core Plugins**
7. Task 11: Plugin setup (just baseKeymap + history first)
8. Task 5: Keymap (add bold shortcut only)
9. Task 6: Input rules (add heading rule only)
10. Task 7: Placeholder plugin

**Checkpoint:** Have a working editor with keyboard shortcuts. Still no Vue UI.

---

**Phase C: Vue Integration**
11. Task 12: useEditor composable (hardest task — budget 8 hours)
12. Task 13: RTEditor.vue (minimal version — just mount editor)
13. Task 17: Demo app (test that it works)

**Checkpoint:** Can see the editor in a browser. No toolbar yet.

---

**Phase D: UI**
14. Task 14: RTToolbar.vue (add buttons one at a time)
15. Task 15: Types
16. Task 16: Main entry point

**Checkpoint:** Full working editor with toolbar.

---

**Phase E: Build**
17. Task 18: Vite config
18. Task 19: Package.json exports
19. Test build output (`npm run build`, inspect `dist/`)

**Checkpoint:** Publishable npm package.

---

**Phase F: Expand Schema**
20. Go back to Task 2/3: Add remaining nodes (heading levels 2-3, blockquote, lists, hr, hard_break)
21. Go back to Task 3: Add remaining marks (italic, underline, strike, code)
22. Go back to Task 5: Add remaining keyboard shortcuts
23. Go back to Task 6: Add remaining input rules
24. Go back to Task 8: Add remaining commands
25. Go back to Task 14: Add remaining toolbar buttons

**Final checkpoint:** Phase 1 complete.

---

### 6.4 Mentoring Strategy

**If you're mentoring a junior through this project:**

**Week 1-2: Study phase**
- Assign ProseMirror reading
- Quiz them on: "What's the difference between a node and a mark?" "What's a content expression?"
- Have them explain back to you how transactions work

**Week 3-4: Foundation (Phase A)**
- Pair program on schema nodes (you drive, they navigate)
- Let them implement marks alone (with you available for questions)
- Code review: focus on understanding, not perfection

**Week 5-6: Plugins (Phase B)**
- They implement keymap alone
- You implement placeholder plugin together (it's hard)
- Code review: explain why plugin order matters

**Week 7-8: Vue integration (Phase C)**
- Pair program on useEditor composable (hardest task)
- They implement RTEditor.vue alone
- Code review: focus on reactivity patterns

**Week 9-10: UI and Build (Phase D-E)**
- They implement toolbar alone (with design guidance)
- You review build config together
- Test the package in a separate project

**Week 11-12: Expansion (Phase F)**
- They add remaining features alone
- You're available for questions only
- Final code review and retrospective

**Total mentored time:** 12 weeks (3 months) at ~5 hours/week = 60 hours

---

### 6.5 Self-Study Tips

**If you're learning alone:**

1. **Read error messages carefully.** ProseMirror errors are usually precise. "Invalid content for node paragraph" tells you exactly what's wrong.

2. **Use `console.log(state.doc.toJSON())`** liberally. Inspect the document structure after every change.

3. **Start with the simplest possible schema.** Don't try to implement all nodes at once. Get `doc`, `paragraph`, `text`, `bold` working first.

4. **Test in the browser constantly.** Don't write 100 lines of code before testing. Write 10 lines, refresh browser, see if it works.

5. **Read ProseMirror source code.** The library is well-written. When docs are unclear, read the implementation.

6. **Join the ProseMirror forum.** The community is helpful: https://discuss.prosemirror.net/

7. **Don't skip the study phase.** Trying to code without understanding ProseMirror concepts is like trying to build a house without knowing what a foundation is.

8. **When stuck for >1 hour, ask for help.** Don't waste 4 hours on a problem that someone could explain in 5 minutes.

---

## 7. What Makes This Project Hard (Honest Assessment)

### 7.1 Conceptual Difficulty

**ProseMirror is not like other libraries.** It's not a component library where you import `<RichTextEditor>` and it works. It's a **document model framework** — you define the data structure, and ProseMirror enforces it.

**Key mental shifts required:**

1. **Immutability:** You can't just `doc.appendChild(node)`. You must create a transaction that describes the change.

2. **Schema-first:** You can't insert arbitrary HTML. The schema defines what's allowed. If your schema doesn't have a `<table>` node, you can't paste tables.

3. **Positions are offsets, not DOM nodes:** Position `5` means "5 characters from the start of the document," not "the 5th element."

4. **Marks are sets, not properties:** A character can have multiple marks (`bold + italic + link`). They're not CSS classes.

5. **Plugins are stateful:** Each plugin maintains its own state, updated on every transaction.

**These concepts are foreign to most web developers.** Expect to feel confused for the first 10-20 hours.

---

### 7.2 Documentation Challenges

**ProseMirror docs are excellent but dense.** They're written for experienced developers who understand compiler theory and data structures.

**Example:** The docs say "content expressions use a regular-expression-like syntax." But they don't explain what `block+` means if you've never seen regex quantifiers.

**Workaround:** Read the docs 2-3 times. First pass: skim for concepts. Second pass: read carefully. Third pass: code along with examples.

---

### 7.3 Debugging Difficulty

**ProseMirror errors are precise but cryptic if you don't understand the model.**

**Example error:**
```
Error: Invalid content for node paragraph: <heading>
```

**What it means:** You tried to put a heading inside a paragraph. But `paragraph` has `content: 'inline*'`, and `heading` is in `group: 'block'`. Blocks can't go inside inlines.

**Why it's hard:** You need to understand content expressions, groups, and the node hierarchy to debug this.

**Workaround:** Always `console.log(state.doc.toJSON())` to see the actual document structure.

---

### 7.4 Integration Complexity

**Wiring ProseMirror to Vue is non-trivial.** ProseMirror manages its own DOM. Vue also manages DOM. They can conflict.

**Key challenges:**

1. **Reactivity:** Vue's reactivity system tries to make everything reactive. ProseMirror objects (EditorView, EditorState) must NOT be reactive. Use `shallowRef`.

2. **Lifecycle:** ProseMirror's `EditorView` must be destroyed when the component unmounts. Forgetting this causes memory leaks.

3. **Two-way binding:** Syncing `v-model:html` with editor state without causing infinite loops requires careful guards.

**Why it's hard:** You're integrating two complex systems that weren't designed to work together.

**Workaround:** Follow the `useEditor` composable pattern exactly. Don't try to "improve" it until you understand why it's structured that way.

---

## 8. Success Criteria — How to Know You've Learned It

### 8.1 Knowledge Checks

**After completing Phase 1, you should be able to answer these questions without looking anything up:**

1. What's the difference between a node and a mark?
2. What does `content: 'block+'` mean?
3. Why do we use `shallowRef` for `EditorView` in Vue?
4. What does a ProseMirror command return?
5. What's the difference between `parseDOM` and `toDOM`?
6. Why does plugin order matter?
7. What's a transaction?
8. What's a decoration?
9. Why is `EditorState` immutable?
10. How do you check if bold is active at the cursor?

**If you can answer 8/10, you've learned the core concepts.**

---

### 8.2 Practical Tests

**You should be able to do these tasks without referring to the implementation plan:**

1. Add a new mark (e.g., `superscript`) to the schema
2. Add a keyboard shortcut for that mark
3. Add a toolbar button for that mark
4. Add a new block node (e.g., `callout` box)
5. Write a command that wraps selected text in that block
6. Write an input rule that triggers that block (e.g., `:::` at start of line)
7. Debug why pasted content is being stripped (check schema's parseDOM)
8. Add a new plugin that counts words and displays the count
9. Export the editor state to JSON and reload it
10. Build the package and test it in a separate Vue app

**If you can do 7/10, you're ready for Phase 2.**

---

### 8.3 Confidence Indicators

**You know you've mastered Phase 1 when:**

- You can read ProseMirror docs and understand them without re-reading 3 times
- You can debug schema errors by inspecting `state.doc.toJSON()`
- You can write a new command without copy-pasting from existing commands
- You understand why `shallowRef` is needed (and can explain it to someone else)
- You can add a new toolbar button in <15 minutes
- You're comfortable reading ProseMirror source code
- You can explain the difference between Layer 1 (core) and Layer 2 (Vue) to a teammate

---

## 9. Next Steps After Phase 1

**Once you've completed Phase 1, you're ready for:**

- **Phase 2:** Text color, background color, color picker (easier — builds on Phase 1 patterns)
- **Phase 3:** Links (medium difficulty — introduces dialogs and URL validation)
- **Phase 4:** Image upload (hard — introduces NodeViews and async operations)
- **Phase 6:** Math/KaTeX (hard — introduces atom nodes and third-party library integration)

**Phase 1 is the hardest learning curve.** Phases 2-3 are easier because you already understand the core concepts.

---

## 10. Final Advice for Juniors

### 10.1 Mindset

**This project will be frustrating.** You'll spend 2 hours debugging why a heading won't insert, only to discover you forgot `group: 'block'` in the schema.

**That's normal.** ProseMirror is a professional-grade library used by Atlassian (Confluence), The New York Times, and many other companies. It's not designed to be easy — it's designed to be correct and flexible.

**The payoff:** After Phase 1, you'll understand editor architecture better than 95% of web developers. This knowledge is rare and valuable.

---

### 10.2 When to Ask for Help

**Ask for help if:**
- You've been stuck on the same error for >1 hour
- You don't understand a core concept after reading the docs 3 times
- Your code works but you don't know why
- You're about to give up

**Don't ask for help if:**
- You haven't read the error message carefully
- You haven't looked at the ProseMirror docs
- You haven't tried `console.log(state.doc.toJSON())`
- You've only been stuck for 15 minutes

**Good question:** "I'm trying to add a `callout` node with `content: 'block+'`, but I get 'Invalid content for node callout' when I try to insert a paragraph. I've checked that `paragraph` has `group: 'block'`. Here's my schema: [code]. What am I missing?"

**Bad question:** "My editor doesn't work. Help?"

---

### 10.3 Celebrate Small Wins

**Phase 1 has 19 tasks.** Each completed task is a win. Celebrate them:

- ✅ Schema compiles without errors → WIN
- ✅ Bold shortcut works → WIN
- ✅ Placeholder appears → WIN
- ✅ Editor mounts in Vue → WIN
- ✅ Toolbar button toggles bold → WIN
- ✅ Build produces dist/ folder → WIN

**Don't wait until the end to feel accomplished.** Each task teaches you something valuable.

---

### 10.4 You've Got This

**If you can:**
- Write a Vue component
- Understand TypeScript interfaces
- Read documentation and follow examples
- Debug with console.log
- Ask for help when stuck

**...then you CAN complete Phase 1.**

It will take 40-60 hours. It will be hard. But you'll emerge with skills that most developers don't have.

**Good luck!** 🚀

---

**END OF LEARNING ANALYSIS**


