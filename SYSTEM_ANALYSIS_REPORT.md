# Rich Text Editor v3 — System Analysis Report

> **Date:** 2026-02-27
> **Project:** ProseMirror-based Rich Text Editor (Standalone Vue 3 Plugin)
> **Author:** System Analyst

---

## 1. Project Overview

### 1.1 Objective

Build a standalone rich text editor plugin using **ProseMirror core modules** as the engine, wrapped in **Vue 3** components for UI. The plugin is designed to be embedded in any Vue 3 host application without dependency on a specific backend, build tool, or storage provider.

### 1.2 Key Design Principles

| Principle | Description |
|---|---|
| **Backend-agnostic** | Plugin defines interfaces; host app implements for their backend |
| **Standalone** | Works as an npm package, no external service dependencies |
| **Two-layer architecture** | Layer 1: Pure TypeScript ProseMirror core (framework-agnostic). Layer 2: Vue 3 UI components |
| **Custom UI** | No third-party component library (PrimeVue, Headless UI, etc.) — all UI is custom-built |
| **MIT-compatible** | All dependencies must be MIT or Apache 2.0 licensed |

---

## 2. Confirmed Technical Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| D1 | UI Framework | **Vue 3** | Team expertise, host app compatibility, excellent component model |
| D1.1 | UI Component Library | **Custom** | Full design control, no third-party dependency |
| D2 | Distribution | **Standalone npm plugin** | Reusable across projects |
| D2.2 | Host Framework | **Vue 3** | Primary target consumer |
| D2.3 | Build Tool Compatibility | **ESM + CJS** (Vite for dev, ship both formats) | Host app may use Vite, Webpack, or Laravel Mix |
| D3.1 | Storage | **Plugin-agnostic** | Host app decides; plugin provides handler interface |
| D3.2 | Upload Architecture | **Option A: POST /api/upload → server disk** | Simplest, free, no external services |
| D3.3 | Max File Size | **5MB** (images and attachments) | Client + server enforced |
| D3.4 | File Access | **Auth-gated** | Host app manages authentication and signed URLs |
| D5 | Content Storage Format | **Both HTML + ProseMirror JSON** | JSON = source of truth for re-editing; HTML = display, search, external rendering |
| D5.1 | DB Column Type | **LONGTEXT (utf8mb4)** | Supports large documents, emoji, CJK, math symbols |
| D5.2 | XSS Prevention | **DOMPurify (client) + HTMLPurifier (server)** | Defense in depth |
| D5.3 | Math Library | **KaTeX** (MIT, render only) | Fastest, smallest bundle (~100KB gzip), 90% LaTeX coverage |
| D5.4 | Math Input | **Raw LaTeX** (textarea with live preview) | KaTeX is render-only; user types LaTeX syntax |

---

## 3. Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOST APPLICATION (Vue 3)                     │
│                                                                  │
│   Provides:                                                      │
│   ├── UploadHandler implementation (POST /api/upload)            │
│   ├── AIHandler implementation (optional)                        │
│   ├── Auth token / headers for file access                       │
│   └── Save/load callbacks (HTML + JSON)                          │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │              RTE v3 PLUGIN (npm package)                  │   │
│   │                                                           │   │
│   │   ┌───────────────────────────────────────────────────┐   │   │
│   │   │  LAYER 2: Vue 3 UI Components                     │   │   │
│   │   │  ├── RTEEditor.vue        (main wrapper)          │   │   │
│   │   │  ├── RTEToolbar.vue       (toolbar buttons)       │   │   │
│   │   │  ├── RTELinkDialog.vue    (link insert/edit)      │   │   │
│   │   │  ├── RTEColorPicker.vue   (text/bg color)         │   │   │
│   │   │  ├── RTEImageUpload.vue   (image upload UI)       │   │   │
│   │   │  ├── RTEFileAttachment.vue(file attach UI)        │   │   │
│   │   │  ├── RTEFormulaEditor.vue (LaTeX input + preview) │   │   │
│   │   │  ├── RTECommentSidebar.vue(comment panel)         │   │   │
│   │   │  ├── RTEAIPanel.vue       (AI chatbox)            │   │   │
│   │   │  └── RTEExportMenu.vue    (download Word/PDF)     │   │   │
│   │   └───────────────────────────────────────────────────┘   │   │
│   │                          │ uses                            │   │
│   │   ┌───────────────────────────────────────────────────┐   │   │
│   │   │  LAYER 1: Pure TypeScript ProseMirror Core        │   │   │
│   │   │  ├── schema/           (document model)           │   │   │
│   │   │  │   ├── nodes.ts      (paragraph, heading,       │   │   │
│   │   │  │   │                  image, fileAttachment,     │   │   │
│   │   │  │   │                  math_inline, math_display) │   │   │
│   │   │  │   ├── marks.ts      (bold, italic, underline,  │   │   │
│   │   │  │   │                  link, textColor, bgColor)  │   │   │
│   │   │  │   └── index.ts      (schema assembly)          │   │   │
│   │   │  ├── plugins/          (ProseMirror plugins)      │   │   │
│   │   │  │   ├── keymap.ts     (keyboard shortcuts)       │   │   │
│   │   │  │   ├── inputRules.ts (auto-formatting)          │   │   │
│   │   │  │   ├── uploadPlugin.ts(drag/drop/paste files)   │   │   │
│   │   │  │   ├── linkPlugin.ts (auto-detect URLs)         │   │   │
│   │   │  │   ├── commentPlugin.ts(comment decorations)    │   │   │
│   │   │  │   └── placeholder.ts(placeholder text)         │   │   │
│   │   │  ├── commands/         (editor commands)          │   │   │
│   │   │  │   ├── formatting.ts (bold, italic, etc.)       │   │   │
│   │   │  │   ├── link.ts       (insert/edit/remove link)  │   │   │
│   │   │  │   ├── image.ts      (insert image)             │   │   │
│   │   │  │   ├── file.ts       (insert file attachment)   │   │   │
│   │   │  │   └── math.ts       (insert formula)           │   │   │
│   │   │  ├── nodeViews/        (custom node renderers)    │   │   │
│   │   │  │   ├── ImageNodeView.ts   (upload progress,     │   │   │
│   │   │  │   │                       resize handles)      │   │   │
│   │   │  │   ├── FileNodeView.ts    (file card UI)        │   │   │
│   │   │  │   └── MathNodeView.ts    (KaTeX render,        │   │   │
│   │   │  │                           LaTeX edit mode)     │   │   │
│   │   │  ├── serializers/      (content export)           │   │   │
│   │   │  │   ├── html.ts       (to/from HTML)             │   │   │
│   │   │  │   └── json.ts       (to/from ProseMirror JSON) │   │   │
│   │   │  └── handlers/         (interface definitions)    │   │   │
│   │   │      ├── upload.ts     (UploadHandler interface)  │   │   │
│   │   │      └── ai.ts         (AIHandler interface)      │   │   │
│   │   └───────────────────────────────────────────────────┘   │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │              HOST APP BACKEND (any)                       │   │
│   │  ├── POST /api/editor/upload    (file upload endpoint)   │   │
│   │  ├── GET  /api/editor/file/:id  (auth-gated file serve)  │   │

