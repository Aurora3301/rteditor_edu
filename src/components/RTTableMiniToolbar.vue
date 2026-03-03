<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="rte-table-mini-toolbar"
      :style="toolbarStyle"
      role="toolbar"
      aria-label="Table options"
    >
      <button type="button" class="rte-tmt__btn" title="Insert row above" @click="commands.insertRowBefore()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="1"/><path d="M12 7V3m-3 4l3-4 3 4"/></svg>
      </button>
      <button type="button" class="rte-tmt__btn" title="Insert row below" @click="commands.insertRowAfter()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="10" rx="1"/><path d="M12 17v4m-3-4l3 4 3-4"/></svg>
      </button>
      <button type="button" class="rte-tmt__btn rte-tmt__btn--danger" title="Delete row" @click="commands.deleteRow()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="10" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
      </button>
      <div class="rte-tmt__sep"></div>
      <button type="button" class="rte-tmt__btn" title="Insert column left" @click="commands.insertColBefore()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="11" y="3" width="10" height="18" rx="1"/><path d="M7 12H3m4-3L3 12l4 3"/></svg>
      </button>
      <button type="button" class="rte-tmt__btn" title="Insert column right" @click="commands.insertColAfter()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="10" height="18" rx="1"/><path d="M17 12h4m-4-3l4 3-4 3"/></svg>
      </button>
      <button type="button" class="rte-tmt__btn rte-tmt__btn--danger" title="Delete column" @click="commands.deleteColumn()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="3" width="10" height="18" rx="1"/><line x1="12" y1="9" x2="12" y2="15"/></svg>
      </button>
      <div class="rte-tmt__sep"></div>
      <button type="button" class="rte-tmt__btn rte-tmt__btn--danger" title="Delete table" @click="commands.deleteTable()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { EditorView } from 'prosemirror-view'

const props = defineProps<{
  view: EditorView | null
  inTable: boolean
  commands: Record<string, (...args: any[]) => void>
}>()

const coords = ref<{ left: number; top: number } | null>(null)
const visible = computed(() => props.inTable && !!coords.value)

const toolbarStyle = computed(() => {
  if (!coords.value) return { display: 'none' }
  return {
    position: 'fixed' as const,
    left: `${coords.value.left}px`,
    top: `${coords.value.top}px`,
    zIndex: 9990,
  }
})

function updatePosition() {
  if (!props.view || !props.inTable) { coords.value = null; return }
  const { state, dom } = props.view
  const { $from } = state.selection
  // Walk up to find table node
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === 'table') {
      const pos = $from.before(d)
      const tableDOM = props.view.nodeDOM(pos) as HTMLElement | null
      if (tableDOM) {
        const rect = tableDOM.getBoundingClientRect()
        const editorRect = (dom as HTMLElement).getBoundingClientRect()
        coords.value = {
          left: Math.max(editorRect.left, rect.left),
          top: rect.top - 36,
        }
        return
      }
    }
  }
  coords.value = null
}

watch(() => props.inTable, (val) => {
  if (val) nextTick(updatePosition)
  else coords.value = null
})

defineExpose({ updatePosition })
</script>

