<template>
  <div class="rte-root" :data-theme="theme" :style="rootStyle">
    <RTToolbar
      :active-state="activeState"
      :commands="commands"
      @image-select="handleImageSelect"
      @insert-table="showTableDialog = true"
      @word-count="showWordCount = true"
      @export-pdf="onExportPDF"
      @export-markdown="onExportMarkdown"
      @emoji-open="showEmojiPicker = true"
      @spacing-change="onSpacingChange"
    />
    <div class="rte-root__body">
      <div class="rte-editor-wrapper">
        <div
          ref="editorRef"
          class="rte-editor"
        />
      </div>
    </div>
    <RTBubbleMenu
      ref="bubbleMenuRef"
      :view="view"
      :active-state="activeState"
      :commands="commands"
    />

    <!-- Table Insert Dialog -->
    <RTTableInsertDialog
      v-if="showTableDialog"
      @confirm="onInsertTable"
      @cancel="showTableDialog = false"
    />

    <!-- Slash command menu -->
    <RTSlashMenu
      :visible="slashMenuVisible"
      :top="slashMenuPos.top"
      :left="slashMenuPos.left"
      :commands="slashCommands"
      @close="closeSlash"
    />

    <!-- Word Count Modal -->
    <RTWordCountModal
      v-if="showWordCount"
      :stats="docStats"
      :selection-stats="selStats"
      @close="showWordCount = false"
    />

    <!-- Emoji Picker -->
    <RTEmojiPicker
      v-if="showEmojiPicker"
      style="position: fixed; z-index: 1000; top: 50%; left: 50%; transform: translate(-50%, -50%)"
      @select="onEmojiSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RTToolbar from './RTToolbar.vue'
import RTBubbleMenu from './RTBubbleMenu.vue'
import RTTableInsertDialog from './RTTableInsertDialog.vue'
import RTSlashMenu from './RTSlashMenu.vue'
import RTWordCountModal from './RTWordCountModal.vue'
import RTEmojiPicker from './RTEmojiPicker.vue'
import { useEditor } from '../composables/useEditor'
import { closeSlashMenu } from '../core/plugins/slashMenu'
import { provideI18n, type Locale } from '../i18n'
import type { ThemeOverrides } from '../types'

export interface RTEditorProps {
  /** v-model for HTML content */
  modelValue?: string
  /** v-model:json for JSON content */
  json?: Record<string, any>
  /** Placeholder text */
  placeholder?: string
  /** Read-only mode */
  readonly?: boolean
  /** Theme: 'light' | 'dark' | 'auto' */
  theme?: 'light' | 'dark' | 'auto'
  /** Custom theme overrides (CSS variables) */
  customTheme?: ThemeOverrides
  /** Locale: 'en' | 'zh-TW' */
  locale?: Locale
  /** Image upload handler. If not provided, images are inserted as data URLs. */
  onImageUpload?: (file: File) => Promise<string>
}

const props = withDefaults(defineProps<RTEditorProps>(), {
  modelValue: '',
  placeholder: '',
  readonly: false,
  theme: 'light',
  locale: 'en',
})

// ── Spacing state (controlled by line-spacing picker in toolbar) ──
const spacingVars = ref<Record<string, string>>({
  '--rte-content-leading': '1.5',
  '--rte-para-spacing': '4px',
})

const rootStyle = computed(() => ({
  ...(props.customTheme as Record<string, string> | undefined),
  ...spacingVars.value,
}))

function onSpacingChange(lineHeight: string, paraSpacing: string) {
  spacingVars.value = {
    '--rte-content-leading': lineHeight,
    '--rte-para-spacing': paraSpacing,
  }
}

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:json': [value: Record<string, any>]
  'change': [payload: { html: string; json: Record<string, any> }]
  'focus': []
  'blur': []
}>()

// ── i18n ──
const i18n = provideI18n(props.locale)
watch(() => props.locale, (newLocale) => {
  if (newLocale) i18n.locale.value = newLocale
})

const editorRef = ref<HTMLElement | null>(null)
const bubbleMenuRef = ref<InstanceType<typeof RTBubbleMenu> | null>(null)

const {
  view,
  html,
  json: jsonContent,
  isFocused,
  activeState,
  commands,
  setHTML,
  setJSON,
  getStats,
  exportMarkdown,
} = useEditor({
  containerRef: editorRef,
  initialHTML: props.modelValue || undefined,
  initialJSON: props.json || undefined,
  placeholder: props.placeholder,
  editable: !props.readonly,
})