### 3.2 ProseMirror Core Modules (npm Dependencies)

| Module | Version | Purpose | License |
|--------|---------|---------|---------|
| `prosemirror-model` | latest | Schema definition (nodes + marks), document model | MIT |
| `prosemirror-state` | latest | Editor state, selection, transactions, plugin system | MIT |
| `prosemirror-view` | latest | EditorView — DOM rendering via contentEditable | MIT |
| `prosemirror-transform` | latest | Document transformations (steps, mapping) | MIT |
| `prosemirror-commands` | latest | Built-in commands (toggleBold, selectAll, joinUp, etc.) | MIT |
| `prosemirror-keymap` | latest | Keyboard shortcut binding | MIT |
| `prosemirror-history` | latest | Undo / redo | MIT |
| `prosemirror-inputrules` | latest | Auto-formatting (e.g., `**bold**` → bold) | MIT |
| `prosemirror-schema-basic` | latest | Reference schema (paragraph, heading, bold, etc.) | MIT |
| `prosemirror-schema-list` | latest | List nodes (bullet, ordered) | MIT |
| `prosemirror-dropcursor` | latest | Visual drop cursor for drag-and-drop | MIT |
| `prosemirror-gapcursor` | latest | Cursor placement in structural gaps | MIT |
| `katex` | latest | LaTeX math rendering | MIT |
| `dompurify` | latest | Client-side HTML sanitization | (Apache 2.0 / MIT dual) |

### 3.3 Dev / Build Dependencies

| Module | Purpose |
|--------|---------|
| `vite` | Dev server + build tool |
| `vue` + `vue-tsc` | Vue 3 framework + TypeScript support |
| `typescript` | Type safety |
| `vitest` | Unit testing |
| `vite-plugin-dts` | Generate `.d.ts` type declarations for npm package |

### 3.4 Build Output (npm Package)

```
dist/
├── index.mjs          ← ESM (for Vite, modern bundlers)
├── index.cjs          ← CJS (for Webpack, require())
├── index.d.ts         ← TypeScript declarations
└── style.css          ← Editor styles (host app imports separately)
```

---

## 4. Schema Design (Document Model)

### 4.1 Nodes

| Node | Group | Type | Attrs | Description |
|------|-------|------|-------|-------------|
| `doc` | — | top-level | — | Root document node |
| `paragraph` | block | block | `textAlign` | Standard paragraph |
| `heading` | block | block | `level (1-6)`, `textAlign` | h1–h6 |
| `blockquote` | block | block | — | Block quote |
| `bullet_list` | block | block | — | Unordered list |
| `ordered_list` | block | block | `start` | Ordered list |
| `list_item` | — | block | — | List item |
| `horizontal_rule` | block | leaf | — | `<hr>` divider |
| `hard_break` | inline | inline | — | `<br>` |
| `image` | block | block | `src, alt, title, width, height, uploading, progress` | Uploaded image |
| `fileAttachment` | block | block | `url, filename, fileSize, mimeType, uploading, progress` | Uploaded file |
| `math_inline` | inline | inline (atom) | `latex` | Inline formula: $x^2$ |
| `math_display` | block | block (atom) | `latex` | Block formula: $$...$$|

### 4.2 Marks

