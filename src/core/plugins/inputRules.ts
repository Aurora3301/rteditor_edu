import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  InputRule,
} from 'prosemirror-inputrules'
import { Plugin } from 'prosemirror-state'
import { NodeType } from 'prosemirror-model'
import { schema } from '../schema'

// ── Heading rules: # , ## , ### at start of line ──
function headingRule(nodeType: NodeType, maxLevel: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${maxLevel}})\\s$`),
    nodeType,
    match => ({ level: match[1].length })
  )
}

// ── Blockquote rule: > at start of line ──
function blockquoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType)
}

// ── Bullet list rule: - or * at start of line ──
function bulletListRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*([*-])\s$/, nodeType)
}

// ── Ordered list rule: 1. at start of line ──
function orderedListRule(nodeType: NodeType) {
  return wrappingInputRule(
    /^\s*(\d+)\.\s$/,
    nodeType,
    match => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order === +match[1]
  )
}

// ── Horizontal rule: --- ──
function horizontalRuleRule(nodeType: NodeType): InputRule {
  return new InputRule(/^(?:---|\*\*\*|___)\s$/, (state, match, start, end) => {
    const { $from } = state.selection
    // Only at the start of a textblock
    if ($from.parentOffset !== match[0].length) return null
    const hr = nodeType.create()
    // Replace the typed text with the HR, then add an empty paragraph after
    return state.tr
      .replaceRangeWith(start, end, hr)
      .scrollIntoView()
  })
}

export function buildInputRules(): Plugin {
  const rules: InputRule[] = [
    headingRule(schema.nodes.heading, 3),
    blockquoteRule(schema.nodes.blockquote),
    bulletListRule(schema.nodes.bullet_list),
    orderedListRule(schema.nodes.ordered_list),
    horizontalRuleRule(schema.nodes.horizontal_rule),
  ]

  return inputRules({ rules })
}
