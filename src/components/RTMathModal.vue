<template>
  <Teleport to="body">
    <div v-if="visible" class="rte-dialog-overlay" @mousedown.self="cancel" @keydown.esc="cancel">
      <div class="rte-dialog rte-math-modal" role="dialog" aria-modal="true" aria-label="Insert Math Formula">

        <!-- Header row: title + close on same line -->
        <div class="rte-math-modal__header">
          <h3 class="rte-math-modal__title">Math Formula (LaTeX)</h3>
          <button class="rte-math-modal__close" aria-label="Close" @click="cancel">✕</button>
        </div>

        <!-- Category tabs -->
        <div class="rte-math-modal__tabs" role="tablist">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="rte-math-modal__tab"
            :class="{ 'rte-math-modal__tab--active': activeTab === cat.id }"
            role="tab"
            :aria-selected="activeTab === cat.id"
            @click="activeTab = cat.id"
          >{{ cat.label }}</button>
        </div>

        <!-- Symbol palette -->
        <div class="rte-math-modal__palette">
          <button
            v-for="sym in activeSymbols"
            :key="sym.code"
            type="button"
            class="rte-math-modal__sym"
            :title="sym.label"
            :aria-label="sym.label"
            @click="insert(sym.code)"
          >{{ sym.label }}</button>
        </div>

        <!-- LaTeX input -->
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
import { ref, computed, nextTick } from 'vue'
import katex from 'katex'

const emit = defineEmits<{ 'confirm': [latex: string] }>()

const visible = ref(false)
const latex = ref('')
const inputEl = ref<HTMLTextAreaElement | null>(null)
const previewEl = ref<HTMLElement | null>(null)
const activeTab = ref('general')

