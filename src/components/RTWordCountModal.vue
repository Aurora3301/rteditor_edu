<template>
  <div class="rte-dialog-overlay" @click.self="$emit('close')">
    <div class="rte-dialog" role="dialog" aria-modal="true" aria-label="Document Statistics">
      <h3 class="rte-dialog__title">Document Stats</h3>

      <table class="rte-wordcount__table">
        <tbody>
          <tr>
            <td class="rte-wordcount__label">Words</td>
            <td class="rte-wordcount__value">{{ stats.words.toLocaleString() }}</td>
          </tr>
          <tr>
            <td class="rte-wordcount__label">Characters</td>
            <td class="rte-wordcount__value">{{ stats.chars.toLocaleString() }}</td>
          </tr>
          <tr>
            <td class="rte-wordcount__label">Characters (no spaces)</td>
            <td class="rte-wordcount__value">{{ stats.charsNoSpaces.toLocaleString() }}</td>
          </tr>
          <tr>
            <td class="rte-wordcount__label">Paragraphs</td>
            <td class="rte-wordcount__value">{{ stats.paragraphs.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="selectionStats" class="rte-wordcount__selection">
        <h4 class="rte-wordcount__subtitle">Selection</h4>
        <table class="rte-wordcount__table">
          <tbody>
            <tr>
              <td class="rte-wordcount__label">Words</td>
              <td class="rte-wordcount__value">{{ selectionStats.words.toLocaleString() }}</td>
            </tr>
            <tr>
              <td class="rte-wordcount__label">Characters</td>
              <td class="rte-wordcount__value">{{ selectionStats.chars.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rte-dialog__actions">
        <button type="button" class="rte-dialog__btn rte-dialog__btn--confirm" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DocStats } from '../core/utils/wordCount'

defineProps<{
  stats: DocStats
  selectionStats: { words: number; chars: number } | null
}>()

defineEmits<{ close: [] }>()
</script>

