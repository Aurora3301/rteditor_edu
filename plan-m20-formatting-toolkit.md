# M20 — Formatting Toolkit Implementation Plan

## 1. Overview

Add 6 formatting features to the RTE editor: Subscript, Superscript, Font Family, Font Size, Text Alignment, and Clear Formatting.

### Success Criteria
- All 4 new marks (subscript, superscript, fontFamily, fontSize) render correctly and round-trip through HTML serialization
- Text alignment works on paragraph and heading nodes with inline style output
- Clear formatting removes all marks from selection
- Toolbar UI exposes all new features with proper active-state feedback
- Existing tests remain passing; new features have test coverage

### Scope
- **In scope:** Schema marks, node attrs, commands, toolbar UI, i18n, CSS
- **Out of scope:** Keyboard shortcuts for new features (except clear formatting optionally), color marks, line-height

---

## 2. Wave Breakdown

The work is split into 3 waves. **Waves 1A and 1B can execute in parallel** since they touch different parts of the schema and have no interdependencies.

### Wave 1A: Subscript + Superscript Marks (no dependencies)
### Wave 1B: Font Family + Font Size Marks (no dependencies)  
### Wave 1C: Text Alignment Node Attr (no dependencies with 1A/1B)
### Wave 2: Commands + useEditor Integration (depends on Wave 1)
### Wave 3: Toolbar UI + i18n + CSS (depends on Wave 2)

---

## 3. Implementation Steps

### Wave 1A — Subscript + Superscript Marks

**Step 1: Add marks to `src/core/schema/marks.ts`**

After the `code` mark (line 70), append:

```typescript
subscript: {
  excludes: 'superscript',
  parseDOM: [{ tag: 'sub' }],
  toDOM() {
    return ['sub', 0]
  },
},

superscript: {
  excludes: 'subscript',
  parseDOM: [{ tag: 'sup' }],
  toDOM() {
    return ['sup', 0]
  },
},
```

**Step 2: Add CSS to `src/styles/content/inline.css`**

Append after the `s` rule:

```css
.rte-editor .ProseMirror sub {
  font-size: 0.75em;
  vertical-align: sub;
}

.rte-editor .ProseMirror sup {
  font-size: 0.75em;
  vertical-align: super;
}
```

No other files change in this wave.

---

### Wave 1B — Font Family + Font Size Marks

**Step 3: Add marks to `src/core/schema/marks.ts`**

After the superscript mark, append:

```typescript
fontFamily: {
  attrs: { family: {} },
  parseDOM: [{
    style: 'font-family',
    getAttrs: (value) => ({ family: (value as string).replace(/['"]/g, '') }),
  }],
  toDOM(mark) {
    return ['span', { style: `font-family: ${mark.attrs.family}` }, 0]
  },
},

fontSize: {
  attrs: { size: {} },
  parseDOM: [{
    style: 'font-size',
    getAttrs: (value) => ({ size: value as string }),
  }],
  toDOM(mark) {
    return ['span', { style: `font-size: ${mark.attrs.size}` }, 0]
  },
},
```

No CSS needed — inline styles handle rendering.

---

### Wave 1C — Text Alignment on Paragraph + Heading Nodes

**Step 4: Modify `src/core/schema/nodes.ts`**

Update the `paragraph` node (lines 8-15):

```typescript
paragraph: {
  content: 'inline*',
  group: 'block',
  attrs: { textAlign: { default: null } },
  parseDOM: [{
    tag: 'p',
    getAttrs(dom: HTMLElement) {
      return { textAlign: dom.style.textAlign || null }
    },
  }],
  toDOM(node) {
    const attrs: Record<string, string> = {}
    if (node.attrs.textAlign) {
      attrs.style = `text-align: ${node.attrs.textAlign}`
    }
    return ['p', attrs, 0]
  },
},
```

Update the `heading` node (lines 17-29):