const categories = [
  { id: 'general',   label: 'General' },
  { id: 'trig',      label: 'Trigonometry' },
  { id: 'physics',   label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
]

const symbolMap: Record<string, { label: string; code: string }[]> = {
  general: [
    { label: 'x²',  code: 'x^{2}' },      { label: 'xⁿ',  code: 'x^{n}' },
    { label: 'xₙ',  code: 'x_{n}' },      { label: '√x',  code: '\\sqrt{x}' },
    { label: '∛x',  code: '\\sqrt[3]{x}' },{ label: 'ⁿ√x', code: '\\sqrt[n]{x}' },
    { label: '½',   code: '\\frac{1}{2}' },{ label: 'a/b',  code: '\\frac{a}{b}' },
    { label: '∫',   code: '\\int_{a}^{b}' },{ label: '∬',  code: '\\iint' },
    { label: '∑',   code: '\\sum_{i=1}^{n}' },{ label: '∏', code: '\\prod_{i=1}^{n}' },
    { label: 'lim', code: '\\lim_{x \\to \\infty}' },{ label: 'd/dx', code: '\\frac{d}{dx}' },
    { label: '∂',   code: '\\partial' },    { label: '∇',   code: '\\nabla' },
    { label: '∞',   code: '\\infty' },      { label: 'π',   code: '\\pi' },
    { label: '≤',   code: '\\leq' },        { label: '≥',   code: '\\geq' },
    { label: '≠',   code: '\\neq' },        { label: '≈',   code: '\\approx' },
    { label: '±',   code: '\\pm' },         { label: '∓',   code: '\\mp' },
    { label: '×',   code: '\\times' },      { label: '÷',   code: '\\div' },
    { label: '·',   code: '\\cdot' },       { label: '⊕',   code: '\\oplus' },
    { label: '∈',   code: '\\in' },         { label: '∉',   code: '\\notin' },
    { label: '⊂',   code: '\\subset' },     { label: '∪',   code: '\\cup' },
    { label: '∩',   code: '\\cap' },        { label: '∅',   code: '\\emptyset' },
    { label: '→',   code: '\\rightarrow' }, { label: '⟹',  code: '\\Rightarrow' },
    { label: '↔',   code: '\\leftrightarrow' },{ label: '∀', code: '\\forall' },
    { label: '∃',   code: '\\exists' },     { label: '¬',   code: '\\neg' },
    { label: 'α',   code: '\\alpha' },      { label: 'β',   code: '\\beta' },
    { label: 'γ',   code: '\\gamma' },      { label: 'δ',   code: '\\delta' },
    { label: 'ε',   code: '\\epsilon' },    { label: 'ζ',   code: '\\zeta' },
    { label: 'η',   code: '\\eta' },        { label: 'θ',   code: '\\theta' },
    { label: 'κ',   code: '\\kappa' },      { label: 'λ',   code: '\\lambda' },
    { label: 'μ',   code: '\\mu' },         { label: 'ν',   code: '\\nu' },
    { label: 'ξ',   code: '\\xi' },         { label: 'ρ',   code: '\\rho' },
    { label: 'σ',   code: '\\sigma' },      { label: 'τ',   code: '\\tau' },
    { label: 'φ',   code: '\\phi' },        { label: 'χ',   code: '\\chi' },
    { label: 'ψ',   code: '\\psi' },        { label: 'ω',   code: '\\omega' },
    { label: 'Δ',   code: '\\Delta' },      { label: 'Γ',   code: '\\Gamma' },
    { label: 'Λ',   code: '\\Lambda' },     { label: 'Σ',   code: '\\Sigma' },
    { label: 'Π',   code: '\\Pi' },         { label: 'Ω',   code: '\\Omega' },
  ],
  trig: [
    { label: 'sin',    code: '\\sin(x)' },     { label: 'cos',    code: '\\cos(x)' },
    { label: 'tan',    code: '\\tan(x)' },     { label: 'cot',    code: '\\cot(x)' },
    { label: 'sec',    code: '\\sec(x)' },     { label: 'csc',    code: '\\csc(x)' },
    { label: 'arcsin', code: '\\arcsin(x)' },  { label: 'arccos', code: '\\arccos(x)' },
    { label: 'arctan', code: '\\arctan(x)' },  { label: 'sinh',   code: '\\sinh(x)' },
    { label: 'cosh',   code: '\\cosh(x)' },    { label: 'tanh',   code: '\\tanh(x)' },
    { label: 'sin²',   code: '\\sin^{2}(x)' }, { label: 'cos²',   code: '\\cos^{2}(x)' },
    { label: 'sin⁻¹',  code: '\\sin^{-1}(x)' },{ label: 'cos⁻¹', code: '\\cos^{-1}(x)' },
    { label: '°',      code: '^{\\circ}' },    { label: 'π/2',    code: '\\frac{\\pi}{2}' },
    { label: 'π/4',    code: '\\frac{\\pi}{4}' },{ label: '2π',   code: '2\\pi' },
    { label: 'rad',    code: '\\text{ rad}' }, { label: '|x|',    code: '|x|' },
  ],
  physics: [
    { label: 'F=ma',   code: 'F = ma' },
    { label: 'E=mc²',  code: 'E = mc^{2}' },
    { label: 'KE',     code: 'KE = \\frac{1}{2}mv^{2}' },
    { label: 'PE',     code: 'PE = mgh' },
    { label: 'p=mv',   code: 'p = mv' },
    { label: 'W=Fd',   code: 'W = F \\cdot d' },
    { label: 'v=u+at', code: 'v = u + at' },
    { label: 's=ut+½at²', code: 's = ut + \\frac{1}{2}at^{2}' },
    { label: 'V=IR',   code: 'V = IR' },
    { label: 'P=IV',   code: 'P = IV' },
    { label: 'Q=mcΔT', code: 'Q = mc\\Delta T' },
    { label: 'λ=v/f',  code: '\\lambda = \\frac{v}{f}' },
    { label: 'n=c/v',  code: 'n = \\frac{c}{v}' },
    { label: 'vec F',  code: '\\vec{F}' },
    { label: 'vec v',  code: '\\vec{v}' },
    { label: 'vec a',  code: '\\vec{a}' },
    { label: '|vec|',  code: '|\\vec{F}|' },
    { label: 'F·G',    code: 'F = G\\frac{m_{1}m_{2}}{r^{2}}' },
    { label: 'hν',     code: 'E = h\\nu' },
    { label: 'ΔE',     code: '\\Delta E' },
    { label: 'ħ',      code: '\\hbar' },
    { label: 'ψ(x)',   code: '\\psi(x)' },
    { label: '∮',      code: '\\oint' },
    { label: '∇²',     code: '\\nabla^{2}' },
    { label: 'dv/dt',  code: '\\frac{dv}{dt}' },
    { label: '∂²/∂x²', code: '\\frac{\\partial^{2}}{\\partial x^{2}}' },
  ],
  chemistry: [
    { label: '→',      code: '\\rightarrow' },
    { label: '⇌',      code: '\\rightleftharpoons' },
    { label: '↑',      code: '\\uparrow' },
    { label: '↓',      code: '\\downarrow' },
    { label: 'H₂O',    code: '\\text{H}_{2}\\text{O}' },
    { label: 'CO₂',    code: '\\text{CO}_{2}' },
    { label: 'H₂SO₄',  code: '\\text{H}_{2}\\text{SO}_{4}' },
    { label: 'NaCl',   code: '\\text{NaCl}' },
    { label: 'O₂',     code: '\\text{O}_{2}' },
    { label: 'N₂',     code: '\\text{N}_{2}' },
    { label: 'Ca²⁺',   code: '\\text{Ca}^{2+}' },
    { label: 'SO₄²⁻',  code: '\\text{SO}_{4}^{2-}' },
    { label: 'OH⁻',    code: '\\text{OH}^{-}' },
    { label: 'H⁺',     code: '\\text{H}^{+}' },
    { label: 'e⁻',     code: 'e^{-}' },
    { label: 'Kₐ',     code: 'K_{a}' },
    { label: 'Kₑq',    code: 'K_{eq}' },
    { label: 'pH',     code: '\\text{pH} = -\\log[\\text{H}^{+}]' },
    { label: 'ΔH',     code: '\\Delta H' },
    { label: 'ΔG',     code: '\\Delta G' },
    { label: 'ΔS',     code: '\\Delta S' },
    { label: 'ΔG=ΔH-TΔS', code: '\\Delta G = \\Delta H - T\\Delta S' },
    { label: 'PV=nRT', code: 'PV = nRT' },
    { label: 'M=n/V',  code: 'M = \\frac{n}{V}' },
    { label: 'n=m/Mr', code: 'n = \\frac{m}{M_{r}}' },
    { label: 'λmax',   code: '\\lambda_{\\text{max}}' },
  ],
}

const activeSymbols = computed(() => symbolMap[activeTab.value] ?? [])

const katexOptions = {
  throwOnError: false, displayMode: true,
  output: 'html' as const, trust: false,
  strict: 'ignore' as const, maxSize: 10, maxExpand: 1000,
}

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

function updatePreview() {
  const el = previewEl.value
  if (!el) return
  if (!latex.value.trim()) { el.innerHTML = ''; return }
  try { katex.render(latex.value, el, katexOptions) }
  catch { el.textContent = latex.value }
}

function open() {
  visible.value = true
  latex.value = ''
  nextTick(() => { inputEl.value?.focus(); updatePreview() })
}
function cancel() { visible.value = false; latex.value = '' }
function confirm() {
  if (!latex.value.trim()) return
  emit('confirm', latex.value.trim())
  visible.value = false; latex.value = ''
}
defineExpose({ open })
</script>

