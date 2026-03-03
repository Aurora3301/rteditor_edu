<template>
  <div class="rte-export-menu" ref="triggerRef">
    <button
      type="button"
      class="rte-toolbar__button"
      aria-label="Export"
      title="Export"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    </button>

    <!-- Teleported to <body> so it is never covered by the editor content -->
    <Teleport to="body">
      <ul
        v-if="open"
        class="rte-export-menu__list"
        role="menu"
        :style="{ position: 'fixed', top: menuPos.top + 'px', left: menuPos.left + 'px', zIndex: 2147483646 }"
        ref="listRef"
      >
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{
  'export-pdf': []
  'export-docx': []
}>()

const open    = ref(false)
const menuPos = ref({ top: 0, left: 0 })
const triggerRef = ref<HTMLElement | null>(null)
const listRef    = ref<HTMLElement | null>(null)

function toggle() {
  if (!open.value) {
    // Capture button position before showing the list
    const rect = triggerRef.value?.getBoundingClientRect()
    if (rect) {
      menuPos.value = {
        top:  rect.bottom + 4,
        left: rect.right - 160,   // align right edge of list with button
      }
    }
  }
  open.value = !open.value
}

function exportPDF()  { open.value = false; emit('export-pdf')  }
function exportDocx() { open.value = false; emit('export-docx') }

function onOutsideClick(e: MouseEvent) {
  const t = e.target as Node
  if (
    triggerRef.value && !triggerRef.value.contains(t) &&
    listRef.value    && !listRef.value.contains(t)
  ) {
    open.value = false
  }
}

// Scroll anywhere → close the list
function onScroll() { open.value = false }

onMounted(() => {
  document.addEventListener('mousedown', onOutsideClick)
  window.addEventListener('scroll', onScroll, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutsideClick)
  window.removeEventListener('scroll', onScroll, true)
})
</script>