| Mark | Attrs | Keyboard Shortcut | Description |
|------|-------|-------------------|-------------|
| `bold` | — | `Ctrl/Cmd+B` | **Bold text** |
| `italic` | — | `Ctrl/Cmd+I` | *Italic text* |
| `underline` | — | `Ctrl/Cmd+U` | Underlined text |
| `strike` | — | `Ctrl/Cmd+Shift+X` | ~~Strikethrough~~ |
| `textColor` | `color: string` | — (toolbar) | Text foreground color |
| `backgroundColor` | `color: string` | — (toolbar) | Text background/highlight color |
| `link` | `href, target, title` | `Ctrl/Cmd+K` | Hyperlink |
| `code` | — | `Ctrl/Cmd+E` | Inline `code` |

---

## 5. Feature Specifications

### 5.1 Basic: Select All, Copy & Paste

**Implementation:**

| Function | ProseMirror Mechanism | Details |
|----------|----------------------|---------|
| Select All | `selectAll` command from `prosemirror-commands` | Bound to `Ctrl/Cmd+A` via keymap |
| Copy | Built-in `EditorView` clipboard handling | Serializes selection to HTML + ProseMirror slice on clipboard |
| Paste | Built-in `EditorView` clipboard handling | Parses clipboard HTML through schema's `DOMParser` |
| Paste (custom) | Plugin with `handlePaste(view, event, slice)` | Sanitize external HTML (Word, Google Docs), strip unwanted styles |
| Cut | Built-in `EditorView` | Copies then deletes selection |

**Paste Sanitization Pipeline:**

```
Clipboard HTML (from Word/Google Docs/external)
    │
    ▼
Step 1: DOMPurify.sanitize(html)          ← remove scripts, event handlers
    │
    ▼
Step 2: Clean Word-specific markup         ← strip mso-* styles, <o:p> tags
    │
    ▼
Step 3: ProseMirror DOMParser.parse()     ← parse through schema (unknown
    │                                        elements/marks are dropped)
    ▼
Clean ProseMirror Slice → insert into document
```

### 5.2 Basic: Bold (and Inline Formatting)

**Implementation:**

```typescript
// Schema mark definition
bold: {
  parseDOM: [
    { tag: 'strong' },
    { tag: 'b', getAttrs: (node) => node.style.fontWeight !== 'normal' && null },
    { style: 'font-weight=bold' },
    { style: 'font-weight', getAttrs: (value) => /^(bold|[5-9]\d{2,})$/.test(value) && null }
  ],
  toDOM() { return ['strong', 0] }
}

// Command
toggleMark(schema.marks.bold)

// Keymap
keymap({ 'Mod-b': toggleMark(schema.marks.bold) })
```

**Toolbar integration:**
- Toolbar button reads current state: `boldActive = schema.marks.bold.isInSet(state.storedMarks || state.selection.$from.marks())`
- Click toggles: dispatches `toggleMark` command
- Button shows active/pressed state when cursor is inside bold text

### 5.3 Basic: Text Color / Background Color

**Implementation:**

These are custom marks NOT included in `prosemirror-schema-basic`. Defined manually.

```typescript
// Text color mark
textColor: {
  attrs: { color: { default: null } },
  parseDOM: [{ style: 'color', getAttrs: (value) => ({ color: value }) }],
  toDOM(mark) { return ['span', { style: `color: ${mark.attrs.color}` }, 0] }
}

// Background color mark
backgroundColor: {
  attrs: { color: { default: null } },
  parseDOM: [{ style: 'background-color', getAttrs: (value) => ({ color: value }) }],
  toDOM(mark) { return ['span', { style: `background-color: ${mark.attrs.color}` }, 0] }
}
```

**UI:** Custom color palette popover (fixed set of 16–20 colors + optional hex input).

**Command:**
```typescript
function setTextColor(color: string) {
  return (state, dispatch) => {
    const { from, to } = state.selection
    const tr = state.tr.addMark(from, to, schema.marks.textColor.create({ color }))
    dispatch(tr)
    return true
  }
}
```

### 5.4 Advanced: Insert Link

**Schema:**
```typescript
link: {
  attrs: {
    href:   { default: null },
    target: { default: '_blank' },
    title:  { default: null }
  },
  inclusive: false,
  parseDOM: [{
    tag: 'a[href]',
    getAttrs(dom) {
      return {
        href: dom.getAttribute('href'),
        target: dom.getAttribute('target'),
        title: dom.getAttribute('title')
      }
    }
  }],
  toDOM(mark) {
    return ['a', {
      href: mark.attrs.href,
      target: mark.attrs.target,
      title: mark.attrs.title,
      rel: 'noopener noreferrer'
    }, 0]
  }
}
```

**Flow:**

```
INSERT: Select text → Ctrl+K → dialog → enter URL → Apply
        → tr.addMark(from, to, schema.marks.link.create({ href }))

EDIT:   Click linked text → floating tooltip → Edit/Remove
        → Edit: reopen dialog  |  Remove: tr.removeMark()

AUTO-DETECT: Paste URL → handlePaste plugin → regex match → auto-wrap

SECURITY:
- Whitelist protocols: http:, https:, mailto:, tel:
- Block javascript: protocol
- Add rel="noopener noreferrer" to all links
```



### 5.5 Advanced: Insert Image

**Schema Node:**

