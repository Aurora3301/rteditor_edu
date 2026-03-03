<template>
  <Teleport to="body">
    <div v-if="visible" class="rte-dialog-overlay" @mousedown.self="cancel" @keydown.esc="cancel">
      <div class="rte-dialog rte-math-modal" role="dialog" aria-modal="true" aria-label="Insert Math Formula">
        <div class="rte-dialog__header">
          <h3 class="rte-dialog__title">Math Formula (LaTeX)</h3>
          <button class="rte-dialog__close" aria-label="Close" @click="cancel">✕</button>
        </div>

        <!-- Symbol palette -->
        <div class="rte-math-modal__palette">
          <button
            v-for="sym in symbols"
            :key="sym.label"
            type="button"
            class="rte-math-modal__sym"
            :title="sym.label"
            @click="insert(sym.code)"
          >{{ sym.label }}</button>
        </div>

        <textarea
          ref="inputEl"
          v-model="latex"
          class="rte-math-modal__input"
          placeholder="e.g. x^2 + \frac{1}{2} = \sqrt{y}"
          rows="3"
          spellcheck="false"
          @input="updatePreview"
        />

        <div class="rte-math-modal__preview-label">Preview</div>
        <div ref="previewEl" class="rte-math-modal__preview" />

        <div class="rte-math-modal__actions">
          <button class="rte-btn" @click="cancel">Cancel</button>
          <button class="rte-btn rte-btn--primary" :disabled="!latex.trim()" @click="confirm">Insert</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import katex from 'katex'

const emit = defineEmits<{ 'confirm': [latex: string] }>()

const visible = ref(false)
const latex = ref('')
const inputEl = ref<HTMLTextAreaElement | null>(null)
const previewEl = ref<HTMLElement | null>(null)

const symbols = [
  { label: 'x²', code: 'x^{2}' },
  { label: 'xₙ', code: 'x_{n}' },
  { label: '√', code: '\\sqrt{x}' },
  { label: '∫', code: '\\int_{a}^{b}' },
  { label: '∑', code: '\\sum_{i=1}^{n}' },
  { label: '∏', code: '\\prod_{i=1}^{n}' },
  { label: '½', code: '\\frac{1}{2}' },
  { label: 'π', code: '\\pi' },
  { label: 'θ', code: '\\theta' },
  { label: '∞', code: '\\infty' },
  { label: '≤', code: '\\leq' },
  { label: '≥', code: '\\geq' },
  { label: '≠', code: '\\neq' },
  { label: '±', code: '\\pm' },
  { label: '×', code: '\\times' },
  { label: '÷', code: '\\div' },
  { label: 'α', code: '\\alpha' },
  { label: 'β', code: '\\beta' },
  { label: 'Δ', code: '\\Delta' },
  { label: 'λ', code: '\\lambda' },
  { label: 'μ', code: '\\mu' },
  { label: 'σ', code: '\\sigma' },
]

function insert(code: string) {
  const el = inputEl.value
  if (!el) { latex.value += code; updatePreview(); return }
  const start = el.selectionStart ?? latex.value.length
  const end = el.selectionEnd ?? start
  latex.value = latex.value.slice(0, start) + code + latex.value.slice(end)
  nextTick(() => {
    el.focus()
    const pos = start + code.length
    el.setSelectionRange(pos, pos)
    updatePreview()
  })
}

const katexOptions = {
  throwOnError: false,
  displayMode: true,
  output: 'html' as const,
  trust: false,
  strict: 'ignore' as const,
  maxSize: 10,
  maxExpand: 1000,
}

function updatePreview() {
  const el = previewEl.value
  if (!el) return
  if (!latex.value.trim()) { el.innerHTML = ''; return }
  try {
    katex.render(latex.value, el, katexOptions)
  } catch {
    el.textContent = latex.value
  }
}

function open() {
  visible.value = true
  latex.value = ''
  nextTick(() => { inputEl.value?.focus(); updatePreview() })
}

function cancel() {
  visible.value = false
  latex.value = ''
}

function confirm() {
  if (!latex.value.trim()) return
  emit('confirm', latex.value.trim())
  visible.value = false
  latex.value = ''
}

defineExpose({ open })
</script>

