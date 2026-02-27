# Phase 1: Core Foundation — Implementation Plan

> **Scope:** Project scaffold + Schema + EditorView + Select All + Copy/Paste + Bold/Italic/Underline/Strike/Code + Headings + Blockquote + Lists + Horizontal Rule + Hard Break + Undo/Redo + Keymap + Input Rules + HTML/JSON serialization + Vue wrapper + Toolbar + Demo app
> **Phase 1 explicitly excludes:** Text color, background color, color picker, links, images, file attachments, math/KaTeX, comments, AI, export

---

## A. Project Setup

### A.1 package.json

```
Name: rte-v3
Private: false (publishable)
```

**Runtime dependencies (dependencies):**

| Package | Purpose |
|---------|---------|
| `prosemirror-model` | Schema, Node, Mark, Fragment, Slice, DOMParser, DOMSerializer |
| `prosemirror-state` | EditorState, Plugin, PluginKey, Transaction, Selection |
| `prosemirror-view` | EditorView — mounts contentEditable to DOM |
| `prosemirror-transform` | Transform, Step, Mapping (used internally by state/view) |
| `prosemirror-commands` | toggleMark, setBlockType, wrapIn, lift, joinUp, joinDown, selectAll, baseKeymap |
| `prosemirror-keymap` | keymap() plugin factory |
| `prosemirror-history` | history(), undo, redo |
| `prosemirror-inputrules` | inputRules(), wrappingInputRule, textblockTypeInputRule, InputRule |
| `prosemirror-schema-list` | wrapInList, splitListItem, liftListItem, sinkListItem, addListNodes (reference for list node specs) |
| `prosemirror-dropcursor` | dropCursor() plugin — visual cursor on drag |
| `prosemirror-gapcursor` | gapCursor() plugin — cursor in structural gaps |

**Peer dependencies (peerDependencies):**

| Package | Version |
|---------|---------|
| `vue` | `^3.3.0` |

**Dev dependencies (devDependencies):**

| Package | Purpose |
|---------|---------|
| `vue` | Vue 3 (for dev/demo) |
| `typescript` | TypeScript compiler |
| `vite` | Dev server + build tool |
| `@vitejs/plugin-vue` | Vite plugin for .vue SFC compilation |
| `vite-plugin-dts` | Generate .d.ts type declarations on build |
| `vue-tsc` | Vue TypeScript type checker |
| `vitest` | Unit testing framework |
| `@vue/test-utils` | Vue component testing utilities |
| `jsdom` | DOM environment for vitest |

**Scripts:**

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite serve demo` | Run demo dev server |
| `build` | `vite build` | Build library (ESM + CJS + types + CSS) |
| `type-check` | `vue-tsc --noEmit` | TypeScript checking |
| `test` | `vitest run` | Run unit tests |
| `test:watch` | `vitest` | Watch mode tests |

### A.2 tsconfig.json

```
compilerOptions:
  target: ES2020
  module: ESNext
  moduleResolution: bundler
  lib: [ES2020, DOM, DOM.Iterable]
  strict: true
  jsx: preserve
  esModuleInterop: true
  skipLibCheck: true
  forceConsistentCasingInFileNames: true
  resolveJsonModule: true
  isolatedModules: true
  declaration: true
  declarationDir: dist/types
  outDir: dist
  sourceMap: true
  baseUrl: .
  paths:
    @/*: [src/*]

include: [src/**/*.ts, src/**/*.vue, src/**/*.d.ts]
exclude: [node_modules, dist, demo]
```

### A.3 vite.config.ts

**Library build configuration:**

```
Mode: library build (lib mode)
Entry: src/index.ts
Output formats: es, cjs
Output filenames: index.mjs (ESM), index.cjs (CJS)
```

**Key configuration details:**
- `plugins`: [@vitejs/plugin-vue, vite-plugin-dts({ rollupTypes: true })]
- `build.lib.entry`: resolve(__dirname, 'src/index.ts')
- `build.lib.name`: 'RTEv3'
- `build.lib.formats`: ['es', 'cjs']
- `build.lib.fileName`: (format) => format === 'es' ? 'index.mjs' : 'index.cjs'
- `build.rollupOptions.external`: ['vue'] — Vue is a peer dep, NOT bundled
- `build.rollupOptions.output.globals`: { vue: 'Vue' }
- `build.cssFileName`: 'style.css' — all CSS bundled into one file
- `resolve.alias`: { '@': resolve(__dirname, 'src') }

### A.4 demo/vite.config.ts

**Separate Vite config for demo dev server:**
- `root`: 'demo'
- `plugins`: [@vitejs/plugin-vue]
- `resolve.alias`: { '@': resolve(__dirname, '../src') } — points to library source
- `server.port`: 3000
- `server.open`: true

### A.5 demo/index.html

Standard HTML shell:
- `<div id="app"></div>`
- `<script type="module" src="./main.ts"></script>`

---

## B. Directory Structure

Every file to create, organized by layer:

```
RTE/
├── package.json                          ← A.1 above
├── tsconfig.json                         ← A.2 above
├── vite.config.ts                        ← A.3 above
├── src/
│   ├── index.ts                          ← B.1  Main entry — re-exports everything
│   ├── env.d.ts                          ← B.2  Ambient type declarations (*.vue modules)
│   ├── core/                             ← LAYER 1: Pure ProseMirror TypeScript
│   │   ├── schema/
│   │   │   ├── nodes.ts                  ← C.1  All node specs
│   │   │   ├── marks.ts                  ← C.2  All mark specs
│   │   │   └── index.ts                  ← C.3  Assemble Schema from nodes + marks
│   │   ├── plugins/
│   │   │   ├── keymap.ts                 ← C.4  Keyboard shortcuts
│   │   │   ├── inputRules.ts             ← C.5  Auto-formatting rules

