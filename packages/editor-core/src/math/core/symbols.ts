import type { MathSymbolGroup } from './types.js';

/**
 * The curated symbol catalog the palette inserts, grouped and searchable by name
 * so a user need not memorize LaTeX commands. Pure data, engine-free. Per the
 * `plain-ascii-typography` rule the `latex` field is ASCII (`\alpha`, `\sum`) and
 * the `preview` field holds the exact Unicode glyph (the Greek letter, the
 * operator sign) - the glyph is content, like an i18n string, not decorative
 * typography, so it is kept verbatim. Start curated (a common set); grow from use.
 */
export const SYMBOL_GROUPS: readonly MathSymbolGroup[] = [
  {
    label: 'Greek',
    symbols: [
      { label: 'alpha', latex: '\\alpha', preview: 'α' },
      { label: 'beta', latex: '\\beta', preview: 'β' },
      { label: 'gamma', latex: '\\gamma', preview: 'γ' },
      { label: 'delta', latex: '\\delta', preview: 'δ' },
      { label: 'epsilon', latex: '\\epsilon', preview: 'ε' },
      { label: 'theta', latex: '\\theta', preview: 'θ' },
      { label: 'lambda', latex: '\\lambda', preview: 'λ' },
      { label: 'mu', latex: '\\mu', preview: 'μ' },
      { label: 'pi', latex: '\\pi', preview: 'π' },
      { label: 'sigma', latex: '\\sigma', preview: 'σ' },
      { label: 'phi', latex: '\\phi', preview: 'φ' },
      { label: 'omega', latex: '\\omega', preview: 'ω' },
      { label: 'Delta', latex: '\\Delta', preview: 'Δ' },
      { label: 'Sigma', latex: '\\Sigma', preview: 'Σ' },
      { label: 'Omega', latex: '\\Omega', preview: 'Ω' },
    ],
  },
  {
    label: 'Operators',
    symbols: [
      { label: 'sum', latex: '\\sum', preview: '∑' },
      { label: 'product', latex: '\\prod', preview: '∏' },
      { label: 'integral', latex: '\\int', preview: '∫' },
      { label: 'partial', latex: '\\partial', preview: '∂' },
      { label: 'nabla', latex: '\\nabla', preview: '∇' },
      { label: 'plus minus', latex: '\\pm', preview: '±' },
      { label: 'times', latex: '\\times', preview: '×' },
      { label: 'divide', latex: '\\div', preview: '÷' },
      { label: 'cdot', latex: '\\cdot', preview: '·' },
      { label: 'infinity', latex: '\\infty', preview: '∞' },
    ],
  },
  {
    label: 'Relations',
    symbols: [
      { label: 'less or equal', latex: '\\leq', preview: '≤' },
      { label: 'greater or equal', latex: '\\geq', preview: '≥' },
      { label: 'not equal', latex: '\\neq', preview: '≠' },
      { label: 'approximately', latex: '\\approx', preview: '≈' },
      { label: 'equivalent', latex: '\\equiv', preview: '≡' },
      { label: 'proportional', latex: '\\propto', preview: '∝' },
      { label: 'element of', latex: '\\in', preview: '∈' },
      { label: 'not element of', latex: '\\notin', preview: '∉' },
      { label: 'subset', latex: '\\subset', preview: '⊂' },
    ],
  },
  {
    label: 'Delimiters',
    symbols: [
      { label: 'left angle', latex: '\\langle', preview: '⟨' },
      { label: 'right angle', latex: '\\rangle', preview: '⟩' },
      { label: 'left ceiling', latex: '\\lceil', preview: '⌈' },
      { label: 'right ceiling', latex: '\\rceil', preview: '⌉' },
      { label: 'left floor', latex: '\\lfloor', preview: '⌊' },
      { label: 'right floor', latex: '\\rfloor', preview: '⌋' },
    ],
  },
  {
    label: 'Arrows',
    symbols: [
      { label: 'right arrow', latex: '\\rightarrow', preview: '→' },
      { label: 'left arrow', latex: '\\leftarrow', preview: '←' },
      { label: 'implies', latex: '\\Rightarrow', preview: '⇒' },
      { label: 'implied by', latex: '\\Leftarrow', preview: '⇐' },
      { label: 'iff', latex: '\\Leftrightarrow', preview: '⇔' },
      { label: 'maps to', latex: '\\mapsto', preview: '↦' },
    ],
  },
];