| Attr | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | null | Image URL (blob: during upload, final URL after) |
| `alt` | string | null | Alt text for accessibility |
| `title` | string | null | Tooltip title |
| `width` | number | null | Display width (for resize) |
| `height` | number | null | Display height (for resize) |
| `uploading` | boolean | false | Internal: shows progress UI |
| `progress` | number | 0 | Internal: upload percentage 0–100 |

**Upload Flow (Option A: POST /api/upload → server disk):**

```
STEP-BY-STEP FLOW:

1. TRIGGER — user performs one of:
   ├── Drag & drop image onto editor    (handleDrop plugin)
   ├── Paste image from clipboard        (handlePaste plugin)
   └── Click toolbar "Insert Image"      (file input dialog)

2. CLIENT VALIDATION (plugin-side)
   ├── Check file.type ∈ ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
   ├── Check file.size ≤ 5MB (5 * 1024 * 1024 bytes)
   └── If invalid → show error toast, STOP

3. INSERT PLACEHOLDER into editor
   ├── Create local blob URL: URL.createObjectURL(file)
   ├── Insert image node: { src: blobURL, uploading: true, progress: 0 }
   └── User sees image immediately (local preview)

4. UPLOAD via host-provided handler
   ├── Plugin calls: uploadHandler.upload(file, onProgress)
   ├── Handler implementation (host app):
   │     const formData = new FormData()
   │     formData.append('file', file)
   │     POST /api/editor/upload  (with auth headers)
   │     → Server validates: MIME type (magic bytes), file size, virus scan
   │     → Server stores to: /storage/editor-uploads/{uuid}.{ext}
   │     → Server returns: { url: "/api/editor/file/{uuid}", filename, fileSize, mimeType }
   ├── onProgress callback updates node: { progress: 45 }, { progress: 80 }...
   └── URL.revokeObjectURL(blobURL)  ← cleanup memory

5. REPLACE PLACEHOLDER
   ├── On success: update node attrs → { src: finalURL, uploading: false }
   └── On failure: remove node OR show retry button

6. AUTH-GATED ACCESS
   └── When rendering <img src="/api/editor/file/{uuid}">
       → Server checks auth → serves file with proper headers
       → Content-Type: image/jpeg
       → Cache-Control: private, max-age=3600
```

**Server-Side Requirements (host app implements):**

```
POST /api/editor/upload
├── Auth: Bearer token (required)
├── Request: multipart/form-data with 'file' field
├── Server validation:
│   ├── Check auth token
│   ├── Read magic bytes → verify actual MIME type (not just extension)
│   ├── Reject if file.size > 5MB
│   ├── Reject if MIME not in whitelist
│   ├── Strip EXIF metadata (GPS, personal data)
│   ├── Optional: ClamAV virus scan
│   └── Generate unique filename: {uuid}.{ext}
├── Store to: /storage/editor-uploads/{uuid}.{ext}
└── Response 200:
    {
      "url": "/api/editor/file/{uuid}",
      "filename": "photo.jpg",
      "fileSize": 234567,
      "mimeType": "image/jpeg"
    }

GET /api/editor/file/{uuid}
├── Auth: Bearer token (required)
├── Check: user has access to this document/file
├── Headers:
│   ├── Content-Type: {actual mime type}
│   ├── Content-Disposition: inline (for images)
│   ├── Cache-Control: private, max-age=3600
│   └── X-Content-Type-Options: nosniff
└── Body: file bytes
```

**Custom NodeView (ImageNodeView.ts):**

```
DISPLAY MODE:
┌─────────────────────────────────┐
│                                 │
│        🖼️  actual image         │
│                                 │
│                              ○  │ ← resize handle (bottom-right)
└─────────────────────────────────┘

UPLOADING MODE:
┌─────────────────────────────────┐
│                                 │
│     🖼️  (blurred preview)      │
│     ████████░░░░░░░ 65%        │ ← progress bar overlay
│                                 │
└─────────────────────────────────┘

SELECTED MODE (click on image):
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │ ← blue border
│  │      🖼️  image            │  │
│  └───────────────────────────┘  │
│  [Alt: "photo"] [Delete 🗑️]    │ ← mini action bar
└─────────────────────────────────┘
```

### 5.6 Advanced: Attach File

**Shares the same upload pipeline as Image (Section 5.5).** Differences:

| Aspect | Image | File Attachment |
|--------|-------|-----------------|
| Schema node name | `image` | `fileAttachment` |
| Renders as | `<img>` with actual image | Styled card with icon + filename |
| Allowed types | image/jpeg, image/png, image/webp, image/gif | application/pdf, .docx, .xlsx, .pptx, .zip, .txt |
| User interaction | View inline | Click to download |
| HTML output | `<img src="..." alt="...">` | `<div class="file-attachment" data-url="..." data-filename="...">` |

**Schema Node Attrs:**

| Attr | Type | Description |
|------|------|-------------|
| `url` | string | Download URL |
| `filename` | string | Original filename |
| `fileSize` | number | File size in bytes |
| `mimeType` | string | MIME type |
| `uploading` | boolean | Upload in progress |
| `progress` | number | Upload percentage |

**NodeView Rendering (FileNodeView.ts):**