```typescript
heading: {
  content: 'inline*',
  group: 'block',
  attrs: { level: { default: 1 }, textAlign: { default: null } },
  parseDOM: [
    {
      tag: 'h1',
      getAttrs(dom: HTMLElement) {
        return { level: 1, textAlign: dom.style.textAlign || null }
      },
    },
    {
      tag: 'h2',
      getAttrs(dom: HTMLElement) {
        return { level: 2, textAlign: dom.style.textAlign || null }
      },
    },
    {
      tag: 'h3',
      getAttrs(dom: HTMLElement) {
        return { level: 3, textAlign: dom.style.textAlign || null }
      },
    },
  ],
  toDOM(node) {
    const attrs: Record<string, string> = {}
    if (node.attrs.textAlign) {
      attrs.style = `text-align: ${node.attrs.textAlign}`
    }
    return [`h${node.attrs.level}`, attrs, 0]
  },
},
```

---

### Wave 2 — Commands + State Helpers

**Step 5: Add commands to `src/core/commands/formatting.ts`**

After `toggleCode` (line 16), add new mark toggles:

```typescript
export const toggleSubscript: Command = toggleMark(schema.marks.subscript)
export const toggleSuperscript: Command = toggleMark(schema.marks.superscript)
```

Add parameterized mark commands (after the mark toggles section):

```typescript
// ── Font mark commands ──────────────────────────────────────────────

export function setFontFamily(family: string | null): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    if (family === null) {
      return toggleMark(schema.marks.fontFamily)(state, dispatch)
    }
    const mark = schema.marks.fontFamily.create({ family })
    const { from, to, empty } = state.selection
    if (dispatch) {
      if (empty) {
        // Store mark for next typed character
        const tr = state.tr
        if (schema.marks.fontFamily.isInSet(state.storedMarks || state.selection.$from.marks())) {
          tr.removeStoredMark(schema.marks.fontFamily)
        }
        tr.addStoredMark(mark)
        dispatch(tr)
      } else {
        dispatch(state.tr.addMark(from, to, mark))
      }
    }
    return true
  }
}

export function setFontSize(size: string | null): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    if (size === null) {
      return toggleMark(schema.marks.fontSize)(state, dispatch)
    }
    const mark = schema.marks.fontSize.create({ size })
    const { from, to, empty } = state.selection
    if (dispatch) {
      if (empty) {
        const tr = state.tr
        if (schema.marks.fontSize.isInSet(state.storedMarks || state.selection.$from.marks())) {
          tr.removeStoredMark(schema.marks.fontSize)
        }
        tr.addStoredMark(mark)
        dispatch(tr)
      } else {
        dispatch(state.tr.addMark(from, to, mark))
      }
    }
    return true
  }
}
```

Add text alignment command:

```typescript
// ── Text alignment command ──────────────────────────────────────────

export function setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify' | null): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { from, to } = state.selection
    if (dispatch) {
      const tr = state.tr
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type === schema.nodes.paragraph || node.type === schema.nodes.heading) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            textAlign: alignment === 'left' ? null : alignment,
          })
        }
      })
      dispatch(tr.scrollIntoView())
    }
    return true
  }
}
```

Add clear formatting command:

```typescript
// ── Clear formatting ────────────────────────────────────────────────

export function clearFormatting(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { from, to, empty } = state.selection
  if (empty) return false
  if (dispatch) {
    const tr = state.tr
    // Remove all marks in the selection
    for (const markName of Object.keys(schema.marks)) {
      tr.removeMark(from, to, schema.marks[markName])
    }
    dispatch(tr.scrollIntoView())
  }
  return true
}
```

Add state helpers for reading current font/alignment:

```typescript
// Get the current fontFamily value at selection (or null)
export function getActiveFontFamily(state: EditorState): string | null {
  const { $from, empty, from, to } = state.selection
  const marks = empty ? (state.storedMarks || $from.marks()) : []
  if (empty) {
    const fm = schema.marks.fontFamily.isInSet(marks)
    return fm ? fm.attrs.family : null
  }
  // For range selection, check first character
  const node = state.doc.nodeAt(from)
  if (node) {
    const fm = schema.marks.fontFamily.isInSet(node.marks)
    return fm ? fm.attrs.family : null
  }
  return null
}

// Get the current fontSize value at selection (or null)
export function getActiveFontSize(state: EditorState): string | null {
  const { $from, empty, from } = state.selection
  const marks = empty ? (state.storedMarks || $from.marks()) : []
  if (empty) {
    const fm = schema.marks.fontSize.isInSet(marks)
    return fm ? fm.attrs.size : null
  }
  const node = state.doc.nodeAt(from)
  if (node) {
    const fm = schema.marks.fontSize.isInSet(node.marks)
    return fm ? fm.attrs.size : null
  }
  return null
}

// Get the current textAlign value of the selection's block
export function getActiveTextAlign(state: EditorState): string | null {
  const { $from } = state.selection
  const node = $from.parent
  if (node.type === schema.nodes.paragraph || node.type === schema.nodes.heading) {
    return node.attrs.textAlign || null
  }
  return null
}
```

