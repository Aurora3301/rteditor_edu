<template>
  <div class="rte-root" :data-theme="theme" :style="themeStyle">
    <RTToolbar
      :active-state="activeState"
      :commands="commands"
      @image-select="handleImageSelect"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RTToolbar from './RTToolbar.vue'
import RTBubbleMenu from './RTBubbleMenu.vue'
import { useEditor } from '../composables/useEditor'
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

const themeStyle = computed(() => {
  if (!props.customTheme) return undefined
  return props.customTheme as Record<string, string>
})

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