```
UPLOADING:
┌──────────────────────────────────────────┐
│  📄  quarterly-report.pdf     (2.3 MB)  │
│       ████████████░░░░ 78%              │
│       [Cancel]                           │
└──────────────────────────────────────────┘

COMPLETE:
┌──────────────────────────────────────────┐
│  📄  quarterly-report.pdf     (2.3 MB)  │
│       [Download ⬇️]  [Delete 🗑️]         │
└──────────────────────────────────────────┘

File icons by MIME type:
  📄 PDF        📊 Excel (.xlsx)
  📝 Word       📑 PowerPoint
  📦 ZIP        📃 Text
```

**Security (file-specific, host app server-side):**

```
Additional checks beyond image upload:
├── Whitelist extensions: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .zip, .txt
├── Block dangerous: .exe, .bat, .sh, .js, .cmd, .msi, .dll, .scr
├── Content-Disposition: attachment (NEVER inline — prevents browser execution)
├── Antivirus scan (ClamAV) — critical for file attachments
└── Separate storage directory from web-accessible root
```

### 5.7 Advanced: Math / Formula (KaTeX)

**Choice:** KaTeX (MIT License, free, ~100KB gzip, fastest render)
**Input method:** Raw LaTeX textarea with live preview (KaTeX is render-only)

**Two node types:**

| Node | Behavior | Trigger | Example |
|------|----------|---------|---------|
| `math_inline` | Inline within text | Type `$...$` or toolbar | "The value $x^2$ is..." |
| `math_display` | Centered block | Type `$$` on empty line or toolbar | Standalone equation |

**Schema:**

```typescript
math_inline: {
  group: 'inline',
  inline: true,
  atom: true,            // single unit — cursor can't enter via ProseMirror
  attrs: { latex: { default: '' } },
  parseDOM: [{
    tag: 'span.math-inline',
    getAttrs(dom) { return { latex: dom.getAttribute('data-latex') } }
  }],
  toDOM(node) {
    return ['span', { class: 'math-inline', 'data-latex': node.attrs.latex }]
  }
}

math_display: {
  group: 'block',
  atom: true,
  attrs: { latex: { default: '' } },
  parseDOM: [{
    tag: 'div.math-display',
    getAttrs(dom) { return { latex: dom.getAttribute('data-latex') } }
  }],
  toDOM(node) {
    return ['div', { class: 'math-display', 'data-latex': node.attrs.latex }]
  }
}
```

**NodeView Lifecycle (MathNodeView.ts):**

```
DISPLAY MODE (default):
┌─────────────────────────────────┐
│          x² + ½                 │  ← rendered by katex.render()
└─────────────────────────────────┘
        ↓ user clicks/double-clicks ↓

EDIT MODE:
┌─────────────────────────────────┐
│  LaTeX input:                   │
│  ┌───────────────────────────┐  │
│  │ x^2 + \frac{1}{2}        │  │  ← <textarea> for raw LaTeX
│  └───────────────────────────┘  │
│  Live preview:                  │
│           x² + ½               │  ← katex.render() updates on each keystroke
│  [✓ Done] [✗ Cancel]           │
└─────────────────────────────────┘

LIFECYCLE:
1. Node created → render static KaTeX output (display mode)
2. User clicks → switch to edit mode (show textarea + live preview)
3. User types LaTeX → katex.render() updates preview on each keystroke
4. User clicks Done → dispatch transaction: update node.attrs.latex
5. Node re-renders in display mode with new formula
6. User clicks Cancel → revert to original LaTeX, back to display mode
7. Backspace/Delete on atom node → deletes entire formula as one unit
```

**Input Rules:**

```
Shortcut triggers:
├── Type $ + latex + $ → creates math_inline node
├── Type $$ on empty line → creates math_display node (enters edit mode)
└── Toolbar button "Σ Insert Formula" → creates math_display at cursor
```

**KaTeX Integration:**

```typescript
import katex from 'katex'
import 'katex/dist/katex.min.css'   // must include CSS

// Render LaTeX to HTML
katex.render('x^2 + \\frac{1}{2}', element, {
  throwOnError: false,              // show error message instead of throwing
  displayMode: true,                // block mode (centered, larger)
  output: 'htmlAndMathml'           // accessible output
})
```

### 5.8 Advanced: Comment Bar / Sidebar

**Architecture:** Comments stored **separately** from document (not as marks in content).
Plugin uses ProseMirror **Decorations** to highlight commented ranges.

**Data Model (host app DB):**

```sql
document_comments
├── id                BIGINT PK
├── document_id       BIGINT FK → documents.id
├── parent_comment_id BIGINT FK NULL        -- for threaded replies
├── from_pos          INT                    -- ProseMirror position start
├── to_pos            INT                    -- ProseMirror position end
├── doc_version       INT                    -- version when positions were recorded
├── content           TEXT                   -- comment text
├── author_id         BIGINT FK
├── author_name       VARCHAR(255)
├── resolved          BOOLEAN DEFAULT FALSE
├── created_at        TIMESTAMP
└── updated_at        TIMESTAMP
```

**Plugin-Side Interface:**

```typescript
interface Comment {
  id: string
  from: number                    // ProseMirror document position
  to: number
  content: string
  authorId: string
  authorName: string
  resolved: boolean
  createdAt: string
  replies: Comment[]              // threaded replies
}

interface CommentHandler {
  load(documentId: string): Promise<Comment[]>
  create(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment>
  update(commentId: string, content: string): Promise<Comment>
  resolve(commentId: string): Promise<void>
  delete(commentId: string): Promise<void>
}
```