**Step 6: Export new commands from `src/core/commands/index.ts`**

Add to the export list:

```typescript
export {
  // ... existing exports ...

  // New mark toggles
  toggleSubscript,
  toggleSuperscript,

  // Font commands
  setFontFamily,
  setFontSize,

  // Text alignment
  setTextAlign,

  // Clear formatting
  clearFormatting,

  // State getters
  getActiveFontFamily,
  getActiveFontSize,
  getActiveTextAlign,
} from './formatting'
```

---

### Wave 2 (continued) — useEditor Integration

**Step 7: Extend `EditorActiveState` in `src/composables/useEditor.ts`**

Add new fields to the `EditorActiveState` interface (after line 43):

```typescript
export interface EditorActiveState {
  // ... existing fields ...
  subscript: boolean
  superscript: boolean
  fontFamily: string | null
  fontSize: string | null
  textAlign: string | null
}
```

**Step 8: Update `updateActiveState()` function**

Add after the existing mark checks (after line 95):

```typescript
activeState.subscript = isMarkActive(schema.marks.subscript)(state)
activeState.superscript = isMarkActive(schema.marks.superscript)(state)
activeState.fontFamily = getActiveFontFamily(state)
activeState.fontSize = getActiveFontSize(state)
activeState.textAlign = getActiveTextAlign(state)
```

**Step 9: Add new commands to the `commands` object**

Add to the commands object (after line 172):

```typescript
toggleSubscript: () => execCommand(toggleSubscript),
toggleSuperscript: () => execCommand(toggleSuperscript),
setFontFamily: (family: string | null) => execCommand(setFontFamily(family)),
setFontSize: (size: string | null) => execCommand(setFontSize(size)),
setTextAlign: (align: 'left' | 'center' | 'right' | 'justify' | null) => execCommand(setTextAlign(align)),
clearFormatting: () => execCommand(clearFormatting),
```

Update imports at line 9 to include new commands:

```typescript
import {
  toggleBold, toggleItalic, toggleUnderline, toggleStrike, toggleCode,
  toggleSubscript, toggleSuperscript,
  setHeading, setParagraph, toggleBulletList, toggleOrderedList,
  toggleBlockquote, insertHorizontalRule, undo, redo,
  setFontFamily, setFontSize, setTextAlign, clearFormatting,
  isMarkActive, isBlockActive, canUndo, canRedo,
  getActiveFontFamily, getActiveFontSize, getActiveTextAlign,
} from '../core/commands'
```

---

### Wave 3 — Toolbar UI + i18n + CSS

**Step 10: Add i18n translations to `src/i18n/en.ts`**

Add to `toolbar` section:

```typescript
toolbar: {
  // ... existing entries ...
  subscript: 'Subscript',
  superscript: 'Superscript',
  fontFamily: 'Font Family',
  fontSize: 'Font Size',
  alignLeft: 'Align Left',
  alignCenter: 'Align Center',
  alignRight: 'Align Right',
  alignJustify: 'Justify',
  clearFormatting: 'Clear Formatting',
},
```

**Step 11: Add i18n translations to `src/i18n/zh-TW.ts`**

```typescript
toolbar: {
  // ... existing entries ...
  subscript: '下標',
  superscript: '上標',
  fontFamily: '字型',
  fontSize: '字型大小',
  alignLeft: '靠左對齊',
  alignCenter: '置中對齊',
  alignRight: '靠右對齊',
  alignJustify: '左右對齊',
  clearFormatting: '清除格式',
},
```

**Step 12: Update `src/components/RTToolbar.vue`**

Update the `commands` prop type to include new commands. Add the following toolbar groups to the template:

After Group 1 (inline formatting), add sub/sup buttons:

