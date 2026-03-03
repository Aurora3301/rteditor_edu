<template>
  <div class="rte-export-menu" ref="menuRef">
    <button
      type="button"
      class="rte-toolbar__button"
      aria-label="Export"
      title="Export"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    </button>
    <ul v-if="open" class="rte-export-menu__list" role="menu">
      <li role="menuitem">
        <button type="button" class="rte-export-menu__item" @click="exportPDF">
          📄 Export PDF
        </button>
      </li>
      <li role="menuitem">
        <button type="button" class="rte-export-menu__item" @click="exportDocx">
          📝 Export Word (.docx)
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{
  'export-pdf': []
  'export-docx': []
}>()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function exportPDF() {
  open.value = false
  emit('export-pdf')
}

function exportDocx() {
  open.value = false
  emit('export-docx')
}

function onOutsideClick(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutsideClick))
</script>

