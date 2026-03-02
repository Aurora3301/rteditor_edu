// Re-export all public types from their source modules

/** Options for the {@link createEditor} factory function */
export type { EditorOptions } from '../core/editor'

/** Reactive object describing which formatting marks/blocks are active at the current selection */
export type { EditorActiveState } from '../composables/useEditor'

/** Options accepted by the {@link useEditor} composable */
export type { UseEditorOptions } from '../composables/useEditor'

/** Props interface for the `<RTEditor>` component */
export type { RTEditorProps } from '../components/RTEditor.vue'

/** i18n message bundle shape */
export type { Messages } from '../i18n'

/** Supported locale identifiers */
export type { Locale } from '../i18n'

// ── Re-export ProseMirror types consumers might need ──

/** ProseMirror command function signature */
export type { Command } from 'prosemirror-state'

/** ProseMirror editor view */
export type { EditorView } from 'prosemirror-view'

/** ProseMirror editor state and transaction */
export type { EditorState, Transaction } from 'prosemirror-state'

/** ProseMirror document model types */
export type { Node as ProseMirrorNode, Mark, Schema } from 'prosemirror-model'

/**
 * CSS variable overrides for theme customization.
 *
 * Pass to `<RTEditor :custom-theme="myTheme" />` or use {@link defineTheme}
 * to create a type-checked override object.
 */
export interface ThemeOverrides {
  // Colors
  '--rte-bg'?: string
  '--rte-bg-muted'?: string
  '--rte-bg-active'?: string
  '--rte-text'?: string
  '--rte-text-secondary'?: string
  '--rte-text-muted'?: string
  '--rte-accent'?: string
  '--rte-accent-hover'?: string
  '--rte-border'?: string
  '--rte-border-strong'?: string

  // Typography
  '--rte-font-sans'?: string
  '--rte-font-mono'?: string
  '--rte-text-base'?: string
  '--rte-text-sm'?: string
  '--rte-text-xs'?: string

  // Spacing
  '--rte-radius'?: string
  '--rte-radius-lg'?: string

  // Shadows
  '--rte-shadow'?: string
  '--rte-shadow-lg'?: string

  // Allow any custom --rte-* variable
  [key: `--rte-${string}`]: string | undefined
}

/** Type-safe helper for creating theme overrides */
export function defineTheme(overrides: ThemeOverrides): ThemeOverrides {
  return overrides
}

/** Upload handler for images. Returns the URL of the uploaded image. */
export interface ImageUploadHandler {
  (file: File): Promise<string>
}