## C. Core Layer (src/core/)

### C.1 schema/nodes.ts

**Exports:** `const nodes: Record<string, NodeSpec>` — an object of all node specifications.

**Nodes to define:**

| Node | content | group | attrs | parseDOM | toDOM | Notes |
|------|---------|-------|-------|----------|-------|-------|
| `doc` | `block+` | — | — | — | — | Root. Content is one-or-more block nodes |
| `paragraph` | `inline*` | `block` | `textAlign: { default: null }` | `[{ tag: 'p' }]` | `['p', { style? }, 0]` | textAlign → inline style on `<p>` if non-null |
| `heading` | `inline*` | `block` | `level: { default: 1 }` | `[{ tag: 'h1' }, { tag: 'h2' }, { tag: 'h3' }]` | `['h' + level, { style? }, 0]` | Support h1-h3 only (CSS only styles h1-h3). Each parseDOM entry extracts level from tag |
| `blockquote` | `block+` | `block` | — | `[{ tag: 'blockquote' }]` | `['blockquote', 0]` | Wrapping node |
| `bullet_list` | `list_item+` | `block` | — | `[{ tag: 'ul' }]` | `['ul', 0]` | Use `addListNodes` from prosemirror-schema-list OR define manually matching that shape |
| `ordered_list` | `list_item+` | `block` | `start: { default: 1 }` | `[{ tag: 'ol', getAttrs: dom => ({ start: dom.start || 1 }) }]` | `['ol', { start }, 0]` | `start` attr for numbered list offset |
| `list_item` | `paragraph block*` | — | — | `[{ tag: 'li' }]` | `['li', 0]` | Not in `block` group — used only as child of list nodes |
| `horizontal_rule` | — (leaf) | `block` | — | `[{ tag: 'hr' }]` | `['hr']` | Leaf node (no content). `selectable: true` |
| `hard_break` | — (leaf) | `inline` | — | `[{ tag: 'br' }]` | `['br']` | Inline leaf. `inline: true`, `selectable: false` |
| `text` | — | `inline` | — | — | — | Built-in ProseMirror text node. Must be included in spec for inline content to work |

**Implementation details:**
- Do NOT use `prosemirror-schema-basic` nodes directly. Define each node manually so we control every attribute. Reference `prosemirror-schema-basic` source as a guide.
- For `bullet_list` and `ordered_list`: either use `addListNodes(baseNodes, 'paragraph block*', 'block')` from `prosemirror-schema-list` OR manually replicate the node specs from that module. Manual is preferred for full control.
- `paragraph` textAlign: parse from `style="text-align: ..."` on `<p>`, serialize back only if non-null (avoid polluting clean HTML with redundant styles).

