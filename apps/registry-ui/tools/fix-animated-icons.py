"""Gives each animated icon a span wrapper, a reduced-motion guard and its licence header, once.

Run from apps/registry-ui after the move. Every substitution asserts its count in its file first.
The patterns match the icons as prettier left them: single quotes, trailing commas, and the wrapper's
opening tag on one line (palette-icon's spans several, so the wrapper pattern takes any whitespace).
"""
import pathlib
import re

ICONS = pathlib.Path('registry/bases/base-ui/icons')
HEADER = '// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.\n'
HOVER_BY_HAND = {'palette-icon', 'rotate-cw-icon', 'smile-icon', 'sparkles-icon', 'sun-moon-icon'}
HANDLE_BY_HAND = {'palette-icon', 'sparkles-icon', 'sun-moon-icon'}


def sub(pattern: str, repl: str, text: str, count: int, where: str) -> str:
    new, found = re.subn(pattern, repl, text)
    assert found == count, f'{where}: {pattern!r} matched {found}, expected {count}'
    return new


files = sorted(ICONS.glob('*-icon.tsx'))
assert len(files) == 37, len(files)
for path in files:
    name, w, t = path.stem, path.name, path.read_text()
    t = sub(r"^'use client';\n", "'use client';\n\n" + HEADER, t, 1, w)
    t = sub(r'HTMLAttributes<HTMLDivElement>', 'HTMLAttributes<HTMLSpanElement>', t, 1, w)
    t = sub(r'React\.MouseEvent<HTMLDivElement>', 'React.MouseEvent<HTMLSpanElement>', t, 2, w)
    t = sub(r'<div(\s+)className=\{cn\(', rf'<span\1data-slot="{name}"\1className={{cn(', t, 1, w)
    t = sub(r'className=\{cn\(className\)\}', "className={cn('inline-flex', className)}", t, 0 if name == 'palette-icon' else 1, w)
    t = sub(r'(\n\s*)</div>\n', r'\1</span>\n', t, 1, w)
    t = sub(r"import \{ motion, useAnimation \} from 'motion/react';",
            "import { motion, useAnimation, useReducedMotion } from 'motion/react';", t, 1, w)
    # After the last useAnimation() call: sparkles-icon and sun-moon-icon make two.
    t = sub(r'(\n(\s*)const \w+ = useAnimation\(\);\n)(?![\s\S]*useAnimation\(\);)',
            r'\1\2const isMotionReduced = useReducedMotion();\n', t, 1, w)
    if name not in HOVER_BY_HAND:
        t = sub(r"\} else \{(\n\s*)controls\.start\('animate'\);", r"} else if (!isMotionReduced) {\1controls.start('animate');", t, 1, w)
        t = sub(r'\[controls, onMouseEnter\]', '[controls, isMotionReduced, onMouseEnter]', t, 1, w)
    if name not in HANDLE_BY_HAND:
        t = sub(r"(\n(\s*))startAnimation: \(\) => controls\.start\('animate'\),",
                r"\1startAnimation: () => {\1  if (!isMotionReduced) controls.start('animate');\1},", t, 1, w)
    path.write_text(t)
print(f'fixed {len(files)} icons; hover by hand: {sorted(HOVER_BY_HAND)}; handle by hand: {sorted(HANDLE_BY_HAND)}')