**Flow:**

```
ADD COMMENT:
1. User selects text → clicks "Add Comment" (toolbar or right-click)
2. Plugin records: { from: selection.from, to: selection.to }
3. Sidebar opens with input field at that position
4. User types comment → clicks Submit
5. Plugin calls commentHandler.create(...)
6. Plugin adds Decoration (highlight) over the range
7. Sidebar shows the new comment aligned with the highlighted text

VIEW COMMENTS:
┌──────────────────────┬─────────────────────┐
│                      │  COMMENT SIDEBAR    │
│  Document content    │                     │
│  with highlighted    │  💬 John (2:30 PM)  │
│  ████ text ████      │──"This needs review"│
│  that has comments   │   ↳ Reply...        │
│                      │   [Resolve]          │
│                      │                     │
│  More content...     │  💬 Jane (3:15 PM)  │
│                      │  "Consider revising"│
│                      │   [Resolve]          │
└──────────────────────┴─────────────────────┘

POSITION TRACKING:
- When document is edited, ProseMirror Mapping updates comment positions
- Plugin maps old positions → new positions after each transaction
- On save: updated positions are sent to server with new doc_version
```

### 5.9 Advanced: Download / Export (Word & PDF)

**Word (.docx) — Client-Side:**

```
Library: @turbodocx/html-to-docx (MIT license, free)
Flow:   Editor state → serialize to HTML → html-to-docx → Blob → download

Code:
  const html = serializers.toHTML(editorState)
  const docxBlob = await htmlToDocx(html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true
  })
  downloadBlob(docxBlob, 'document.docx')
```

**PDF — Two Options:**

| Approach | Where | Library | Pros | Cons |
|----------|-------|---------|------|------|
| **Client-side** | Browser | `html2pdf.js` (MIT) | No server needed | Limited fidelity, no headers/footers |
| **Server-side** | Host app | Puppeteer / wkhtmltopdf | Pixel-perfect, headers/footers | Requires server-side setup |

```
Client-side PDF flow:
  Editor state → serialize to HTML → html2pdf.js → PDF Blob → download

Server-side PDF flow:
  Editor state → serialize to HTML → POST /api/editor/export/pdf
  → Server: Puppeteer renders HTML → returns PDF bytes → download
```

**Plugin exports a unified interface:**

```typescript
interface ExportOptions {
  format: 'docx' | 'pdf'
  filename?: string
  includeImages?: boolean    // embed images in export
  serverExportUrl?: string   // for server-side PDF (optional)
}

// Plugin provides:
async function exportDocument(
  editorState: EditorState,
  options: ExportOptions
): Promise<Blob>
```

### 5.10 Advanced: AI Chatbox

**Architecture:** Plugin-agnostic AI handler interface. Host app provides the implementation.

**Plugin-Side Interface:**

```typescript
interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface AIOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  context?: string              // selected text or full document for context
}

interface AIHandler {
  // Streaming response (preferred — token-by-token)
  chat(messages: AIMessage[], options?: AIOptions): AsyncIterable<string>

  // Optional: list available models
  models?(): Promise<{ id: string, name: string }[]>

  // Optional: abort in-flight request
  abort?(): void
}
```

**UI Pattern: Side Panel**

```
┌────────────────────────────┬──────────────────────┐
│                            │   AI ASSISTANT       │
│   Editor content           │                      │
│                            │  🤖 How can I help?  │
│   User is editing          │                      │
│   their document           │  User: Summarize     │
│   here...                  │  the selected text   │
│                            │                      │
│                            │  🤖 Here is a        │
│                            │  summary of the...   │ ← streaming response
│                            │  █                   │
│                            │                      │
│                            │  [Insert ↩️] [Copy]   │ ← action buttons
│                            │                      │
│                            │  ┌────────────────┐  │
│                            │  │ Ask anything...│  │ ← input field
│                            │  └────────────────┘  │
└────────────────────────────┴──────────────────────┘
```

**AI Capabilities (plugin provides UI for these actions):**

| Action | What it does | Context sent to AI |
|--------|-------------|-------------------|
| Summarize | Condense selected text | Selected text |
| Improve writing | Fix grammar, clarity | Selected text |
| Make longer/shorter | Expand or condense | Selected text |
| Change tone | Professional, casual, etc. | Selected text |
| Translate | Translate to target language | Selected text |
| Custom prompt | Free-form question | Selected text or full document |

**Insert AI Response into Editor:**

```
User clicks [Insert ↩️]:
1. Get AI response text
2. Parse through ProseMirror schema (in case response has formatting)
3. Option A: Replace selected text → tr.replaceSelection(parsedSlice)
4. Option B: Insert below cursor → tr.insert(pos, parsedNodes)
5. User can Undo (Ctrl+Z) to revert
```

---

## 6. Handler Interfaces Summary (Plugin API)

The plugin exports these interfaces. Host app must implement them.