**CSS classes used:**
- All node output is semantic HTML (`<p>`, `<h1>`, `<blockquote>`, `<ul>`, `<ol>`, `<li>`, `<hr>`, `<br>`).
- CSS scoped via `.rte-editor .ProseMirror p`, `.rte-editor .ProseMirror h1`, etc. — already defined in content/*.css files.
- No explicit CSS class attributes needed on toDOM output for Phase 1 nodes.

**Dependencies:** `prosemirror-model` (NodeSpec type)

---

### C.2 schema/marks.ts

**Exports:** `const marks: Record<string, MarkSpec>` — an object of all mark specifications.

**Marks to define in Phase 1:**

| Mark | attrs | parseDOM | toDOM | Notes |
|------|-------|----------|-------|-------|
| `bold` | — | `[{ tag: 'strong' }, { tag: 'b', getAttrs: node => node.style.fontWeight !== 'normal' && null }, { style: 'font-weight=bold' }, { style: 'font-weight', getAttrs: value => /^(bold\|[5-9][0-9]{2,})$/.test(value) && null }]` | `['strong', 0]` | Handles `<strong>`, `<b>`, and CSS font-weight from pasted content |
| `italic` | — | `[{ tag: 'em' }, { tag: 'i', getAttrs: node => node.style.fontStyle !== 'normal' && null }, { style: 'font-style=italic' }]` | `['em', 0]` | Handles `<em>`, `<i>`, and CSS font-style |
| `underline` | — | `[{ tag: 'u' }, { style: 'text-decoration=underline' }]` | `['u', 0]` | Not in prosemirror-schema-basic — custom definition |
| `strike` | — | `[{ tag: 's' }, { tag: 'del' }, { tag: 'strike' }, { style: 'text-decoration=line-through' }]` | `['s', 0]` | Handles `<s>`, `<del>`, legacy `<strike>` |
| `code` | — | `[{ tag: 'code' }]` | `['code', 0]` | Inline code. `excludes: '_'` — no other marks inside code spans |

**NOT in Phase 1 (deferred):**
- `textColor` → Phase 2
- `backgroundColor` → Phase 2
- `link` → Phase 3

**Implementation details:**
- `code` mark must set `excludes: '_'` to prevent bold/italic inside code spans (ProseMirror convention).
- `bold` parseDOM must be thorough to handle pasted content from Word/Google Docs that uses `<b>` or `font-weight: 700`.

**CSS classes used:**
- `<strong>` → styled by `content/inline.css` (`.rte-editor .ProseMirror strong`)
- `<em>` → styled by `content/inline.css` (`.rte-editor .ProseMirror em`)
- `<u>` → styled by `content/inline.css` (`.rte-editor .ProseMirror u`)
- `<s>` → styled by `content/inline.css` (`.rte-editor .ProseMirror s`)
- `<code>` → styled by `content/code.css` (`.rte-editor .ProseMirror code`)

**Dependencies:** `prosemirror-model` (MarkSpec type)

---

### C.3 schema/index.ts

**Exports:** `const schema: Schema`

**Implementation:**
1. Import `nodes` from `./nodes`
2. Import `marks` from `./marks`
3. Import `Schema` from `prosemirror-model`
4. Create and export: `export const schema = new Schema({ nodes, marks })`
5. Also re-export `nodes` and `marks` for consumers who need individual specs.

**Dependencies:** `./nodes`, `./marks`, `prosemirror-model`

---

### C.4 plugins/keymap.ts

**Exports:** `function buildKeymap(schema: Schema): Plugin` — returns a ProseMirror keymap plugin.

**Every keyboard shortcut to bind:**

| Key | Command | Source |
|-----|---------|--------|
| `Mod-b` | `toggleMark(schema.marks.bold)` | prosemirror-commands |
| `Mod-i` | `toggleMark(schema.marks.italic)` | prosemirror-commands |
| `Mod-u` | `toggleMark(schema.marks.underline)` | prosemirror-commands |
| `Mod-Shift-x` | `toggleMark(schema.marks.strike)` | prosemirror-commands |
| `Mod-e` | `toggleMark(schema.marks.code)` | prosemirror-commands |
| `Mod-z` | `undo` | prosemirror-history |
| `Mod-y` | `redo` | prosemirror-history |
| `Mod-Shift-z` | `redo` | prosemirror-history (Mac convention) |
| `Mod-a` | `selectAll` | prosemirror-commands |
| `Enter` | `splitListItem(schema.nodes.list_item)` | prosemirror-schema-list (takes priority when inside a list) |
| `Tab` | `sinkListItem(schema.nodes.list_item)` | prosemirror-schema-list (indent list) |
| `Shift-Tab` | `liftListItem(schema.nodes.list_item)` | prosemirror-schema-list (outdent list) |
| `Shift-Enter` | insert `hard_break` node | Custom: `(state, dispatch) => { dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create())); return true }` |
| `Mod-Shift-7` | `wrapInList(schema.nodes.ordered_list)` | prosemirror-schema-list |
| `Mod-Shift-8` | `wrapInList(schema.nodes.bullet_list)` | prosemirror-schema-list |

**Additional: merge with `baseKeymap`:**
- Import `baseKeymap` from `prosemirror-commands` — provides arrow keys, Backspace, Delete, Enter (joinBackward, joinForward, newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock).
- Use `keymap({ ...baseKeymap, ...customBindings })` to merge, with custom bindings taking priority.
- Actually, return TWO keymap plugins: custom one first (higher priority), then `keymap(baseKeymap)` second. The `setup.ts` will order them correctly.

**Implementation details:**
- Wrap `toggleMark` calls to handle the case where the mark doesn't exist in schema (defensive).
- For `Tab` / `Shift-Tab`: prevent default browser tab behavior. If not inside a list item, `sinkListItem` returns false and the event propagates — consider binding `Tab` to return `true` always to trap the key.

**Dependencies:** `prosemirror-keymap`, `prosemirror-commands`, `prosemirror-history`, `prosemirror-schema-list`, `prosemirror-model`

---

### C.5 plugins/inputRules.ts

**Exports:** `function buildInputRules(schema: Schema): Plugin` — returns a ProseMirror inputRules plugin.

**Auto-formatting rules to include:**

| Trigger | Result | Rule type | Details |
|---------|--------|-----------|---------|
| `# ` at start of line | Heading level 1 | `textblockTypeInputRule(/^#\s$/, schema.nodes.heading, { level: 1 })` | |
| `## ` at start of line | Heading level 2 | `textblockTypeInputRule(/^##\s$/, schema.nodes.heading, { level: 2 })` | |
| `### ` at start of line | Heading level 3 | `textblockTypeInputRule(/^###\s$/, schema.nodes.heading, { level: 3 })` | |
| `> ` at start of line | Blockquote | `wrappingInputRule(/^>\s$/, schema.nodes.blockquote)` | |
| `- ` or `* ` at start of line | Bullet list | `wrappingInputRule(/^[-*]\s$/, schema.nodes.bullet_list)` | Wraps in bullet_list > list_item |
| `1. ` at start of line | Ordered list | `wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, match => ({ start: +match[1] }))` | Captures starting number |
| `---` on empty line | Horizontal rule | Custom `InputRule(/^---$/, ...)` that replaces with hr node | Replaces paragraph content with `horizontal_rule` node |

**NOT in Phase 1 (deferred):**
- `$...$` → math_inline (Phase 6)
- `$$` → math_display (Phase 6)
- Markdown-style bold (`**text**`) — not planned per report

**Implementation details:**
- Use `inputRules({ rules: [...] })` to create the plugin.
- The horizontal rule input rule is custom: detect `---` typed in an empty paragraph, then replace that paragraph with an `hr` node + a new empty paragraph after it.
- For wrapping rules (blockquote, lists): `wrappingInputRule` from `prosemirror-inputrules` handles the wrap-in-node logic.

**Dependencies:** `prosemirror-inputrules`, `prosemirror-model`

---

### C.6 plugins/placeholder.ts

**Exports:** `function placeholderPlugin(text: string): Plugin` — shows placeholder text when editor is empty.

**Implementation:**
- Creates a ProseMirror Plugin with a `decorations` state field.
- On every state update, checks if the document has exactly one empty paragraph.
- If empty: creates a `Decoration.node` on the first paragraph that adds `class: 'is-editor-empty'` and `data-placeholder: text` attributes.
- If not empty: returns `DecorationSet.empty`.

**CSS classes used:**
- `.rte-editor .ProseMirror p.is-editor-empty:first-child::before` — already defined in `content/editor.css` — displays the `data-placeholder` attribute as `::before` pseudo-content.

**Dependencies:** `prosemirror-state` (Plugin, PluginKey), `prosemirror-view` (Decoration, DecorationSet)

---

### C.7 commands/formatting.ts

**Exports:** Functions that return ProseMirror Command functions.

**Functions to export:**

| Function | Signature | Behavior |
|----------|-----------|----------|
| `toggleBold` | `Command` | `toggleMark(schema.marks.bold)` — pre-bound to schema |
| `toggleItalic` | `Command` | `toggleMark(schema.marks.italic)` |
| `toggleUnderline` | `Command` | `toggleMark(schema.marks.underline)` |
| `toggleStrike` | `Command` | `toggleMark(schema.marks.strike)` |
| `toggleCode` | `Command` | `toggleMark(schema.marks.code)` |
| `setHeading` | `(level: number) => Command` | `setBlockType(schema.nodes.heading, { level })` |
| `setParagraph` | `Command` | `setBlockType(schema.nodes.paragraph)` |
| `toggleBlockquote` | `Command` | If inside blockquote: `lift`. Else: `wrapIn(schema.nodes.blockquote)` |
| `toggleBulletList` | `Command` | If inside bullet_list: lift list item out. Else: `wrapInList(schema.nodes.bullet_list)` |
| `toggleOrderedList` | `Command` | If inside ordered_list: lift list item out. Else: `wrapInList(schema.nodes.ordered_list)` |
| `insertHorizontalRule` | `Command` | Replace selection with `horizontal_rule` node, add paragraph after |

**Implementation details:**
- Each function takes `schema` as parameter OR the module imports from `../schema` directly.
- Prefer approach: export a factory `function createFormattingCommands(schema: Schema)` that returns an object of all commands. This decouples from a specific schema instance.
- For `toggleBlockquote`: check if current selection is inside a blockquote by walking up the node tree. Use `findParentNode` pattern or check `$from.node(-1).type`.
- For `toggleBulletList` / `toggleOrderedList`: use `wrapInList` from prosemirror-schema-list to wrap. To unwrap: use `liftListItem(schema.nodes.list_item)` or `lift` to get out of the list structure.

**Dependencies:** `prosemirror-commands` (toggleMark, setBlockType, wrapIn, lift), `prosemirror-schema-list` (wrapInList, liftListItem), `prosemirror-model`, `prosemirror-state`

---

### C.8 serializers/html.ts

**Exports:**

| Function | Signature | Purpose |
|----------|-----------|---------|
| `toHTML(state: EditorState): string` | Takes editor state, returns sanitized HTML string | For saving to DB `content_html` column |
| `fromHTML(html: string, schema: Schema): Node` | Takes HTML string + schema, returns ProseMirror document Node | For loading content from DB |

**Implementation — `toHTML`:**
1. Get the document node from `state.doc`.
2. Use `DOMSerializer.fromSchema(schema)` to create a serializer.
3. Call `serializer.serializeFragment(state.doc.content)` → returns a DOM DocumentFragment.
4. Create a temporary `<div>`, append the fragment, read `div.innerHTML`.
5. Return the HTML string.

**Implementation — `fromHTML`:**
1. Create a temporary `<div>`, set `innerHTML = html`.
2. Use `DOMParser.fromSchema(schema)` to create a parser.
3. Call `parser.parse(div)` → returns a ProseMirror `Node` (document).
4. Return the node.

**Note:** Phase 1 does NOT include DOMPurify sanitization on paste. That will be added when the paste-handling plugin is built. The `toHTML` serializer produces clean HTML from the schema's `toDOM` specs, which is inherently safe (no user-injected attributes).

**Dependencies:** `prosemirror-model` (DOMSerializer, DOMParser, Schema, Node), `prosemirror-state` (EditorState)

---

### C.9 serializers/json.ts

**Exports:**

| Function | Signature | Purpose |
|----------|-----------|---------|
| `toJSON(state: EditorState): object` | Returns ProseMirror JSON representation | For saving to DB `content_json` column (source of truth) |
| `fromJSON(json: object, schema: Schema): Node` | Takes JSON + schema, returns ProseMirror document Node | For loading content from DB |

**Implementation — `toJSON`:**
1. Return `state.doc.toJSON()` — built-in ProseMirror method.

**Implementation — `fromJSON`:**
1. Return `Node.fromJSON(schema, json)` — built-in ProseMirror method.
2. Wrap in try-catch: if JSON is malformed or has unknown node types, fall back to creating an empty document.

**Dependencies:** `prosemirror-model` (Node, Schema), `prosemirror-state` (EditorState)

---

### C.10 setup.ts

**Exports:** `function createPlugins(options: { schema: Schema, placeholder?: string }): Plugin[]`

**Returns an ordered array of ProseMirror plugins:**

```
[
  1. buildKeymap(schema)          ← C.4 — custom shortcuts (highest priority)
  2. keymap(baseKeymap)           ← prosemirror-commands baseKeymap (fallback keys)
  3. buildInputRules(schema)      ← C.5 — auto-formatting
  4. history()                    ← prosemirror-history — undo/redo state tracking
  5. dropCursor()                 ← prosemirror-dropcursor — visual drop indicator
  6. gapCursor()                  ← prosemirror-gapcursor — cursor in gaps
  7. placeholderPlugin(placeholder ?? 'Start typing...')  ← C.6
]
```

**Plugin order matters:**
- Keymap plugins must come before `baseKeymap` so custom bindings take priority.
- `history()` should come after keymaps (it just needs to be in the list, order relative to keymaps doesn't matter much, but convention is after).
- `inputRules` should come before `baseKeymap` so input rules get first chance at handling input.

**Dependencies:** All plugin modules (C.4–C.6), `prosemirror-keymap`, `prosemirror-commands`, `prosemirror-history`, `prosemirror-dropcursor`, `prosemirror-gapcursor`

---

## D. Vue Layer (src/components/)

### D.1 RTEditor.vue — Main Editor Wrapper

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `html` | `string` | `''` | v-model:html — HTML content (two-way binding) |
| `json` | `object \| null` | `null` | v-model:json — JSON content (two-way binding, preferred) |
| `placeholder` | `string` | `'Start typing...'` | Placeholder text when empty |
| `editable` | `boolean` | `true` | Read-only mode when false |
| `autofocus` | `boolean` | `false` | Focus editor on mount |

**Emits:**

| Event | Payload | When |
|-------|---------|------|
| `update:html` | `string` | On every content change (debounced) |
| `update:json` | `object` | On every content change (debounced) |
| `change` | `{ html: string, json: object }` | On every content change |
| `focus` | `void` | Editor gains focus |
| `blur` | `void` | Editor loses focus |

**Template structure (uses existing CSS classes):**
```html
<div class="rte-root">
  <RTToolbar :editor-view="editorView" :editor-state="editorState" />
  <div class="rte-root__body">
    <div class="rte-editor-wrapper">
      <div class="rte-editor" ref="editorRef"></div>
    </div>
  </div>
</div>
```

**CSS classes used:**
- `.rte-root` — from `base/root.css` — flex column container with border
- `.rte-root__body` — from `base/root.css` — flex row for editor + sidebar
- `.rte-editor-wrapper` — from `content/editor.css` — flex wrapper
- `.rte-editor` — from `content/editor.css` — the ProseMirror mount point
- `.rte-editor .ProseMirror` — ProseMirror adds this class automatically

**Lifecycle:**

1. **`onMounted`:**
   - Determine initial content: prefer `json` prop (via `fromJSON`), fall back to `html` prop (via `fromHTML`), fall back to empty doc.
   - Create `EditorState.create({ doc, plugins: createPlugins({ schema, placeholder }) })`.
   - Create `EditorView(editorRef.value, { state, dispatchTransaction })`.
   - In `dispatchTransaction(tr)`: apply transaction, update reactive state, emit `update:html`, `update:json`, `change`.
   - If `autofocus`: call `view.focus()`.

2. **`onBeforeUnmount`:**
   - Call `editorView.destroy()` to clean up DOM listeners.

3. **`watch(editable)`:**
   - Call `editorView.setProps({ editable: () => editable.value })`.

4. **`watch(html / json)` (external content update):**
   - If the new value differs from current editor content (compare JSON), replace the editor's document.
   - Use `editorView.dispatch(state.tr.replaceWith(0, state.doc.content.size, newDoc.content))`.
   - Guard against infinite loop: skip dispatch if the change originated from the editor itself.

**Expose (defineExpose):**
- `getHTML(): string` — returns current HTML
- `getJSON(): object` — returns current JSON
- `focus(): void` — focuses the editor
- `getEditorView(): EditorView` — escape hatch for advanced usage

**Dependencies:** `../core/schema`, `../core/setup`, `../core/serializers/html`, `../core/serializers/json`, `./RTToolbar.vue`, `prosemirror-state`, `prosemirror-view`

---

### D.2 RTToolbar.vue — Toolbar with Phase 1 Buttons

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `editorView` | `EditorView \| null` | The ProseMirror EditorView instance |
| `editorState` | `EditorState \| null` | Reactive editor state (updated on each transaction) |

**How it reads active state:**

For each mark (bold, italic, underline, strike, code):
- Check: `markType.isInSet(state.storedMarks || state.selection.$from.marks())` — returns truthy if mark is active at cursor.

For block types (heading, blockquote, lists):
- Check: `state.selection.$from.parent.type === schema.nodes.heading` (and check `level` attr).
- For lists: walk up from `$from` to find if inside `bullet_list` or `ordered_list`.

**How it dispatches commands:**
- Each button click calls the corresponding command from `commands/formatting.ts`.
- Pass `(editorView.state, editorView.dispatch, editorView)` to the command function.
- After dispatch, refocus the editor: `editorView.focus()`.

**Toolbar button layout (grouped):**

```
Group 1 — History:        [Undo] [Redo]
    separator
Group 2 — Block type:     [Heading dropdown ▾] (Paragraph, H1, H2, H3)
    separator
Group 3 — Inline marks:   [Bold] [Italic] [Underline] [Strikethrough] [Code]
    separator
Group 4 — Lists:          [Bullet List] [Ordered List]
    separator
Group 5 — Block:          [Blockquote] [Horizontal Rule]
```

**Heading dropdown:**
- A `<button>` that toggles a popover (`rte-popover`).
- Popover contains 4 items: Paragraph, Heading 1, Heading 2, Heading 3.
- Active item is highlighted.
- Clicking an item dispatches `setParagraph` or `setHeading(level)`.

**Template structure:**
```html
<div class="rte-toolbar" role="toolbar" aria-label="Formatting">
  <div class="rte-toolbar__group">
    <button class="rte-toolbar__button" :disabled="!canUndo" @click="undo" aria-label="Undo" title="Undo (Ctrl+Z)">
      <!-- SVG icon -->
    </button>
    <button class="rte-toolbar__button" :disabled="!canRedo" @click="redo" aria-label="Redo" title="Redo (Ctrl+Y)">
      <!-- SVG icon -->
    </button>
  </div>
  <div class="rte-toolbar__separator" role="separator"></div>
  <!-- ...more groups... -->
</div>
```

**CSS classes used:**
- `.rte-toolbar` — from `components/toolbar.css`
- `.rte-toolbar__group` — from `components/toolbar.css`
- `.rte-toolbar__separator` — from `components/toolbar.css`
- `.rte-toolbar__button` — from `components/toolbar-button.css`
- `.rte-toolbar__button--active` / `aria-pressed="true"` — from `components/toolbar-button.css`
- `.rte-toolbar__button:disabled` — from `components/toolbar-button.css`
- `.rte-popover` + `.rte-popover--open` — from `components/popover.css` (for heading dropdown)
- `.rte-popover__item` — from `components/popover.css`

**Icons:**
- Use inline SVG for each button (16×16, matching `.rte-toolbar__button svg` sizing from toolbar-button.css).
- Icons needed: Undo, Redo, Bold, Italic, Underline, Strikethrough, Code, Heading (with level indicator), BulletList, OrderedList, Quote, HorizontalRule.
- Either embed inline SVGs directly or create a small `icons.ts` utility that exports SVG strings/components.

**Undo/Redo state:**
- `canUndo`: check `undo(state, null)` — call with null dispatch to test without executing.
- `canRedo`: check `redo(state, null)`.

**Dependencies:** `prosemirror-commands`, `prosemirror-history`, `../core/schema`, `../core/commands/formatting`

---

### D.3 composables/useEditor.ts

**Exports:** `function useEditor(options: UseEditorOptions): UseEditorReturn`

**Purpose:** Encapsulates the ProseMirror lifecycle in a Vue composable. Used internally by RTEditor.vue but also exportable for advanced users who want to build custom UIs.

**UseEditorOptions interface:**
```
{
  content?: { html?: string, json?: object | null }
  placeholder?: string
  editable?: boolean
  onUpdate?: (data: { html: string, json: object }) => void
}
```

**UseEditorReturn interface:**
```
{
  editorRef: Ref<HTMLElement | null>     — template ref for mount point
  editorView: ShallowRef<EditorView | null>
  editorState: ShallowRef<EditorState | null>
  isReady: Ref<boolean>
  getHTML: () => string
  getJSON: () => object
  focus: () => void
  destroy: () => void
}
```

**Implementation:**
- Uses `shallowRef` for `editorView` and `editorState` (avoids deep reactivity overhead on ProseMirror objects).
- On mount: creates EditorState + EditorView, wires `dispatchTransaction` to update `editorState` ref.
- `dispatchTransaction`: applies transaction, sets `editorState.value = view.state`, calls `onUpdate` callback with serialized HTML+JSON.
- On unmount: calls `destroy()`.

**Dependencies:** `vue` (ref, shallowRef, onMounted, onBeforeUnmount, watch), all core modules

---

### D.4 types/index.ts

**Exports:** TypeScript interfaces and types used across the plugin.

**Types to define in Phase 1:**

```typescript
// Editor configuration
interface RTEditorConfig {
  placeholder?: string
  editable?: boolean
  autofocus?: boolean
}

// Content payload (emitted on change, used for save)
interface RTEditorContent {
  html: string
  json: object
}

// Re-export ProseMirror types that consumers might need
export type { EditorView } from 'prosemirror-view'
export type { EditorState } from 'prosemirror-state'
export type { Node as ProseMirrorNode, Schema } from 'prosemirror-model'
```

**Dependencies:** ProseMirror type imports only

---

## E. Demo App (demo/)

### E.1 demo/index.html

Standard HTML5 shell:
- `<!DOCTYPE html>` + `<html lang="en">`
- `<head>`: charset, viewport meta, title "RTE v3 Demo"
- `<body>`: `<div id="app"></div>` + `<script type="module" src="./main.ts"></script>`

### E.2 demo/main.ts

- Import `createApp` from `vue`
- Import `App` from `./App.vue`
- Import `../src/styles/index.css` — pulls in all editor styles
- `createApp(App).mount('#app')`

### E.3 demo/App.vue

**Template:**
```html
<div style="max-width: 800px; margin: 40px auto; font-family: sans-serif;">
  <h1>RTE v3 — Phase 1 Demo</h1>
  <RTEditor
    v-model:html="htmlContent"
    v-model:json="jsonContent"
    placeholder="Start typing..."
    autofocus
    @change="onContentChange"
  />
  <details style="margin-top: 20px;">
    <summary>HTML Output</summary>
    <pre>{{ htmlContent }}</pre>
  </details>
  <details>
    <summary>JSON Output</summary>
    <pre>{{ JSON.stringify(jsonContent, null, 2) }}</pre>
  </details>
</div>
```

**Script setup:**
- Import `RTEditor` from `../src/components/RTEditor.vue`
- Reactive refs: `htmlContent = ref('')`, `jsonContent = ref(null)`
- `onContentChange(data)` — just logs to console for demo purposes.

**Dependencies:** `../src/components/RTEditor.vue`

---

## F. Build Output

### What `npm run build` produces:

```
dist/
├── index.mjs          ← ESM bundle (~50-80KB estimated, ProseMirror included)
├── index.cjs          ← CJS bundle (same content, CommonJS format)
├── index.d.ts         ← Rolled-up TypeScript declarations
└── style.css          ← All CSS from src/styles/index.css, bundled + minified
```

### F.1 package.json export fields

```json
{
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": ["dist"],
  "sideEffects": ["**/*.css"]
}
```

### F.2 What gets bundled vs externalized

| Dependency | Bundled? | Reason |
|-----------|----------|--------|
| All `prosemirror-*` packages | ✅ YES | They are runtime deps — bundled into the output |
| `vue` | ❌ NO (external) | Peer dependency — host app provides it |
| CSS (src/styles/) | ✅ YES → style.css | Bundled into a single CSS file |

### F.3 src/index.ts — Main Entry Point

**Exports everything the consumer needs:**

```
// Components
export { default as RTEditor } from './components/RTEditor.vue'
export { default as RTToolbar } from './components/RTToolbar.vue'

