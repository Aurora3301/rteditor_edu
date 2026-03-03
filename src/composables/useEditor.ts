import { ref, shallowRef, onMounted, onBeforeUnmount, Ref, reactive, markRaw } from 'vue'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { createEditor, destroyEditor, EditorOptions } from '../core/editor'
import { toHTML, fromHTML } from '../core/serializers/html'
import { toJSON, fromJSON } from '../core/serializers/json'
import { schema } from '../core/schema'
import {
  toggleBold, toggleItalic, toggleUnderline, toggleStrike,
  toggleSubscript, toggleSuperscript, setFontFamily, setFontSize,
  setHeading, setParagraph, setTextAlign, toggleBulletList, toggleOrderedList,
  toggleBlockquote, insertHorizontalRule, insertImage, clearFormatting, undo, redo,
  setLink, removeLink, getActiveLinkAttrs,
  isMarkActive, isBlockActive, canUndo, canRedo,
  getTextAlign, getActiveFontFamily, getActiveFontSize,
  setTextColor, removeTextColor, getActiveTextColor,
  setHighlight, removeHighlight, getActiveHighlight,
  insertTable,
} from '../core/commands'
import { activateDrag, deactivateDrag, isDragActive } from '../core/plugins/dragHandle'
import { getDocStats, getSelectionStats } from '../core/utils/wordCount'
import { toMarkdown } from '../core/serializers/markdown'
import { isSlashMenuActive, slashMenuKey } from '../core/plugins/slashMenu'

/**
 * Options for the {@link useEditor} composable.
 *
 * @example
 * ```ts
 * const editorRef = ref<HTMLElement | null>(null)
 * const { html, commands, activeState } = useEditor({
 *   containerRef: editorRef,
 *   initialHTML: '<p>Hello</p>',
 *   placeholder: 'Start typing…',
 * })
 * ```
 */
export interface UseEditorOptions {
  /** Vue ref pointing to the container DOM element where ProseMirror will mount */
  containerRef: Ref<HTMLElement | null>
  /** Initial HTML string to populate the editor */
  initialHTML?: string
  /** Initial JSON document (takes priority over `initialHTML` when both are provided) */
  initialJSON?: Record<string, any>
  /** Placeholder text shown when the editor is empty */
  placeholder?: string
  /** Whether the editor is editable (`true` by default). Set to `false` for read-only mode. */
  editable?: boolean
  /** Debounce delay (ms) for serializing content to `html` / `json` refs. Default: `300` */
  debounce?: number
}

/**
 * Reactive snapshot of the active formatting state at the current selection.
 *
 * Updated on every ProseMirror transaction (including cursor moves).
 * Use this to drive toolbar button active/disabled states.
 */
export interface EditorActiveState {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  subscript: boolean
  superscript: boolean
  heading1: boolean
  heading2: boolean
  heading3: boolean
  blockType: 'paragraph' | 'h1' | 'h2' | 'h3'
  bulletList: boolean
  orderedList: boolean
  blockquote: boolean
  canUndo: boolean
  canRedo: boolean
  textAlign: string | null
  fontFamily: string | null
  fontSize: string | null
  link: boolean
  linkAttrs: { href: string; title: string | null; target: string } | null
  dragActive: boolean
  textColor: string | null
  highlight: string | null
  inTable: boolean
}

/**
 * Vue composable that creates and manages a ProseMirror editor instance.
 *
 * Provides reactive `html` / `json` content refs, an `activeState` object for
 * toolbar bindings, and a `commands` bag for triggering formatting actions.
 *
 * The editor is created on `onMounted` and destroyed on `onBeforeUnmount`.
 *
 * @param options - Configuration for the editor instance
 * @returns Reactive editor state, content refs, and command functions
 */