```typescript
// ============================================================
// UPLOAD HANDLER (required for image + file features)
// ============================================================
interface UploadResult {
  url: string
  filename: string
  fileSize: number
  mimeType: string
}

interface UploadHandler {
  upload(file: File, onProgress?: (percent: number) => void): Promise<UploadResult>
  validate?(file: File): { valid: boolean; error?: string }
  delete?(url: string): Promise<void>
}

// ============================================================
// COMMENT HANDLER (required for comment feature)
// ============================================================
interface CommentHandler {
  load(documentId: string): Promise<Comment[]>
  create(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment>
  update(commentId: string, content: string): Promise<Comment>
  resolve(commentId: string): Promise<void>
  delete(commentId: string): Promise<void>
}

// ============================================================
// AI HANDLER (required for AI chatbox feature)
// ============================================================
interface AIHandler {
  chat(messages: AIMessage[], options?: AIOptions): AsyncIterable<string>
  models?(): Promise<{ id: string; name: string }[]>
  abort?(): void
}

// ============================================================
// EXPORT HANDLER (optional — for server-side PDF)
// ============================================================
interface ExportHandler {
  exportPDF?(html: string): Promise<Blob>
}
```

---

## 7. Content Storage Strategy

**Dual format: HTML + ProseMirror JSON**

| Format | Column | Purpose | Source of Truth |
|--------|--------|---------|----------------|
| ProseMirror JSON | `content_json JSON` | Re-editing (lossless) | ✅ Yes |
| HTML | `content_html LONGTEXT` | Display, search, email, external rendering | No (derived) |

**Why both:**
- JSON preserves custom nodes exactly (math latex, file metadata, comment anchors)
- HTML is universal for display but may lose custom attributes after sanitization
- Load from JSON when re-editing; fall back to HTML if JSON unavailable

**Database Schema:**

```sql
CREATE TABLE documents (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255),
  content_html    LONGTEXT,                 -- sanitized HTML (utf8mb4)
  content_json    JSON,                     -- ProseMirror JSON (source of truth)
  version         INT DEFAULT 1,            -- optimistic locking
  created_by      BIGINT UNSIGNED,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_attachments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id     BIGINT UNSIGNED,
  original_filename VARCHAR(255),
  stored_path     VARCHAR(500),             -- server storage path
  mime_type       VARCHAR(100),
  file_size       BIGINT UNSIGNED,
  uploaded_by     BIGINT UNSIGNED,
  uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_comments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id     BIGINT UNSIGNED,
  parent_comment_id BIGINT UNSIGNED NULL,
  from_pos        INT,
  to_pos          INT,
  doc_version     INT,
  content         TEXT,
  author_id       BIGINT UNSIGNED,
  author_name     VARCHAR(255),
  resolved        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Plugin Save/Load API:**

```typescript
// Plugin emits on every change:
onChange(data: {
  html: string          // serialized HTML
  json: object          // ProseMirror JSON
}) => void

// Plugin loads content:
createEditor({
  content: {
    json: savedJsonFromDB,     // preferred (lossless)
    html: savedHtmlFromDB      // fallback
  }
})
// Load priority: JSON first → HTML fallback → empty document
```

---

## 8. Security Summary

### 8.1 Client-Side (Plugin Responsibility)

| Threat | Mitigation |
|--------|-----------|
| XSS via pasted HTML | DOMPurify sanitization before inserting into editor |
| `javascript:` links | URL protocol whitelist: http, https, mailto, tel only |
| Tab-napping via links | `rel="noopener noreferrer"` on all `<a>` tags |
| Oversized file upload | Client-side file size check (≤ 5MB) before upload |
| Wrong file type upload | Client-side MIME type check against whitelist |
| XSS via filenames | Escape HTML entities when displaying filenames |

### 8.2 Server-Side (Host App Responsibility)

| Threat | Mitigation |
|--------|-----------|
| Forged MIME type | Read magic bytes to verify actual file type |
| XSS in stored HTML | HTMLPurifier (or equivalent) before DB write |
| SVG with embedded scripts | Reject SVG, or sanitize with dedicated SVG sanitizer |
| Malware in uploads | ClamAV antivirus scan |
| EXIF data leakage | Strip EXIF metadata (GPS, camera info) |
| Unauthorized file access | Auth-gated file serving with token verification |
| File execution | `Content-Disposition: attachment` for non-image files |
| MIME sniffing | `X-Content-Type-Options: nosniff` header |
| Directory traversal | Generate UUID filenames (never use user-supplied filenames for storage) |
| SQL injection in content | Parameterized queries (never interpolate content_html into SQL) |

---

## 9. License & Cost Summary

**All dependencies are free and open source:**

| Dependency | License | Cost |
|-----------|---------|------|
| ProseMirror modules (all) | MIT | Free |
| Vue 3 | MIT | Free |
| KaTeX | MIT | Free |
| DOMPurify | Apache 2.0 / MIT | Free |
| @turbodocx/html-to-docx | MIT | Free |
| html2pdf.js (if used) | MIT | Free |
| Vite | MIT | Free |
| TypeScript | Apache 2.0 | Free |

**Total license cost: $0**
**No commercial licenses required for any component.**

---

## 10. Suggested Implementation Phases

| Phase | Features | Estimated Complexity | Dependencies |
|-------|----------|---------------------|--------------|
| **Phase 1: Core Foundation** | Project scaffold + Schema + EditorView + Select All + Copy/Paste + Bold/Italic/Underline + Undo/Redo + Keymap | Medium | None |
| **Phase 2: Formatting** | Text Color + Background Color + Toolbar UI + Color Picker | Low–Medium | Phase 1 |
| **Phase 3: Links** | Insert/Edit/Remove link + Auto-detect URL + Link tooltip | Medium | Phase 1 |
| **Phase 4: Image Upload** | UploadHandler interface + Image node + NodeView + Drag/Drop/Paste + Progress UI + Resize | High | Phase 1 |
| **Phase 5: File Attachment** | FileAttachment node + NodeView + Reuse upload pipeline | Medium | Phase 4 |
| **Phase 6: Math/Formula** | KaTeX integration + math_inline + math_display + NodeView + Input rules | High | Phase 1 |
| **Phase 7: Export** | Word (.docx) client-side + PDF (client or server) + ExportHandler interface | Medium | Phase 1 |
| **Phase 8: Comments** | CommentHandler interface + Decoration plugin + Comment sidebar + Position tracking | High | Phase 1 |
| **Phase 9: AI Chatbox** | AIHandler interface + AI side panel + Streaming UI + Insert response | High | Phase 1 |

---

## 11. Plugin Consumer API (How Host App Uses the Editor)

```vue
<template>
  <RTEditor
    v-model:html="htmlContent"
    v-model:json="jsonContent"
    :upload-handler="uploadHandler"
    :comment-handler="commentHandler"
    :ai-handler="aiHandler"
    :export-handler="exportHandler"
    :config="{
      maxFileSize: 5 * 1024 * 1024,
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      allowedFileTypes: ['application/pdf', '.docx', '.xlsx', '.pptx', '.zip'],
      placeholder: 'Start typing...',
      features: {
        bold: true,
        italic: true,
        underline: true,
        strike: true,
        textColor: true,
        backgroundColor: true,
        link: true,
        image: true,
        fileAttachment: true,
        math: true,
        comments: true,
        export: true,
        ai: true
      }
    }"
    @change="onContentChange"
    @image-upload="onImageUpload"
    @file-upload="onFileUpload"
    @comment-add="onCommentAdd"
  />
