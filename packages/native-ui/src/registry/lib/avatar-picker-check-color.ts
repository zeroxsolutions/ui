/**
 * The check's colour on an avatar swatch: white or near-black, whichever contrasts more with a `#rgb` or
 * `#rrggbb` swatch, by WCAG's relative luminance. White for any other colour string, which it cannot read.
 */
function avatarPickerCheckColor(swatch: string): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(swatch)?.[1];
  if (!hex) return '#ffffff';
  const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex;
  const [r, g, b] = [0, 2, 4].map((at) => {
    const channel = Number.parseInt(full.slice(at, at + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Near-black is #0a0a0a, luminance about 0.003.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.053 ? '#ffffff' : '#0a0a0a';
}

export { avatarPickerCheckColor };
