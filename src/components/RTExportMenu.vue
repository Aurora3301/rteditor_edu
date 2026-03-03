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
      ↓
    </button>
    <ul v-if="open" class="rte-export-menu__list" role="menu">
      <li role="menuitem">
        <button type="button" class="rte-export-menu__item" @click="exportPDF">
          📄 PDF
        </button>
      </li>
      <li role="menuitem">
        <button type="button" class="rte-export-menu__item" @click="exportMarkdown">
          # Markdown (.md)
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{
  'export-pdf': []
  'export-markdown': []
}>()

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function exportPDF() {
  open.value = false
  emit('export-pdf')
}

function exportMarkdown() {
  open.value = false
  emit('export-markdown')
}

function onOutsideClick(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutsideClick))
</script>

