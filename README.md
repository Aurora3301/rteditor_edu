# rteditor

A rich text editor Vue 3 plugin built on [ProseMirror](https://prosemirror.net/).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Vue 3 (Composition API, `<script setup>`) |
| **Editor Engine** | ProseMirror |
| **Language** | TypeScript 5 |
| **Build Tool** | Vite 7 |
| **Testing** | Vitest + @vue/test-utils + jsdom |
| **Type Generation** | vite-plugin-dts + vue-tsc |

## Packages

### Peer Dependencies

| Package | Purpose |
|---------|---------|
| `vue` ^3.5 | UI framework |
| `prosemirror-model` | Document model, schema, nodes, marks |
| `prosemirror-state` | Editor state management, transactions |
| `prosemirror-view` | DOM rendering, user interaction |
| `prosemirror-commands` | Built-in editing commands |
| `prosemirror-keymap` | Keyboard shortcut binding |
| `prosemirror-inputrules` | Markdown-style auto-formatting |
| `prosemirror-history` | Undo/redo |
| `prosemirror-schema-list` | List node commands (split, lift, sink) |
| `prosemirror-dropcursor` | Drop position indicator |
| `prosemirror-gapcursor` | Cursor in empty positions |
| `prosemirror-transform` | Document transformations |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `vite` | Build tool + dev server |
| `@vitejs/plugin-vue` | Vue SFC compilation |
| `typescript` | Type checking |
| `vue-tsc` | Vue-aware type checking |
| `vite-plugin-dts` | `.d.ts` declaration generation |
| `vitest` | Unit test runner |
| `@vue/test-utils` | Vue component testing |
| `jsdom` | DOM environment for tests |

## Architecture

```
src/
├── core/                    # Framework-agnostic ProseMirror layer
│   ├── schema/
│   │   ├── nodes.ts         # 12 node types (doc, paragraph, heading, lists, etc.)
│   │   ├── marks.ts         # 10 mark types (bold, italic, link, fontFamily, etc.)
│   │   └── index.ts         # Schema assembly
│   ├── commands/
│   │   ├── formatting.ts    # All editing commands + state checks
│   │   └── index.ts         # Barrel export
│   ├── plugins/
│   │   ├── keymap.ts        # Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
│   │   ├── inputRules.ts    # Markdown shortcuts (# → H1, - → list, etc.)
│   │   └── index.ts         # Plugin bundle (keymap + inputRules + history + etc.)
│   ├── serializers/
│   │   ├── html.ts          # HTML ↔ ProseMirror (XSS-safe via DOMParser)
│   │   ├── json.ts          # JSON ↔ ProseMirror
│   │   └── index.ts         # Barrel export
│   └── editor.ts            # Factory: createEditor() / destroyEditor()
│
├── components/              # Vue 3 components
│   ├── RTEditor.vue         # Main editor component (props, v-model, expose)
│   ├── RTToolbar.vue        # Two-row toolbar with all formatting controls
│   └── RTBubbleMenu.vue     # Floating menu on text selection / link editing
│
├── composables/
│   └── useEditor.ts         # Vue bridge: reactive state, commands, lifecycle
│
├── i18n/                    # Internationalization
│   ├── en.ts                # English translations
│   ├── zh-TW.ts             # Traditional Chinese translations
│   └── index.ts             # i18n provider (provide/inject)
│
├── styles/                  # CSS design system (36 files)
│   ├── tokens/              # Design tokens (palette, typography, spacing, etc.)
│   ├── base/                # Reset + root variables
│   ├── components/          # Toolbar, buttons, popover, dialog styles
│   ├── content/             # Editor content styles (headings, lists, code, etc.)
│   ├── themes/              # Dark mode
│   └── index.css            # Main entry (imports all partials)
│
├── themes/
│   └── presets.ts           # 4 preset themes (blueSteel, forest, rose, amber)
│
├── types/
│   └── index.ts             # Public TypeScript interfaces + ProseMirror re-exports
│
└── index.ts                 # Package entry point (exports everything)
```

### Data Flow

```
User Input → ProseMirror EditorView → Transaction → EditorState
                                          ↓
                                    useEditor composable
                                    (watches transactions)
                                          ↓
                              ┌───────────┼───────────┐
                              ↓           ↓           ↓
                        activeState    html ref    json ref
                        (reactive)    (debounced)  (debounced)
                              ↓           ↓
                        RTToolbar    v-model emit
                        (highlights   to parent
                        active btns)
```

## Features

### Inline Formatting
- **Bold** (Ctrl+B), **Italic** (Ctrl+I), **Underline** (Ctrl+U)
- **Strikethrough** (Ctrl+Shift+X), **Inline Code** (Ctrl+E)
- **Subscript**, **Superscript** (mutually exclusive)
- **Font Family** picker (7 fonts)
- **Font Size** picker (15 sizes: 8px–72px)
- **Link** with bubble menu (add/edit/remove URL)
- **Clear Formatting** — strips all marks + resets headings to paragraphs

### Block Formatting
- **Headings** H1, H2, H3
- **Text Alignment** — left, center, right, justify
- **Bullet List**, **Ordered List** (with Tab/Shift+Tab indent)
- **Blockquote**
- **Horizontal Rule**

### Media
- **Image** insert with file upload (custom handler or data URL fallback)

### Markdown Shortcuts (Input Rules)
| Type | Trigger |
|------|---------|
| `# ` | Heading 1 |
| `## ` | Heading 2 |
| `### ` | Heading 3 |
| `- ` or `* ` | Bullet list |
| `1. ` | Ordered list |
| `> ` | Blockquote |
| `---` | Horizontal rule |

### Editor Features
- **Undo / Redo** with full history
- **v-model** binding (HTML string)
- **v-model:json** binding (ProseMirror JSON)
- **Bubble menu** — floating toolbar on text selection
- **Read-only mode** via `readonly` prop
- **Placeholder** text
- **Focus/blur** events

### Theming
- Light / Dark mode (`theme` prop)
- Custom theme via CSS variable overrides (`customTheme` prop)
- 4 built-in presets: Blue Steel, Forest, Rose, Amber
- `defineTheme()` helper for type-safe custom themes

### i18n
- English (`en`) and Traditional Chinese (`zh-TW`)
- Extensible via `provideI18n()`

### Security
- XSS-safe HTML parsing (DOMParser, not innerHTML)
- Link href validation (rejects `javascript:`, `vbscript:`, `data:`)
- Image src validation (allows only `http:`, `https:`, `data:image/*`)
- Font CSS injection prevention

## Quick Start

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Run tests
npm test
```

Open `http://localhost:5173/` to see the demo.
