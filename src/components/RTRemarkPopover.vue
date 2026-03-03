<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="popoverEl"
      class="rte-remark-popover"
      :style="style"
      role="dialog"
      aria-modal="true"
      aria-label="Add remark"
      @mousedown.stop
      @keydown.esc="close"
    >
      <div class="rte-remark-popover__header">
        <span>{{ editingId ? 'Edit Remark' : 'Add Remark' }}</span>
        <button class="rte-remark-popover__close" aria-label="Close" @click="close">✕</button>
      </div>
      <textarea
        ref="textareaEl"
        v-model="text"
        class="rte-remark-popover__textarea"
        placeholder="Type your remark here…"
        rows="3"
        @keydown.enter.ctrl="save"
      />
      <div class="rte-remark-popover__actions">
        <button v-if="editingId" class="rte-remark-popover__btn rte-remark-popover__btn--danger" @click="deleteRemark">Delete</button>
        <button class="rte-remark-popover__btn" @click="close">Cancel</button>
        <button class="rte-remark-popover__btn rte-remark-popover__btn--primary" :disabled="!text.trim()" @click="save">
          {{ editingId ? 'Update' : 'Save' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import type { EditorView } from 'prosemirror-view'
import { schema } from '../core/schema'

const props = defineProps<{ view: EditorView | null }>()

const visible = ref(false)
const text = ref('')
const editingId = ref<string | null>(null)
const style = ref<Record<string, string>>({})
const textareaEl = ref<HTMLTextAreaElement | null>(null)

function open(anchorRect: DOMRect, existingMark?: { id: string; text: string }) {
  visible.value = true
  text.value = existingMark?.text ?? ''
  editingId.value = existingMark?.id ?? null
  style.value = {
    position: 'fixed',
    top: `${anchorRect.bottom + 6}px`,
    left: `${Math.max(8, anchorRect.left)}px`,
    zIndex: '9999',
  }
  nextTick(() => textareaEl.value?.focus())
}

function close() {
  visible.value = false
  text.value = ''
  editingId.value = null
}

function save() {
  const v = props.view
  if (!v || !(v.dom as HTMLElement).isConnected || !text.value.trim()) return
  const { state, dispatch } = v
  const { from, to } = state.selection

  if (editingId.value) {
    // Remove old comment mark then re-add with updated text
    let tr = state.tr
    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      node.marks.forEach(m => {
        if (m.type.name === 'comment' && m.attrs.id === editingId.value) {
          tr = tr.removeMark(pos, pos + node.nodeSize, schema.marks.comment)
          tr = tr.addMark(pos, pos + node.nodeSize, schema.marks.comment.create({
            ...m.attrs, text: text.value.trim(),
          }))
        }
      })
    })
    dispatch(tr)
  } else {
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const mark = schema.marks.comment.create({
      id, text: text.value.trim(), author: 'Teacher',
      timestamp: new Date().toISOString(),
    })
    dispatch(state.tr.addMark(from, to, mark))
  }
  close()
}

function deleteRemark() {
  const v = props.view
  if (!v || !editingId.value) return
  const { state, dispatch } = v
  let tr = state.tr
  state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
    node.marks.forEach(m => {
      if (m.type.name === 'comment' && m.attrs.id === editingId.value) {
        tr = tr.removeMark(pos, pos + node.nodeSize, schema.marks.comment)
      }
    })
  })
  dispatch(tr)
  close()
}

defineExpose({ open, close })
</script>

