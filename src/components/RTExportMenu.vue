<template>
  <div class="rte-export-menu">
    <button
      type="button"
      class="rte-toolbar__button"
      aria-label="Export"
      title="Export"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    </button>

    <!-- Centered modal — same pattern as Math Formula -->
    <Teleport to="body">
      <div
        v-if="open"
        class="rte-dialog-overlay"
        role="presentation"
        @mousedown.self="open = false"
        @keydown.esc="open = false"
      >
        <div class="rte-dialog rte-export-dialog" role="dialog" aria-modal="true" aria-label="Export Document">
          <div class="rte-math-modal__header">
            <h3 class="rte-math-modal__title">Export</h3>
            <button class="rte-math-modal__close" aria-label="Close" @click="open = false">✕</button>
          </div>
          <div class="rte-export-dialog__options">
            <button type="button" class="rte-export-dialog__option" @click="exportPDF">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span>Export as PDF</span>
            </button>
            <button type="button" class="rte-export-dialog__option" @click="exportDocx">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span>Export as Word (.docx)</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  'export-pdf': []
  'export-docx': []
}>()

const open = ref(false)

function exportPDF()  { open.value = false; emit('export-pdf')  }
function exportDocx() { open.value = false; emit('export-docx') }
</script>