// Core (for advanced usage)
export { schema } from './core/schema'
export { createPlugins } from './core/setup'
export { toHTML, fromHTML } from './core/serializers/html'
export { toJSON, fromJSON } from './core/serializers/json'
export { createFormattingCommands } from './core/commands/formatting'

// Composables
export { useEditor } from './composables/useEditor'

// Types
export type { RTEditorConfig, RTEditorContent } from './types'
```

### F.4 How a host app consumes the package

```vue
<!-- Host app component -->
<script setup>
import { RTEditor } from 'rte-v3'
import 'rte-v3/style.css'
</script>
<template>
  <RTEditor v-model:html="content" placeholder="Write here..." />
</template>
```

---

## G. File Dependency Graph Summary

```
src/index.ts
├── components/RTEditor.vue
│   ├── components/RTToolbar.vue
│   │   ├── core/schema/index.ts
│   │   └── core/commands/formatting.ts
│   ├── composables/useEditor.ts
│   │   ├── core/schema/index.ts
│   │   │   ├── core/schema/nodes.ts
│   │   │   └── core/schema/marks.ts
│   │   ├── core/setup.ts
│   │   │   ├── core/plugins/keymap.ts
│   │   │   ├── core/plugins/inputRules.ts
│   │   │   └── core/plugins/placeholder.ts
│   │   ├── core/serializers/html.ts
│   │   └── core/serializers/json.ts
│   └── types/index.ts
└── styles/index.css (imported as side-effect)
```

---

**END OF PHASE 1 IMPLEMENTATION PLAN**

