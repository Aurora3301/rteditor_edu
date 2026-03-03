<template>
  <div v-if="visible" class="rte-table-toolbar" :style="style" role="toolbar" aria-label="Table controls">
    <button type="button" class="rte-table-toolbar__btn" title="Add row above" @click="$emit('add-row-before')">+↑</button>
    <button type="button" class="rte-table-toolbar__btn" title="Add row below" @click="$emit('add-row-after')">+↓</button>
    <button type="button" class="rte-table-toolbar__btn" title="Add column left" @click="$emit('add-col-before')">+←</button>
    <button type="button" class="rte-table-toolbar__btn" title="Add column right" @click="$emit('add-col-after')">+→</button>
    <span class="rte-table-toolbar__sep"></span>
    <button type="button" class="rte-table-toolbar__btn" title="Delete row" @click="$emit('delete-row')">−↕</button>
    <button type="button" class="rte-table-toolbar__btn" title="Delete column" @click="$emit('delete-col')">−↔</button>
    <span class="rte-table-toolbar__sep"></span>
    <button type="button" class="rte-table-toolbar__btn" title="Merge cells" @click="$emit('merge-cells')">⊞</button>
    <button type="button" class="rte-table-toolbar__btn" title="Split cell" @click="$emit('split-cell')">⊟</button>
    <span class="rte-table-toolbar__sep"></span>
    <button type="button" class="rte-table-toolbar__btn" title="Toggle header row" @click="$emit('toggle-header')">⊠</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  top: number
  left: number
}>()

defineEmits<{
  'add-row-before': []
  'add-row-after': []
  'add-col-before': []
  'add-col-after': []
  'delete-row': []
  'delete-col': []
  'merge-cells': []
  'split-cell': []
  'toggle-header': []
}>()

const style = computed(() => ({
  top: `${props.top}px`,
  left: `${props.left}px`,
}))
</script>

