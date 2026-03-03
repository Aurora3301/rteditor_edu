<template>
  <div class="rte-dialog-overlay" @click.self="$emit('cancel')">
    <div class="rte-dialog" role="dialog" aria-modal="true" aria-label="Insert Table">
      <h3 class="rte-dialog__title">Insert Table</h3>

      <div class="rte-dialog__field">
        <label class="rte-dialog__label" for="rte-table-cols">Columns</label>
        <input
          id="rte-table-cols"
          v-model.number="cols"
          class="rte-dialog__input"
          type="number"
          min="1"
          max="10"
        />
      </div>

      <div class="rte-dialog__field">
        <label class="rte-dialog__label" for="rte-table-rows">Rows</label>
        <input
          id="rte-table-rows"
          v-model.number="rows"
          class="rte-dialog__input"
          type="number"
          min="1"
          max="10"
        />
      </div>

      <div class="rte-dialog__field rte-dialog__field--checkbox">
        <input
          id="rte-table-header"
          v-model="hasHeader"
          class="rte-dialog__checkbox"
          type="checkbox"
        />
        <label class="rte-dialog__label" for="rte-table-header">Header row</label>
      </div>

      <div class="rte-dialog__actions">
        <button type="button" class="rte-dialog__btn rte-dialog__btn--cancel" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="rte-dialog__btn rte-dialog__btn--confirm" @click="confirm">Insert</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  confirm: [rows: number, cols: number, hasHeader: boolean]
  cancel: []
}>()

const rows = ref(3)
const cols = ref(3)
const hasHeader = ref(true)

function confirm() {
  emit('confirm', rows.value, cols.value, hasHeader.value)
}
</script>