export function useEditor(options: UseEditorOptions) {
  const view = shallowRef<EditorView | null>(null)
  const html = ref('')
  const json = ref<Record<string, any>>({})
  const isFocused = ref(false)

  // Reactive object tracking which formatting is active at current selection
  const activeState = reactive<EditorActiveState>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    subscript: false,
    superscript: false,
    heading1: false,
    heading2: false,
    heading3: false,
    blockType: 'paragraph',
    bulletList: false,
    orderedList: false,
    blockquote: false,
    canUndo: false,
    canRedo: false,
    textAlign: null,
    fontFamily: null,
    fontSize: null,
    link: false,
    linkAttrs: null,
    dragActive: false,
    textColor: null,
    highlight: null,
    inTable: false,
  })

  // ── Debounced serialization ──
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const debounceMs = options.debounce ?? 300

  function serializeContent(state: EditorState) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      html.value = toHTML(state.doc)
      json.value = toJSON(state.doc)
    }, debounceMs)
  }

  // ── Update active state (runs on EVERY transaction, including selection changes) ──
  function updateActiveState(state: EditorState) {
    activeState.bold = isMarkActive(schema.marks.bold)(state)
    activeState.italic = isMarkActive(schema.marks.italic)(state)
    activeState.underline = isMarkActive(schema.marks.underline)(state)
    activeState.strike = isMarkActive(schema.marks.strike)(state)
    activeState.heading1 = isBlockActive(schema.nodes.heading, { level: 1 })(state)
    activeState.heading2 = isBlockActive(schema.nodes.heading, { level: 2 })(state)
    activeState.heading3 = isBlockActive(schema.nodes.heading, { level: 3 })(state)
    // Determine current block type
    const { $from } = state.selection
    const parentType = $from.parent.type
    if (parentType === schema.nodes.heading) {
      const level = $from.parent.attrs.level
      activeState.blockType = `h${level}` as 'h1' | 'h2' | 'h3'
    } else {
      activeState.blockType = 'paragraph'
    }
    activeState.bulletList = isBlockActive(schema.nodes.bullet_list)(state)
    activeState.orderedList = isBlockActive(schema.nodes.ordered_list)(state)
    activeState.blockquote = isBlockActive(schema.nodes.blockquote)(state)
    activeState.subscript = isMarkActive(schema.marks.subscript)(state)
    activeState.superscript = isMarkActive(schema.marks.superscript)(state)
    activeState.canUndo = canUndo(state)
    activeState.canRedo = canRedo(state)
    activeState.textAlign = getTextAlign(state)
    activeState.fontFamily = getActiveFontFamily(state)
    activeState.fontSize = getActiveFontSize(state)
    activeState.link = isMarkActive(schema.marks.link)(state)
    activeState.linkAttrs = getActiveLinkAttrs(state)
    activeState.dragActive = isDragActive(state)
    activeState.textColor = getActiveTextColor(state)
    activeState.highlight = getActiveHighlight(state)
    // Check if cursor is inside a table cell
    activeState.inTable = (() => {
      const { $from } = state.selection
      for (let d = $from.depth; d >= 0; d--) {
        const node = $from.node(d)
        if (node.type.name === 'table_cell' || node.type.name === 'table_header') return true
      }
      return false
    })()
  }

  // ── Lifecycle ──
  onMounted(() => {
    if (!options.containerRef.value) return

    const content: EditorOptions['content'] = {}
    if (options.initialJSON) {
      content.json = options.initialJSON
    } else if (options.initialHTML) {
      content.html = options.initialHTML
    }

    const editorView = createEditor({
      element: options.containerRef.value,
      content: Object.keys(content).length > 0 ? content : undefined,
      placeholder: options.placeholder,
      editable: options.editable,

      onUpdate(state: EditorState) {
        serializeContent(state)
      },

      onTransaction(state: EditorState) {
        updateActiveState(state)
      },

      onFocus() {
        isFocused.value = true
      },

      onBlur() {
        isFocused.value = false
      },
    })

    // markRaw prevents Vue from making EditorView reactive
    view.value = markRaw(editorView)

    // Initial serialization + active state
    const initialState = editorView.state
    html.value = toHTML(initialState.doc)
    json.value = toJSON(initialState.doc)
    updateActiveState(initialState)
  })

  onBeforeUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (view.value) {
      destroyEditor(view.value)
      view.value = null
    }
  })

  // ── Commands (callable from toolbar) ──
  function execCommand(cmd: (state: EditorState, dispatch?: any) => boolean) {
    const v = view.value
    if (!v) return
    cmd(v.state, v.dispatch)
    v.focus()
    // updateActiveState is already called via onTransaction — no double call needed
  }

  const commands = {
    toggleBold: () => execCommand(toggleBold),
    toggleItalic: () => execCommand(toggleItalic),
    toggleUnderline: () => execCommand(toggleUnderline),
    toggleStrike: () => execCommand(toggleStrike),
    setHeading: (level: 1 | 2 | 3) => execCommand(setHeading(level)),
    setParagraph: () => execCommand(setParagraph),
    toggleBulletList: () => execCommand(toggleBulletList),
    toggleOrderedList: () => execCommand(toggleOrderedList),
    toggleBlockquote: () => execCommand(toggleBlockquote),
    insertHorizontalRule: () => execCommand(insertHorizontalRule),
    undo: () => execCommand(undo),
    redo: () => execCommand(redo),
    toggleSubscript: () => execCommand(toggleSubscript),
    toggleSuperscript: () => execCommand(toggleSuperscript),
    setFontFamily: (family: string | null) => execCommand(setFontFamily(family)),
    setFontSize: (size: string | null) => execCommand(setFontSize(size)),
    setTextAlign: (align: string | null) => execCommand(setTextAlign(align)),
    clearFormatting: () => execCommand(clearFormatting),
    setLink: (href: string, title?: string) => execCommand(setLink(href, title)),
    removeLink: () => execCommand(removeLink),
    insertImage: (attrs: { src: string; alt?: string; title?: string }) => execCommand(insertImage(attrs)),
    activateDrag: () => execCommand(activateDrag),
    deactivateDrag: () => execCommand(deactivateDrag),
    toggleDrag: () => {
      const v = view.value
      if (!v) return
      if (isDragActive(v.state)) {
        execCommand(deactivateDrag)
      } else {
        execCommand(activateDrag)
      }
    },
    setTextColor: (color: string) => execCommand(setTextColor(color)),
    removeTextColor: () => execCommand(removeTextColor),
    setHighlight: (color: string) => execCommand(setHighlight(color)),
    removeHighlight: () => execCommand(removeHighlight),
    insertTable: (rows: number, cols: number, hasHeader: boolean) => execCommand(insertTable(rows, cols, hasHeader)),
  }

  // ── Set content programmatically ──
  function setHTML(newHTML: string) {
    const v = view.value
    if (!v) return
    const doc = fromHTML(newHTML)
    const tr = v.state.tr.replaceWith(0, v.state.doc.content.size, doc.content)
    v.dispatch(tr)
  }

  function setJSON(newJSON: Record<string, any>) {
    const v = view.value
    if (!v) return
    const doc = fromJSON(newJSON)
    const tr = v.state.tr.replaceWith(0, v.state.doc.content.size, doc.content)
    v.dispatch(tr)
  }

  function getStats() {
    const v = view.value
    if (!v) return null
    const state = v.state
    const { from, to, empty } = state.selection
    const docStats = getDocStats(state.doc)
    const selStats = empty ? null : getSelectionStats(state.doc.textBetween(from, to, ' '))
    return { docStats, selStats }
  }

  function exportMarkdown(): string {
    const v = view.value
    if (!v) return ''
    return toMarkdown(v.state.doc)
  }

  return {
    /** The ProseMirror EditorView (shallowRef — don't deep-watch!) */
    view,
    /** Current HTML content (debounced) */
    html,
    /** Current JSON content (debounced) */
    json,
    /** Whether the editor is focused */
    isFocused,
    /** Reactive active formatting state */
    activeState,
    /** Command functions for toolbar */
    commands,
    /** Programmatically set HTML content */
    setHTML,
    /** Programmatically set JSON content */
    setJSON,
    /** Get document and selection word/char stats */
    getStats,
    /** Export document as Markdown string */
    exportMarkdown,
  }
}