</template>
```

---

## 12. Project Directory Structure

```
rte-v3/
├── package.json
├── tsconfig.json
├── vite.config.ts               ← build config (ESM + CJS output)
├── vitest.config.ts             ← test config
├── src/
│   ├── index.ts                 ← main entry (exports everything)
│   ├── core/                    ← Layer 1: Pure ProseMirror (no Vue)
│   │   ├── schema/
│   │   │   ├── nodes.ts         ← all node definitions
│   │   │   ├── marks.ts         ← all mark definitions
│   │   │   └── index.ts         ← assembled Schema
│   │   ├── plugins/
│   │   │   ├── keymap.ts
│   │   │   ├── inputRules.ts
│   │   │   ├── uploadPlugin.ts
│   │   │   ├── linkPlugin.ts
│   │   │   ├── commentPlugin.ts
│   │   │   └── placeholder.ts
│   │   ├── commands/
│   │   │   ├── formatting.ts
│   │   │   ├── link.ts
│   │   │   ├── image.ts
│   │   │   ├── file.ts
│   │   │   └── math.ts
│   │   ├── nodeViews/
│   │   │   ├── ImageNodeView.ts
│   │   │   ├── FileNodeView.ts
│   │   │   └── MathNodeView.ts
│   │   └── serializers/
│   │       ├── html.ts
│   │       └── json.ts
│   ├── handlers/                ← Interface definitions
│   │   ├── upload.ts            ← UploadHandler interface
│   │   ├── comment.ts           ← CommentHandler interface
│   │   ├── ai.ts                ← AIHandler interface
│   │   └── export.ts            ← ExportHandler interface
│   ├── components/              ← Layer 2: Vue 3 UI
│   │   ├── RTEditor.vue         ← main editor wrapper component
│   │   ├── RTToolbar.vue
│   │   ├── RTLinkDialog.vue
│   │   ├── RTColorPicker.vue
│   │   ├── RTImageUpload.vue
│   │   ├── RTFileAttachment.vue
│   │   ├── RTFormulaEditor.vue
│   │   ├── RTCommentSidebar.vue
│   │   ├── RTAIPanel.vue
│   │   └── RTExportMenu.vue
│   ├── composables/             ← Vue composition API hooks
│   │   ├── useEditor.ts
│   │   ├── useUpload.ts
│   │   ├── useComments.ts
│   │   └── useAI.ts
│   ├── styles/                  ← Custom CSS
│   │   ├── editor.css
│   │   ├── toolbar.css
│   │   ├── nodeViews.css
│   │   └── themes/
│   │       ├── default.css
│   │       └── dark.css
│   ├── types/                   ← TypeScript type definitions
│   │   └── index.ts
│   └── utils/
│       ├── sanitize.ts          ← DOMPurify wrapper
│       ├── fileHelpers.ts       ← file size formatting, icon mapping
│       └── urlValidation.ts     ← URL protocol validation
├── demo/                        ← Dev demo app
│   ├── App.vue
│   ├── main.ts
│   └── vite.config.ts
└── tests/
    ├── schema.test.ts
    ├── commands.test.ts
    ├── serializers.test.ts
    └── plugins.test.ts
```

---

**END OF REPORT**

> This document serves as the system analysis and architectural blueprint for the RTE v3 project.
> All features, interfaces, schemas, and security measures have been discussed and confirmed.
> Implementation should follow the phased approach outlined in Section 10.