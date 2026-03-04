<template>
  <div class="demo-app">
    <header class="demo-header">
      <h1>rteditor <span class="demo-version">v0.4.0</span></h1>
      <p>Vue 3 Rich Text Editor built on ProseMirror</p>
    </header>

    <main class="demo-main">
      <RTEditor
        v-model="html"
        @update:json="onJsonUpdate"
        placeholder="Start typing here..."
        :theme="theme"
        :custom-theme="customTheme"
      />

      <div class="demo-controls">
        <button @click="theme = theme === 'light' ? 'dark' : 'light'">
          {{ theme === 'light' ? '🌙 Dark' : '☀️ Light' }}
        </button>
        <select v-model="selectedTheme" @change="applyTheme">
          <option value="">Default</option>
          <option value="blueSteel">Blue Steel</option>
          <option value="forest">Forest</option>
          <option value="rose">Rose</option>
          <option value="amber">Amber</option>
        </select>
        <button @click="html = ''">Clear</button>
        <button @click="loadSampleContent">Load Sample</button>
      </div>

      <div class="demo-output">
        <div class="demo-panel">
          <h3>HTML Output</h3>
          <pre class="demo-pre">{{ html }}</pre>
        </div>
        <div class="demo-panel">
          <h3>JSON Output</h3>
          <pre class="demo-pre">{{ jsonPretty }}</pre>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RTEditor, presetThemes } from '../src'
import type { ThemeOverrides } from '../src'

const html = ref('')
const json = ref<Record<string, any>>({})
const theme = ref<'light' | 'dark'>('light')
const selectedTheme = ref('')
const customTheme = ref<ThemeOverrides | undefined>(undefined)

function applyTheme() {
  customTheme.value = selectedTheme.value
    ? presetThemes[selectedTheme.value as keyof typeof presetThemes]
    : undefined
}

const jsonPretty = computed(() => JSON.stringify(json.value, null, 2))

function onJsonUpdate(value: Record<string, any>) {
  json.value = value
}

function loadSampleContent() {
  html.value = `
    <h1>Welcome to rteditor</h1>
    <p>This is a <strong>rich text editor</strong> built with <em>Vue 3</em> and <code>ProseMirror</code>.</p>
    <h2>Features</h2>
    <ul>
      <li>Bold, italic, underline, strikethrough</li>
      <li>Headings (H1, H2, H3)</li>
      <li>Bullet and ordered lists</li>
      <li>Blockquotes</li>
      <li>Inline code</li>
    </ul>
    <blockquote><p>This is a blockquote. It can contain <strong>formatted</strong> text.</p></blockquote>
    <h3>Keyboard Shortcuts</h3>
    <ol>
      <li><strong>Ctrl+B</strong> — Bold</li>
      <li><strong>Ctrl+I</strong> — Italic</li>
      <li><strong>Ctrl+U</strong> — Underline</li>
    </ol>
    <p>Try typing <code># </code> at the start of a line to create a heading!</p>
  `
}
</script>

<style>
/* Demo-specific styles (not part of the editor plugin) */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #f8fafc;
  min-height: 100vh;
}

.demo-app {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px;
}

.demo-header {
  margin-bottom: 24px;
}
.demo-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}
.demo-version {
  font-size: 14px;
  font-weight: 400;
  color: #94a3b8;
}
.demo-header p {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.demo-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-controls {
  display: flex;
  gap: 8px;
}
.demo-controls button {
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: background 0.1s;
}
.demo-controls button:hover {
  background: #f1f5f9;
}

.demo-output {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.demo-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.demo-panel h3 {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
}
.demo-pre {
  padding: 12px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: #334155;
  background: white;
  overflow: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
