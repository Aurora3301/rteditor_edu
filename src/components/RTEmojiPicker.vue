<template>
  <div class="rte-emoji-picker" ref="pickerRef" role="dialog" aria-label="Emoji picker">
    <input
      v-model="search"
      class="rte-emoji-picker__search"
      type="text"
      placeholder="Search emoji..."
      aria-label="Search emoji"
    />
    <div class="rte-emoji-picker__grid" role="grid">
      <button
        v-for="entry in filteredEmoji"
        :key="entry.name"
        type="button"
        class="rte-emoji-picker__emoji"
        :title="entry.name"
        :aria-label="entry.name"
        role="gridcell"
        @click="$emit('select', entry.emoji)"
      >
        {{ entry.emoji }}
      </button>
      <span v-if="filteredEmoji.length === 0" class="rte-emoji-picker__empty">No results</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { emojiList } from '../core/utils/emojiData'

defineEmits<{ select: [emoji: string] }>()

const search = ref('')

const filteredEmoji = computed(() =>
  search.value
    ? emojiList.filter(e => e.name.includes(search.value.toLowerCase()))
    : emojiList
)
</script>