// ── Notify bubble menu of state changes ──
watch([html, () => activeState.link], () => {
  bubbleMenuRef.value?.onTransaction()
})

// ── Sync internal state → parent (v-model) ──
// Track whether we're currently emitting to avoid re-entrant updates
let isEmitting = false

watch(html, (newHTML) => {
  isEmitting = true
  emit('update:modelValue', newHTML)
  emit('change', { html: newHTML, json: jsonContent.value })
  isEmitting = false
})

watch(jsonContent, (newJSON) => {
  emit('update:json', newJSON)
})

// ── Sync parent → internal (external v-model changes) ──
watch(() => props.modelValue, (newVal) => {
  // Skip if this change was triggered by our own emit
  if (isEmitting) return
  if (newVal !== html.value) {
    setHTML(newVal)
  }
})

// ── Focus/blur events ──
watch(isFocused, (focused) => {
  if (focused) {
    emit('focus')
  } else {
    emit('blur')
  }
})

// ── Image handling ──
async function handleImageSelect(file: File) {
  let src: string
  if (props.onImageUpload) {
    try {
      src = await props.onImageUpload(file)
    } catch (err) {
      console.error('[rteditor] Image upload failed:', err)
      return
    }
  } else {
    // Default: convert to data URL
    src = await fileToDataURL(file)
  }
  commands.insertImage({ src, alt: file.name })
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Phase 2: New reactive state ──
const showTableDialog = ref(false)
const showWordCount = ref(false)
const showEmojiPicker = ref(false)

const slashMenuVisible = ref(false)
const slashMenuPos = ref({ top: 0, left: 0 })
const docStats = computed(() => getStats()?.docStats ?? { words: 0, chars: 0, charsNoSpaces: 0, paragraphs: 0 })
const selStats = computed(() => getStats()?.selStats ?? null)

// ── Slash commands ──
const slashCommands = computed(() => [
  { id: 'h1', icon: 'H1', label: 'Heading 1', action: () => { commands.setHeading(1); closeSlash() } },
  { id: 'h2', icon: 'H2', label: 'Heading 2', action: () => { commands.setHeading(2); closeSlash() } },
  { id: 'h3', icon: 'H3', label: 'Heading 3', action: () => { commands.setHeading(3); closeSlash() } },
  { id: 'p', icon: '¶', label: 'Paragraph', action: () => { commands.setParagraph(); closeSlash() } },
  { id: 'ul', icon: '•', label: 'Bullet List', action: () => { commands.toggleBulletList(); closeSlash() } },
  { id: 'ol', icon: '1.', label: 'Ordered List', action: () => { commands.toggleOrderedList(); closeSlash() } },
  { id: 'bq', icon: '❝', label: 'Blockquote', action: () => { commands.toggleBlockquote(); closeSlash() } },
  { id: 'tb', icon: '⊞', label: 'Table', action: () => { showTableDialog.value = true; closeSlash() } },
  { id: 'hr', icon: '—', label: 'Divider', action: () => { commands.insertHorizontalRule(); closeSlash() } },
  { id: 'em', icon: '😊', label: 'Emoji', action: () => { showEmojiPicker.value = true; closeSlash() } },
])

function closeSlash() {
  const v = view.value
  if (v) closeSlashMenu(v)
  slashMenuVisible.value = false
}

// ── Phase 2 event handlers ──
function onInsertTable(rows: number, cols: number, hasHeader: boolean) {
  commands.insertTable(rows, cols, hasHeader)
  showTableDialog.value = false
}

function onEmojiSelect(emoji: string) {
  const v = view.value
  if (!v) return
  const tr = v.state.tr.insertText(emoji)
  v.dispatch(tr)
  showEmojiPicker.value = false
  v.focus()
}

function onExportPDF() {
  window.print()
}

function onExportMarkdown() {
  const md = exportMarkdown()
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.md'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Expose for parent component access ──
defineExpose({
  /** The ProseMirror EditorView */
  view,
  /** Formatting commands */
  commands,
  /** Set content programmatically */
  setHTML,
  setJSON,
  /** Focus the editor */
  focus: () => view.value?.focus(),
})
</script>