```html
<button
  type="button"
  class="rte-toolbar__button"
  :class="{ 'rte-toolbar__button--active': activeState.subscript }"
  :aria-pressed="activeState.subscript"
  aria-label="Subscript"
  title="Subscript"
  @click="commands.toggleSubscript()"
>
  X<sub>2</sub>
</button>
<button
  type="button"
  class="rte-toolbar__button"
  :class="{ 'rte-toolbar__button--active': activeState.superscript }"
  :aria-pressed="activeState.superscript"
  aria-label="Superscript"
  title="Superscript"
  @click="commands.toggleSuperscript()"
>
  X<sup>2</sup>
</button>
```

Add new group after inline formatting for Font Family + Font Size dropdowns:

```html
<div class="rte-toolbar__separator" role="separator"></div>

<!-- Group: Font Family + Font Size -->
<div class="rte-toolbar__group">
  <select
    class="rte-toolbar__select"
    :value="activeState.fontFamily || ''"
    aria-label="Font Family"
    @change="commands.setFontFamily(($event.target as HTMLSelectElement).value || null)"
  >
    <option value="">Font</option>
    <option value="Inter">Inter</option>
    <option value="Arial">Arial</option>
    <option value="Times New Roman">Times New Roman</option>
    <option value="Georgia">Georgia</option>
    <option value="Courier New">Courier New</option>
    <option value="Verdana">Verdana</option>
    <option value="Trebuchet MS">Trebuchet MS</option>
  </select>

  <select
    class="rte-toolbar__select"
    :value="activeState.fontSize || ''"
    aria-label="Font Size"
    @change="commands.setFontSize(($event.target as HTMLSelectElement).value || null)"
  >
    <option value="">Size</option>
    <option v-for="s in fontSizes" :key="s" :value="s">{{ s }}</option>
  </select>
</div>
```

Add a `<script>` constant for font sizes:

```typescript
const fontSizes = ['8px','9px','10px','11px','12px','14px','16px','18px','20px','24px','28px','32px','36px','48px','72px']
```

Add text alignment group:

```html
<div class="rte-toolbar__separator" role="separator"></div>

<!-- Group: Text Alignment -->
<div class="rte-toolbar__group">
  <button type="button" class="rte-toolbar__button"
    :class="{ 'rte-toolbar__button--active': !activeState.textAlign || activeState.textAlign === 'left' }"
    aria-label="Align Left" title="Align Left"
    @click="commands.setTextAlign(null)">≡</button>
  <button type="button" class="rte-toolbar__button"
    :class="{ 'rte-toolbar__button--active': activeState.textAlign === 'center' }"
    aria-label="Align Center" title="Align Center"
    @click="commands.setTextAlign('center')">⁌</button>
  <button type="button" class="rte-toolbar__button"
    :class="{ 'rte-toolbar__button--active': activeState.textAlign === 'right' }"
    aria-label="Align Right" title="Align Right"
    @click="commands.setTextAlign('right')">⁍</button>
  <button type="button" class="rte-toolbar__button"
    :class="{ 'rte-toolbar__button--active': activeState.textAlign === 'justify' }"
    aria-label="Justify" title="Justify"
    @click="commands.setTextAlign('justify')">⁑</button>
</div>
```

Add clear formatting button (before or in the history group):

```html
<div class="rte-toolbar__separator" role="separator"></div>

<!-- Group: Clear Formatting -->
<div class="rte-toolbar__group">
  <button type="button" class="rte-toolbar__button"
    aria-label="Clear Formatting" title="Clear Formatting"
    @click="commands.clearFormatting()">
    Tₓ
  </button>
</div>
```

Update the commands prop type definition to include new commands:

```typescript
commands: {
  // ... existing ...
  toggleSubscript: () => void
  toggleSuperscript: () => void
  setFontFamily: (family: string | null) => void
  setFontSize: (size: string | null) => void
  setTextAlign: (align: 'left' | 'center' | 'right' | 'justify' | null) => void
  clearFormatting: () => void
}
```

**Step 13: Add CSS for toolbar select elements**

Append to `src/styles/components/toolbar-button.css`:

