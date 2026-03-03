import { test, expect } from '@playwright/test'

/**
 * End-to-end tests for the RTEditor component.
 * These tests run against the Vite dev server (http://localhost:5173).
 */

test.describe('RTEditor — basic load & structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads and editor is visible', async ({ page }) => {
    await expect(page.locator('.rte-root')).toBeVisible()
  })

  test('toolbar is rendered', async ({ page }) => {
    await expect(page.locator('.rte-toolbar')).toBeVisible()
  })

  test('ProseMirror editing area is present', async ({ page }) => {
    await expect(page.locator('.ProseMirror')).toBeVisible()
  })

  test('ProseMirror is editable', async ({ page }) => {
    const editor = page.locator('.ProseMirror')
    await expect(editor).toHaveAttribute('contenteditable', 'true')
  })
})

test.describe('RTEditor — toolbar buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Bold button is present and labelled', async ({ page }) => {
    await expect(page.locator('[aria-label="Bold"]')).toBeVisible()
  })

  test('Italic button is present and labelled', async ({ page }) => {
    await expect(page.locator('[aria-label="Italic"]')).toBeVisible()
  })

  test('Undo button is present', async ({ page }) => {
    await expect(page.locator('[aria-label="Undo"]')).toBeVisible()
  })

  test('Redo button is present', async ({ page }) => {
    await expect(page.locator('[aria-label="Redo"]')).toBeVisible()
  })

  test('Print button is present', async ({ page }) => {
    await expect(page.locator('[aria-label="Print"]')).toBeVisible()
  })

  test('Insert Image button is present', async ({ page }) => {
    await expect(page.locator('[aria-label="Insert Image"]')).toBeVisible()
  })
})

test.describe('RTEditor — typing & formatting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('can type text into the editor', async ({ page }) => {
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.type('Hello world')
    await expect(editor).toContainText('Hello world')
  })

  test('Bold shortcut wraps text in <strong>', async ({ page }) => {
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.type('bold text')
    await editor.selectText()
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+b')
    await expect(editor.locator('strong')).toBeVisible()
  })

  test('Undo/Redo reverses and re-applies typed text', async ({ page }) => {
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.type('undo me')
    await expect(editor).toContainText('undo me')
    await page.keyboard.press('Control+z')
    await expect(editor).not.toContainText('undo me')
    await page.keyboard.press('Control+Shift+Z')
    await expect(editor).toContainText('undo me')
  })
})

test.describe('RTEditor — accessibility (ARIA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('toolbar has role=toolbar and aria-label', async ({ page }) => {
    const toolbar = page.locator('[role="toolbar"]')
    await expect(toolbar).toBeVisible()
    await expect(toolbar).toHaveAttribute('aria-label', 'Formatting toolbar')
  })

  test('all separator elements have role=separator', async ({ page }) => {
    const separators = page.locator('.rte-toolbar__separator')
    const count = await separators.count()
    expect(count).toBeGreaterThan(3)
    for (let i = 0; i < count; i++) {
      await expect(separators.nth(i)).toHaveAttribute('role', 'separator')
    }
  })

  test('Math modal has role=dialog and aria-modal when open', async ({ page }) => {
    await page.locator('[aria-label="Insert Math"]').click()
    const dialog = page.locator('[role="dialog"]').first()
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  test('Math modal closes on Escape key', async ({ page }) => {
    await page.locator('[aria-label="Insert Math"]').click()
    await expect(page.locator('[role="dialog"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.rte-dialog-overlay')).not.toBeVisible()
  })
})

