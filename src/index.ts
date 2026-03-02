// ── Components ──
export { default as RTEditor } from './components/RTEditor.vue'
export { default as RTToolbar } from './components/RTToolbar.vue'
export { default as RTBubbleMenu } from './components/RTBubbleMenu.vue'

// ── Composables ──
export { useEditor } from './composables/useEditor'

// ── Core (for advanced usage) ──
export * from './core'

// ── i18n ──
export { useI18n, provideI18n } from './i18n'
export type { Locale, Messages } from './i18n'

// ── Types ──
export type { EditorOptions } from './core/editor'
export type { EditorActiveState, UseEditorOptions } from './composables/useEditor'
export type { RTEditorProps } from './components/RTEditor.vue'
export type { ThemeOverrides } from './types'

// ── ProseMirror re-exports (for advanced consumers) ──
export type { Command } from 'prosemirror-state'
export type { EditorView } from 'prosemirror-view'
export type { EditorState, Transaction } from 'prosemirror-state'
export type { Node as ProseMirrorNode, Mark, Schema } from 'prosemirror-model'

// ── Theme ──
export { defineTheme } from './types'
export { presetThemes, blueSteel, forest, rose, amber } from './themes/presets'

// ── Styles (side-effect import — bundler will extract CSS) ──
import './styles/index.css'