```css
/* ── Toolbar select (dropdown) ── */
.rte-toolbar__select {
  appearance: none;
  border: 1px solid var(--rte-border);
  background: var(--rte-bg);
  color: var(--rte-text-secondary);
  border-radius: var(--rte-radius);
  height: 30px;
  padding: 0 var(--rte-sp-3) 0 var(--rte-sp-2);
  font-size: var(--rte-text-sm);
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  min-width: 70px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  transition:
    border-color var(--rte-duration-fast) var(--rte-ease),
    color var(--rte-duration-fast) var(--rte-ease);
}
.rte-toolbar__select:hover {
  border-color: var(--rte-border-strong);
  color: var(--rte-text);
}
.rte-toolbar__select:focus-visible {
  outline: none;
  box-shadow: var(--rte-ring);
}
```

---

## 4. File Changes Summary

| File | Action | Wave |
|------|--------|------|
| `src/core/schema/marks.ts` | **Modify** — add subscript, superscript, fontFamily, fontSize | 1A, 1B |
| `src/core/schema/nodes.ts` | **Modify** — add textAlign attr to paragraph + heading | 1C |
| `src/core/commands/formatting.ts` | **Modify** — add 6 new commands + 3 state getters | 2 |
| `src/core/commands/index.ts` | **Modify** — export new symbols | 2 |
| `src/composables/useEditor.ts` | **Modify** — extend activeState, imports, commands | 2 |
| `src/components/RTToolbar.vue` | **Modify** — add new toolbar groups + prop types | 3 |
| `src/i18n/en.ts` | **Modify** — add 9 new toolbar translation keys | 3 |
| `src/i18n/zh-TW.ts` | **Modify** — add 9 new toolbar translation keys | 3 |
| `src/styles/content/inline.css` | **Modify** — add sub/sup styling | 1A |
| `src/styles/components/toolbar-button.css` | **Modify** — add `.rte-toolbar__select` | 3 |

**No new files are created.** All changes are modifications to existing files.

---

## 5. Testing Strategy

### Unit Tests (update existing test files)

**`src/core/schema/__tests__/schema.test.ts`** — add tests for:
- subscript mark creates `<sub>` element
- superscript mark creates `<sup>` element
- subscript and superscript are mutually exclusive (`excludes`)
- fontFamily mark renders inline style
- fontSize mark renders inline style
- paragraph with textAlign attr renders `style="text-align: center"`
- heading with textAlign attr renders correctly
- parseDOM round-trips for all new marks and attrs

**`src/core/commands/__tests__/commands.test.ts`** — add tests for:
- `toggleSubscript` toggles subscript mark on/off
- `toggleSuperscript` toggles superscript mark on/off
- `setFontFamily('Arial')` applies fontFamily mark
- `setFontFamily(null)` removes fontFamily mark
- `setFontSize('16px')` applies fontSize mark
- `setFontSize(null)` removes fontSize mark
- `setTextAlign('center')` sets textAlign on paragraph
- `setTextAlign(null)` resets textAlign to default
- `clearFormatting` removes all marks from selection
- `clearFormatting` returns false on empty selection
- `getActiveFontFamily` / `getActiveFontSize` / `getActiveTextAlign` return correct values

### Manual Testing Steps
1. Toggle subscript/superscript buttons — verify text renders correctly
2. Apply subscript, then toggle superscript — verify they are mutually exclusive
3. Select font family from dropdown — verify text changes
4. Select font size from dropdown — verify text changes
5. Select text, change alignment — verify paragraph alignment changes
6. Apply bold + italic + font size, then clear formatting — verify all marks removed
7. Verify HTML serialization: export to HTML, re-import, all formatting preserved
8. Test in dark mode — verify all new UI elements are themed
9. Test responsive behavior — verify toolbar scrolls horizontally on small screens

---

## 6. Rollback Plan

All changes are in-source modifications with no data migrations. To rollback:
1. Revert all file modifications (git revert or checkout)
2. No database or config changes to undo
3. No new dependencies added

---

## 7. Estimated Effort

| Wave | Effort | Complexity |
|------|--------|------------|
| Wave 1A (sub/sup marks) | ~20 min | Low |
| Wave 1B (font marks) | ~20 min | Low |
| Wave 1C (textAlign attr) | ~25 min | Low-Medium |
| Wave 2 (commands + composable) | ~45 min | Medium |
| Wave 3 (toolbar UI + i18n + CSS) | ~60 min | Medium |
| Testing | ~45 min | Medium |
| **Total** | **~3.5 hours** | **Medium** |

Waves 1A, 1B, and 1C can be done in parallel, saving ~30 min of wall-clock time.

