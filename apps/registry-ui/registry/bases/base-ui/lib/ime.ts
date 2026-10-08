/**
 * IME (input-method-editor) composition guard, shared by every text input whose
 * Enter key commits or submits. Pure + dependency-free so it stays unit-testable.
 */

/**
 * True when a keydown belongs to an IME that is mid-composition — e.g. a
 * Vietnamese telex/VNI input method assembling a word, or any CJK input method.
 *
 * Such a key (typically Enter or Space, used to COMMIT the composing word) must
 * not be treated as submit/commit, nor hijacked for autocomplete: the composing
 * text hasn't landed in React state yet, so acting on it ships half-composed
 * input — submitting on the commit-Enter would split "Design a landing page"
 * into "Design a landing" + "page" (the second word was still composing).
 *
 * `isComposing` is the standard DOM signal; `keyCode === 229` is the legacy
 * fallback for engines that flag composition only through the old keyCode.
 *
 * Pass the DOM event — from a React synthetic event use `e.nativeEvent`.
 */
export function isImeComposing(e: { isComposing: boolean; keyCode: number }): boolean {
  return e.isComposing || e.keyCode === 229;
}
