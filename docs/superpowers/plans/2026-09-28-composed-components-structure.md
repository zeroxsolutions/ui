# Composed Components Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every composed component under `apps/registry-ui/registry/bases/base-ui/components/` sits in its kind folder, one family per file, under the name the spec gives it, with its exports in one block at the foot; the ten components that only re-assemble upstream parts are gone.

**Architecture:** Five commits, each made by a script whose every edit is an exact string with an asserted count, so a script either does all of its work or stops before writing. The scripts are throwaway: they live in a scratch directory outside the repository and are never committed. Slots, `data-*` state, recipes, the `types/` `constants/` `lib/` `hooks/` extraction and the three defects are plan B, written once this plan lands.

**Tech Stack:** Python 3 (the scripts), git, shadcn CLI 4.21.0 (`shadcn build`, `shadcn registry validate`), Vitest + Testing Library (jsdom), TypeScript, nx 23, pnpm 10.33.0.

**Spec:** `docs/superpowers/specs/2026-09-28-composed-components-design.md` - this plan carries pass 1 and pass 2 rules 1 to 3.

## Global Constraints

- Nothing is published and nothing consumes the registry, so no path, item name or export is kept for compatibility.
- `ui/` stays exactly as `shadcn add` wrote it. The only changes under `registry/bases/base-ui/ui/` in this plan are the four `data-table*.tsx` files moving out and `form.tsx` being deleted.
- `components/docs/` and `editor/` internals are out of scope. `editor/` changes only where an import moves or a component it renders is removed, in the commit that moves or removes it.
- Every script runs from the directory its docstring names and is written to `$S`, a scratch directory outside the repository: `S=$(mktemp -d)` once, before Task 1, and reuse it in every task.
- Commits name their paths (`git commit -F "$S/msg-tN.txt" -- <paths>`; a new file is `git add`ed first) and end with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. The message is written to a file, never inline. Never `--no-verify`, never `HUSKY=0`.
- The pre-commit hook formats the staged files and runs `pnpm nx run-many -t lint typecheck build test`; it must print `Successfully ran targets lint, typecheck, build, test for 5 projects`.
- Authored text (messages, comments, docs) is plain ASCII.
- Baseline at `a20702c`: `pnpm exec vitest run` in `apps/registry-ui` gives `Test Files  77 passed (77)` and `Tests  381 passed (381)`; `pnpm exec tsc --noEmit -p tsconfig.json` there gives exactly 3 errors, all in specs no target type-checks: `language-switcher.spec.tsx` (TS2578 at 203, TS2322 at 208) and `docs/installation.spec.tsx` (TS6307 at 4). Every task ends with those same 3 and no other.

## Review Focus

- An import the move script does not recognise (a template string, a `require`, a path in prose) would still name the old file after a move; the tree must name no moved-away path anywhere (Task 1 and Task 4 run `check-old-paths.py`, which reads every tracked `.ts`, `.tsx`, `.json`, `.md`, `.mdx` and `.css` file in the app).
- A `data-slot` or `group-*/` name renamed in its component but not in a selector that styles off it breaks styling with no error; no old slot or group name may survive in a selector, a spec query or a doc comment (Task 4 step 5 greps for each).
- A renamed identifier that extends the old one (`EmojiAppearance` to `EmojiAppearanceToggleGroup`) must not be renamed twice when the script meets it again; running the rename leaves no doubled name (Task 4 step 5).
- The two hero examples keep rendering the same controls after their components are removed; each gets a spec that passes before and after the rewrite (Task 3 steps 1 to 2 and 5).
- `ui/` must not be touched beyond the five files above, and upstream's own `FieldGroup` must keep its name while the house `FieldGroup` becomes `PanelRow` (Task 4 step 5 greps `ui/field.tsx`; each task's `git status` step lists `ui/`).

---

### Task 1: Move every composed component into its kind folder

**Files:**

- Move: 56 modules and their specs (100 files) from `components/`, `components/chat/`, `components/layouts/` and `ui/data-table*.tsx` into `components/{data-entry,navigation,feedback,data-display,layout,general}/`, as `kind-moves.py` lists
- Delete: `apps/registry-ui/registry/bases/base-ui/ui/form.tsx`
- Modify: the 39 files whose imports reach a moved file; `apps/registry-ui/registry.json` (10 `path` values)

**Interfaces:**

- Consumes: nothing.
- Produces: the post-move paths every later task's script names, for example `components/layout/split-button.tsx`, `components/data-display/data-table-column-header.tsx`, `components/data-entry/tree-indent.tsx`. `move-files.py` is reused by Task 4.

- [ ] **Step 1: Write the move script and the kind table**

`$S/move-files.py`:

```python
"""Move files named by a mapping module and rewrite every import that reaches them.

usage: move-files.py <mapping.py> [--apply]   (the mapping defines MOVES = {old: new})

Run from apps/registry-ui. Without --apply it only reports. Every import is resolved to
the file it reaches, so relative, aliased and `.js`-suffixed specifiers are all found; each
file's planned rewrite count is asserted against what the rewrite actually changed.
"""
import json, os, re, subprocess, sys

BASE = 'registry/bases/base-ui'
import runpy
MOVES = dict(runpy.run_path(sys.argv[1])['MOVES'])
# a module's spec moves with it
for src, dst in list(MOVES.items()):
    spec = src.replace('.tsx', '.spec.tsx')
    if os.path.exists(os.path.join(BASE, spec)):
        MOVES[spec] = dst.replace('.tsx', '.spec.tsx')

APPLY = '--apply' in sys.argv
EXTS = ['.tsx', '.ts', '/index.ts', '/index.tsx']
IMPORT = re.compile(r"""((?:from|import)\s*\(?\s*|vi\.mock\(\s*)(['"])([^'"]+)\2""")


def resolve(spec, importer):
    """Return the repo-relative file an import specifier reaches, or None."""
    if spec.startswith('@/registry/'):
        stem = spec[len('@/'):]
    elif spec.startswith('.'):
        stem = os.path.normpath(os.path.join(os.path.dirname(importer), spec))
    else:
        return None
    stem = re.sub(r'\.js$', '', stem)
    for ext in [''] + EXTS:
        if os.path.isfile(stem + ext):
            return stem + ext
    return None


def respell(spec, importer_new, target_new):
    """Spell the import to target_new in the style spec used."""
    no_ext = re.sub(r'\.tsx?$', '', target_new)
    if spec.startswith('@/'):
        return '@/' + no_ext
    rel = os.path.relpath(no_ext, os.path.dirname(importer_new))
    if not rel.startswith('.'):
        rel = './' + rel
    return rel + ('.js' if spec.endswith('.js') else '')


full = {os.path.join(BASE, k): os.path.join(BASE, v) for k, v in MOVES.items()}
for src in full:
    assert os.path.isfile(src), f'missing source {src}'
for dst in full.values():
    assert not os.path.exists(dst), f'destination exists {dst}'

files = subprocess.run(['git', 'ls-files', 'registry', 'src'], capture_output=True, text=True,
                       check=True).stdout.split()
files = [f for f in files if f.endswith(('.ts', '.tsx'))]

plan = {}
for f in files:
    text = open(f).read()
    f_new = full.get(f, f)
    edits = []
    for m in IMPORT.finditer(text):
        spec = m.group(3)
        target = resolve(spec, f)
        if target is None:
            continue
        t_new = full.get(target, target)
        if f_new == f and t_new == target:
            continue
        new_spec = respell(spec, f_new, t_new)
        if new_spec != spec:
            edits.append((m.group(1) + m.group(2) + spec + m.group(2),
                          m.group(1) + m.group(2) + new_spec + m.group(2)))
    if edits:
        plan[f] = edits

total = sum(len(e) for e in plan.values())
print(f'{len(full)} files move; {total} import rewrites in {len(plan)} files')
for f, edits in sorted(plan.items()):
    for old, new in edits:
        print(f'  {f}: {old} -> {new}')

registry = json.load(open('registry.json'))
path_edits = [(p['path'], full[p['path']]) for it in registry['items'] for p in it['files']
              if p['path'] in full]
print(f'{len(path_edits)} registry.json paths move')

if not APPLY:
    sys.exit(0)

for f, edits in plan.items():
    text = open(f).read()
    for old, new in edits:
        expected = sum(1 for o, _ in edits if o == old)
        assert text.count(old) == expected, f'{f}: {old!r} found {text.count(old)}, expected {expected}'
    for old, new in dict(edits).items():
        text = text.replace(old, new)
    open(f, 'w').write(text)

for src, dst in full.items():
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    subprocess.run(['git', 'mv', src, dst], check=True)

for src in full:
    d = os.path.dirname(src)
    while d != BASE and os.path.isdir(d) and not os.listdir(d):
        os.rmdir(d)
        d = os.path.dirname(d)

raw = open('registry.json').read()
for old, new in path_edits:
    needle = f'"path": "{old}"'
    assert raw.count(needle) == 1, f'registry.json: {needle} found {raw.count(needle)}'
    raw = raw.replace(needle, f'"path": "{new}"')
open('registry.json', 'w').write(raw)
print('applied')
```

`$S/kind-moves.py`:

```python
"""Pass 1: every composed component into the folder its root's kind names."""
MOVES = {
    # data-entry
    'components/chat/chat-empty-state.tsx': 'components/data-entry/chat-empty-state.tsx',
    'components/emoji-appearance.tsx': 'components/data-entry/emoji-appearance.tsx',
    'components/emoji-picker.tsx': 'components/data-entry/emoji-picker.tsx',
    'components/language-switcher.tsx': 'components/data-entry/language-switcher.tsx',
    'components/number-field.tsx': 'components/data-entry/number-field.tsx',
    'components/password-input.tsx': 'components/data-entry/password-input.tsx',
    'components/resize-handle.tsx': 'components/data-entry/resize-handle.tsx',
    'components/tag-input.tsx': 'components/data-entry/tag-input.tsx',
    'components/tree-item.tsx': 'components/data-entry/tree-item.tsx',
    'components/tree-indent.tsx': 'components/data-entry/tree-indent.tsx',
    # navigation
    'components/command-switcher.tsx': 'components/navigation/command-switcher.tsx',
    # feedback
    'components/confirm-button.tsx': 'components/feedback/confirm-button.tsx',
    'components/copy-button.tsx': 'components/feedback/copy-button.tsx',
    'components/dirty-dot.tsx': 'components/feedback/dirty-dot.tsx',
    'components/permission.tsx': 'components/feedback/permission.tsx',
    'components/status-dot.tsx': 'components/feedback/status-dot.tsx',
    'components/tab-close-button.tsx': 'components/feedback/tab-close-button.tsx',
    # data-display
    'components/ai-provider-card.tsx': 'components/data-display/ai-provider-card.tsx',
    'components/binary-file-card.tsx': 'components/data-display/binary-file-card.tsx',
    'components/chat/chat-message.tsx': 'components/data-display/chat-message.tsx',
    'components/code-block.tsx': 'components/data-display/code-block.tsx',
    'ui/data-table.tsx': 'components/data-display/data-table.tsx',
    'ui/data-table-column-header.tsx': 'components/data-display/data-table-column-header.tsx',
    'ui/data-table-pagination.tsx': 'components/data-display/data-table-pagination.tsx',
    'ui/data-table-view-options.tsx': 'components/data-display/data-table-view-options.tsx',
    'components/file-type-icon.tsx': 'components/data-display/file-type-icon.tsx',
    'components/font-preview.tsx': 'components/data-display/font-preview.tsx',
    'components/image-preview.tsx': 'components/data-display/image-preview.tsx',
    'components/markdown-view.tsx': 'components/data-display/markdown-view.tsx',
    'components/model-info-card.tsx': 'components/data-display/model-info-card.tsx',
    'components/layouts/section.tsx': 'components/data-display/section.tsx',
    # layout
    'components/avatar-editor.tsx': 'components/layout/avatar-editor.tsx',
    'components/layouts/center.tsx': 'components/layout/center.tsx',
    'components/layouts/container.tsx': 'components/layout/container.tsx',
    'components/disclosure.tsx': 'components/layout/disclosure.tsx',
    'components/layouts/field-grid.tsx': 'components/layout/field-grid.tsx',
    'components/layouts/field-group.tsx': 'components/layout/field-group.tsx',
    'components/file-tree.tsx': 'components/layout/file-tree.tsx',
    'components/layouts/floating-toolbar.tsx': 'components/layout/floating-toolbar.tsx',
    'components/frontmatter-editor.tsx': 'components/layout/frontmatter-editor.tsx',
    'components/menu-button.tsx': 'components/layout/menu-button.tsx',
    'components/split-button.tsx': 'components/layout/split-button.tsx',
    'components/model-list.tsx': 'components/layout/model-list.tsx',
    'components/model-list-item.tsx': 'components/layout/model-list-item.tsx',
    'components/model-list-skeleton.tsx': 'components/layout/model-list-skeleton.tsx',
    'components/layouts/panel-header.tsx': 'components/layout/panel-header.tsx',
    'components/chat/reasoning.tsx': 'components/layout/reasoning.tsx',
    'components/chat/tool.tsx': 'components/layout/tool.tsx',
    'components/sidebar-group-collapsible.tsx': 'components/layout/sidebar-group-collapsible.tsx',
    'components/sidebar-menu-collapsible.tsx': 'components/layout/sidebar-menu-collapsible.tsx',
    # general
    'components/icon-chip.tsx': 'components/general/icon-chip.tsx',
    'components/icon-label.tsx': 'components/general/icon-label.tsx',
    'components/layouts/labeled-control.tsx': 'components/general/labeled-control.tsx',
    'components/popover-icon-button.tsx': 'components/general/popover-icon-button.tsx',
    'components/search-input.tsx': 'components/general/search-input.tsx',
    'components/toolbar-button.tsx': 'components/general/toolbar-button.tsx',
}
```

`$S/check-old-paths.py`:

```python
"""Print every file under the app that still names a path a mapping moved away.

usage: check-old-paths.py <mapping.py>...   (run from apps/registry-ui; prints nothing when clean)
"""
import re, runpy, subprocess, sys

stems = set()
for mapping in sys.argv[1:]:
    ns = runpy.run_path(mapping)
    # a mapping built from the tree is empty once the moves ran, so read its static table
    olds = list(ns['MOVES']) + ['components/' + k for k in ns.get('_FILES', {})]
    for old in olds:
        stems.add(re.sub(r'(\.spec)?\.tsx?$', '', old))
files = subprocess.run(['git', 'ls-files', '.'], capture_output=True, text=True,
                       check=True).stdout.split()
for f in files:
    if not f.endswith(('.ts', '.tsx', '.json', '.md', '.mdx', '.css')):
        continue
    text = open(f).read()
    for s in sorted(stems):
        for m in re.finditer(re.escape(s) + r'(?![-\w])', text):
            print(f'{f}:{text.count(chr(10), 0, m.start()) + 1}: {s}')
```

- [ ] **Step 2: Dry-run the move**

Run: `cd apps/registry-ui && python3 "$S/move-files.py" "$S/kind-moves.py" | grep -E 'files move|paths move'`
Expected:

```
100 files move; 54 import rewrites in 39 files
10 registry.json paths move
```

- [ ] **Step 3: Apply it and delete `ui/form.tsx`**

Run (from `apps/registry-ui`):

```bash
python3 "$S/move-files.py" "$S/kind-moves.py" --apply | tail -1
git rm -q registry/bases/base-ui/ui/form.tsx
```

Expected: `applied`. Nothing imports `ui/form.tsx`, and no base-vega item upstream publishes it.

- [ ] **Step 4: Check nothing names an old path and `ui/` lost only the five files**

Run (from `apps/registry-ui`):

```bash
python3 "$S/check-old-paths.py" "$S/kind-moves.py"
git status --short registry/bases/base-ui/ui
```

Expected: the first prints nothing; the second prints exactly these five lines:

```
D  registry/bases/base-ui/ui/data-table-column-header.tsx
D  registry/bases/base-ui/ui/data-table-pagination.tsx
D  registry/bases/base-ui/ui/data-table-view-options.tsx
D  registry/bases/base-ui/ui/data-table.tsx
D  registry/bases/base-ui/ui/form.tsx
```

- [ ] **Step 5: Run the specs, the type check and the registry build**

Run (from `apps/registry-ui`):

```bash
pnpm exec vitest run > "$S/vt-t1.log" 2>&1; grep -E 'Test Files|^ +Tests' "$S/vt-t1.log"
pnpm exec tsc --noEmit -p tsconfig.json > "$S/tsc-t1.log" 2>&1; grep 'error TS' "$S/tsc-t1.log" | cut -c1-110
pnpm exec shadcn build > "$S/sb-t1.log" 2>&1; tail -1 "$S/sb-t1.log"
pnpm exec shadcn registry validate registry.json 2>&1 | grep Checked
```

Expected: `Test Files  77 passed (77)`, `Tests  381 passed (381)`; the 3 baseline errors, now under `components/data-entry/language-switcher.spec.tsx` and `components/docs/installation.spec.tsx`; `Building registry.` marked done; `Checked 1 registry file and 25 items.`

- [ ] **Step 6: Commit**

`$S/msg-t1.txt`:

```
refactor(registry-ui): sort composed components into kind folders

Why: a component's folder was set by what it was for (chat/, layouts/)
or by nothing at all, so the tree said nothing about what a root does.
Each root now sits in the kind its own body names: data-entry,
navigation, feedback, data-display, layout or general.

The four data-table files leave ui/, which now holds only what shadcn
add wrote. ui/form.tsx goes: nothing imports it and no base-vega item
upstream publishes it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git add -A -- apps/registry-ui/registry apps/registry-ui/registry.json
git status --short -- ':!apps/registry-ui'
git commit -q -F "$S/msg-t1.txt" -- apps/registry-ui/registry apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the status line prints nothing (no change outside the app); the hook prints `Successfully ran targets lint, typecheck, build, test for 5 projects`; the log shows the subject above.

---

### Task 2: Merge the families split across files

**Files:**

- Modify: `components/data-display/data-table.tsx` (absorbs `data-table-column-header.tsx`, `data-table-pagination.tsx`, `data-table-view-options.tsx`)
- Modify: `components/layout/model-list.tsx` and `.spec.tsx` (absorb `model-list-item` and `model-list-skeleton` and their specs)
- Modify: `components/data-entry/tree-item.tsx` and `.spec.tsx` (absorb `tree-indent` and its spec)
- Delete: the seven absorbed modules and the three absorbed specs
- Modify: `apps/registry-ui/registry.json` (the `tree-indent` item goes; `tree-item` stops depending on it)

**Interfaces:**

- Consumes: the Task 1 paths above.
- Produces: `DataTable*`, `ModelList*` and `TreeItem`/`TreeIndent` exported from their root's file; `registry.json` with 24 items.

- [ ] **Step 1: Write the merge script and the registry edit**

`$S/merge-family.py`:

```python
"""Merge a family split across files into its root's file.

usage: merge-family.py [--apply] <root-file> <part-file>...

Run from apps/registry-ui/registry/bases/base-ui. Named imports are unioned per module,
imports between the merged files are dropped, each file's export block is folded into one
at the foot, and the parts' bodies follow the root's in argument order. Without --apply the
merged text is printed, not written.
"""
import os, re, subprocess, sys

APPLY = '--apply' in sys.argv
args = [a for a in sys.argv[1:] if a != '--apply']
root, parts = args[0], args[1:]
files = [root] + parts
def stem(path):
    return re.sub(r'\.(spec\.)?tsx?$', '', os.path.basename(re.sub(r'\.js$', '', path)))

stems = {stem(f) for f in files}
root_stem = stem(root)
SPECS = root.endswith('.spec.tsx')

IMPORT = re.compile(r"^import\s+(type\s+)?(.*?)\s+from\s+'([^']+)';\n", re.S | re.M)
EXPORT = re.compile(r"^export\s+(type\s+)?\{([^}]*)\};\n?", re.M)

modules = {}          # module -> {'default': set, 'named': {name: is_type}}
order = []
bodies, values, types = [], [], []
directive = False

for f in files:
    text = open(f).read()
    if text.startswith("'use client';"):
        directive = True
        text = text[len("'use client';"):].lstrip('\n')
    imports = list(IMPORT.finditer(text))
    assert imports and imports[0].start() == 0 or not imports, f'{f}: code before the first import'
    end = imports[-1].end() if imports else 0
    for m in imports:
        type_only, clause, module = bool(m.group(1)), m.group(2), m.group(3)
        if stem(module) in stems:
            if not SPECS:
                continue              # the merged files no longer import each other
            module = os.path.join(os.path.dirname(module), root_stem).replace('@/', '@/', 1)
            if not module.startswith(('.', '@')):
                module = './' + module
        entry = modules.setdefault(module, {'default': set(), 'named': {}})
        if module not in order:
            order.append(module)
        named = re.search(r'\{(.*)\}', clause, re.S)
        head = clause[:named.start()].strip().rstrip(',').strip() if named else clause.strip()
        if head:
            entry['default'].add(head)
        if named:
            for name in [n.strip() for n in named.group(1).split(',') if n.strip()]:
                is_type = type_only or name.startswith('type ')
                name = name[5:] if name.startswith('type ') else name
                entry['named'][name] = entry['named'].get(name, True) and is_type
    body = text[end:]
    for m in EXPORT.finditer(body):
        names = [n.strip() for n in m.group(2).split(',') if n.strip()]
        (types if m.group(1) else values).extend(names)
    bodies.append(EXPORT.sub('', body).strip('\n'))

lines = ["'use client';", ''] if directive else []
for module in order:
    entry = modules[module]
    named = sorted(entry['named'].items())
    for head in sorted(entry['default']):
        lines.append(f"import {head} from '{module}';")
    if named:
        if all(t for _, t in named):
            spelled = ', '.join(n for n, _ in named)
            lines.append(f"import type {{ {spelled} }} from '{module}';")
        else:
            spelled = ', '.join(('type ' + n) if t else n for n, t in named)
            lines.append(f"import {{ {spelled} }} from '{module}';")
out = '\n'.join(lines) + '\n\n' + '\n\n'.join(bodies) + '\n\n'
out += f"export {{ {', '.join(dict.fromkeys(values))} }};\n"
if types:
    out += f"export type {{ {', '.join(dict.fromkeys(types))} }};\n"

if not APPLY:
    print(out)
    sys.exit(0)
open(root, 'w').write(out)
for p in parts:
    subprocess.run(['git', 'rm', '-q', '-f', p], check=True)
print(f'merged {len(parts)} files into {root}; exports: {len(values)} values, {len(types)} types')
```

`$S/drop-tree-indent-item.py`:

```python
"""TreeIndent is now a part of TreeItem's file, so it is no longer an item of its own."""
import json
URL = 'https://ui.zeroxsolutions.com/r/tree-indent.json'
r = json.load(open('registry.json'))
before = len(r['items'])
r['items'] = [it for it in r['items'] if it['name'] != 'tree-indent']
assert len(r['items']) == before - 1, 'expected exactly one tree-indent item'
tree_item = next(it for it in r['items'] if it['name'] == 'tree-item')
assert URL in tree_item['registryDependencies']
tree_item['registryDependencies'].remove(URL)
json.dump(r, open('registry.json', 'w'), indent=2, ensure_ascii=False)
open('registry.json', 'a').write('\n')
print(f"items: {before} -> {len(r['items'])}")
```

- [ ] **Step 2: Merge the three families**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
M="$S/merge-family.py"; C=components
python3 $M --apply $C/data-display/data-table.tsx $C/data-display/data-table-column-header.tsx $C/data-display/data-table-pagination.tsx $C/data-display/data-table-view-options.tsx
python3 $M --apply $C/layout/model-list.tsx $C/layout/model-list-item.tsx $C/layout/model-list-skeleton.tsx
python3 $M --apply $C/layout/model-list.spec.tsx $C/layout/model-list-item.spec.tsx $C/layout/model-list-skeleton.spec.tsx
python3 $M --apply $C/data-entry/tree-item.tsx $C/data-entry/tree-indent.tsx
python3 $M --apply $C/data-entry/tree-item.spec.tsx $C/data-entry/tree-indent.spec.tsx
```

Expected: five `merged N files into ...` lines (3, 2, 2, 1, 1 files).

- [ ] **Step 3: Drop the `tree-indent` item**

Run (from `apps/registry-ui`): `python3 "$S/drop-tree-indent-item.py"`
Expected: `items: 25 -> 24`

- [ ] **Step 4: Run the specs, the type check and the registry build**

Run the four commands of Task 1 step 5 with `t2` in the log names.
Expected: `Test Files  74 passed (74)`, `Tests  381 passed (381)` (three spec files merged, no test lost); the 3 baseline errors; `Checked 1 registry file and 24 items.`

- [ ] **Step 5: Commit**

`$S/msg-t2.txt`:

```
refactor(registry-ui): merge each split family into its root's file

Why: DataTable, ModelList and TreeItem each spread one family across
several files, so a part's file named the part rather than the root it
belongs to. Each family is now one file named for its root, and
TreeIndent stops being a registry item of its own.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git add -A -- apps/registry-ui/registry apps/registry-ui/registry.json
git commit -q -F "$S/msg-t2.txt" -- apps/registry-ui/registry apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook's success line for 5 projects; the subject above.

---

### Task 3: Remove the components that only re-assemble upstream parts

**Files:**

- Create: `apps/registry-ui/registry/bases/base-ui/examples/split-button-hero.spec.tsx`, `.../examples/menu-button-hero.spec.tsx`
- Modify: `examples/split-button-hero.tsx`, `examples/menu-button-hero.tsx` (rewritten onto `ButtonGroup`, `Button`, `DropdownMenu*`)
- Modify: `components/data-entry/emoji-picker.tsx` (`SearchInput` becomes `InputGroup`), `editor/code/file-content-router.tsx` and its spec (`BinaryFileCard` becomes `Empty`), `components/feedback/permission.spec.tsx` (`SplitButton` becomes upstream parts)
- Delete: `ConfirmButton`, `PopoverIconButton`, `ToolbarButton`, `SearchInput`, `BinaryFileCard`, `MenuButton`, `SplitButton`, `SidebarGroupCollapsible`, `SidebarMenuCollapsible`, `Section`, with their specs
- Modify: `apps/registry-ui/registry.json` (the `split-button` and `menu-button` items go; the two heroes depend on `@shadcn/button`, `@shadcn/button-group`, `@shadcn/dropdown-menu`)

**Interfaces:**

- Consumes: the Task 1 paths; `registry.json` with 24 items.
- Produces: `registry.json` with 22 items; `SplitButtonHero` and `MenuButtonHero` still exported from their example files.

- [ ] **Step 1: Write the characterization specs for the two heroes**

`apps/registry-ui/registry/bases/base-ui/examples/split-button-hero.spec.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { SplitButtonHero } from './split-button-hero';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('SplitButtonHero', () => {
  it('renders the primary action beside a labelled caret', () => {
    render(<SplitButtonHero />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More action options' })).toBeTruthy();
  });

  it('opens the related actions from the caret', async () => {
    render(<SplitButtonHero />);
    fireEvent.click(screen.getByRole('button', { name: 'More action options' }));
    expect(await screen.findByRole('menuitem', { name: 'Second' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Third' })).toBeTruthy();
  });
});
```

`apps/registry-ui/registry/bases/base-ui/examples/menu-button-hero.spec.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { MenuButtonHero } from './menu-button-hero';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('MenuButtonHero', () => {
  it('shows the remembered default as the primary action', () => {
    render(<MenuButtonHero />);
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeTruthy();
  });

  it('makes the picked option the primary action', async () => {
    render(<MenuButtonHero />);
    fireEvent.click(screen.getByRole('button', { name: 'Change action' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Always allow' }));
    expect(await screen.findByRole('button', { name: 'Always allow' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run them against the current heroes**

Run (from `apps/registry-ui`): `pnpm exec vitest run registry/bases/base-ui/examples 2>&1 | grep -E 'Test Files|^ +Tests'`
Expected: `Test Files  2 passed (2)`, `Tests  4 passed (4)`. They pin behaviour the rewrite must keep, so they pass before it; a failure here means the spec is wrong, not the hero.

- [ ] **Step 3: Write the removal script**

`$S/remove-components.py`:

```python
"""Pass 2, rule 1: remove the components that only re-assemble upstream parts.

Run from apps/registry-ui. Each edit replaces an exact string whose count is asserted first.
"""
import json, subprocess

B = 'registry/bases/base-ui/'
REMOVED = [
    'components/feedback/confirm-button', 'components/general/popover-icon-button',
    'components/general/toolbar-button', 'components/general/search-input',
    'components/data-display/binary-file-card', 'components/layout/menu-button',
    'components/layout/split-button', 'components/layout/sidebar-group-collapsible',
    'components/layout/sidebar-menu-collapsible', 'components/data-display/section',
]


PENDING = {}


def edit(path, old, new, count=1):
    """Stage one replacement; nothing is written until every edit has matched."""
    text = PENDING.get(path) or open(B + path).read()
    assert text.count(old) == count, f'{path}: expected {count} of {old[:60]!r}, found {text.count(old)}'
    PENDING[path] = text.replace(old, new)


# emoji-picker composes upstream's input group where SearchInput re-assembled it
edit('components/data-entry/emoji-picker.tsx', "  SearchX,\n", "  Search,\n  SearchX,\n")
edit('components/data-entry/emoji-picker.tsx',
     "import { SearchInput } from '../general/search-input';\n",
     "import {\n  InputGroup,\n  InputGroupAddon,\n  InputGroupInput,\n}"
     " from '@/registry/bases/base-ui/ui/input-group';\n")
edit('components/data-entry/emoji-picker.tsx',
     "  React.ComponentProps<typeof SearchInput>,\n", "  React.ComponentProps<'input'>,\n")
edit('components/data-entry/emoji-picker.tsx',
     """      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
        {...props}
      />
""",
     """      <InputGroup className={className}>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          {...props}
        />
      </InputGroup>
""")

# the editor's binary fallback composes upstream's Empty where BinaryFileCard re-assembled it
edit('editor/code/file-content-router.tsx',
     "import { BinaryFileCard } from '@/registry/bases/base-ui/components/data-display/binary-file-card';\n",
     "import { FileTypeIcon } from '@/registry/bases/base-ui/components/data-display/file-type-icon';\n")
edit('editor/code/file-content-router.tsx',
     "import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';\n",
     "import {\n  Empty,\n  EmptyHeader,\n  EmptyMedia,\n  EmptyTitle,\n}"
     " from '@/registry/bases/base-ui/ui/empty';\n"
     "import { ScrollArea } from '@/registry/bases/base-ui/ui/scroll-area';\n")
edit('editor/code/file-content-router.tsx',
     "      content = children ?? <BinaryFileCard name={file.path} />;\n",
     """      content = children ?? (
        <Empty className="size-full">
          <EmptyHeader>
            <EmptyMedia>
              <FileTypeIcon
                name={file.path}
                className="size-12 text-muted-foreground"
              />
            </EmptyMedia>
            <EmptyTitle>{file.path}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
""")
edit('editor/code/file-content-router.tsx',
     "Replaces the default `BinaryFileCard` for the `binary` view.",
     "Replaces the default empty state for the `binary` view.")
edit('editor/code/file-content-router.tsx', "\u2192 `BinaryFileCard`.", "\u2192 an `Empty` naming the file.")
edit('editor/code/file-content-router.spec.tsx',
     """    expect(
      container.querySelector('[data-slot="binary-file-card"]'),
    ).toBeTruthy();
""",
     """    expect(container.querySelector('[data-slot="empty"]')).toBeTruthy();
""")

# permission's spec composed SplitButton; it composes upstream's parts instead
edit('components/feedback/permission.spec.tsx',
     """import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from '../layout/split-button';
import { Button } from '@/registry/bases/base-ui/ui/button';
""",
     """import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';
""")
edit('components/feedback/permission.spec.tsx',
     """          <SplitButton>
            <SplitButtonAction variant="default">Allow once</SplitButtonAction>
            <SplitButtonMenu>
              <SplitButtonTrigger
                variant="default"
                aria-label="More allow options"
              />
              <SplitButtonContent>
                <SplitButtonItem>Allow this session</SplitButtonItem>
              </SplitButtonContent>
            </SplitButtonMenu>
          </SplitButton>
""",
     """          <ButtonGroup>
            <Button>Allow once</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size="icon" aria-label="More allow options" />}
              />
              <DropdownMenuContent align="end" className="w-auto">
                <DropdownMenuItem>Allow this session</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
""")
edit('components/feedback/permission.spec.tsx',
     "a graduated-scope SplitButton Allow", "a graduated-scope split Allow")

# permission's doc comments named SplitButton as the Allow control
edit('components/feedback/permission.tsx',
     " *       <SplitButton>...Allow once + scopes...</SplitButton>   // plain Button for a single scope\n",
     " *       <ButtonGroup>...Allow once + scopes...</ButtonGroup>   // plain Button for a single scope\n")
edit('components/feedback/permission.tsx',
     " * button and the graduated-scope `Allow` control (a `SplitButton`, or a plain\n"
     " * `Button` for a single scope).\n",
     " * button and the graduated-scope `Allow` control (a `ButtonGroup` holding a\n"
     " * `Button` and a `DropdownMenu`, or a plain `Button` for a single scope).\n")

SPLIT_HERO = """'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

/** A primary action plus a caret menu of related actions, composed from upstream parts. */
function SplitButtonHero() {
  return (
    <ButtonGroup aria-label="Allow">
      <Button variant="outline">Action</Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label="More action options"
            />
          }
        >
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuItem onClick={() => {}}>Second</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Third</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export { SplitButtonHero };
"""

MENU_HERO = """'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

const OPTIONS = [
  { value: 'once', label: 'Allow once' },
  { value: 'session', label: 'Allow this session' },
  { value: 'always', label: 'Always allow' },
] as const;

type OptionValue = (typeof OPTIONS)[number]['value'];

/** A remembered-default action whose caret menu picks the default, composed from upstream parts. */
function MenuButtonHero() {
  const [value, setValue] = useState<OptionValue>('once');
  const current = OPTIONS.find((option) => option.value === value);

  return (
    <ButtonGroup aria-label="Remembered action">
      <Button variant="outline">{current?.label}</Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Change action" />
          }
        >
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto">
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => setValue(next as OptionValue)}
          >
            {OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

export { MenuButtonHero };
"""
for path, text in PENDING.items():
    open(B + path, 'w').write(text)
open(B + 'examples/split-button-hero.tsx', 'w').write(SPLIT_HERO)
open(B + 'examples/menu-button-hero.tsx', 'w').write(MENU_HERO)

for stem in REMOVED:
    for suffix in ('.tsx', '.spec.tsx'):
        path = B + stem + suffix
        if subprocess.run(['git', 'ls-files', '--error-unmatch', path], capture_output=True).returncode == 0:
            subprocess.run(['git', 'rm', '-q', '-f', path], check=True)

registry = json.load(open('registry.json'))
before = len(registry['items'])
registry['items'] = [it for it in registry['items'] if it['name'] not in ('split-button', 'menu-button')]
assert len(registry['items']) == before - 2, 'expected the split-button and menu-button items'
UPSTREAM = ['@shadcn/button', '@shadcn/button-group', '@shadcn/dropdown-menu']
for name in ('split-button-hero', 'menu-button-hero'):
    item = next(it for it in registry['items'] if it['name'] == name)
    item['registryDependencies'] = UPSTREAM
json.dump(registry, open('registry.json', 'w'), indent=2, ensure_ascii=False)
open('registry.json', 'a').write('\n')
print(f"removed {len(REMOVED)} components; items: {before} -> {len(registry['items'])}")
```

- [ ] **Step 4: Apply it**

Run (from `apps/registry-ui`): `python3 "$S/remove-components.py"`
Expected: `removed 10 components; items: 24 -> 22`. An `AssertionError` naming a file means that file no longer holds the exact text the edit expects; nothing has been written, so read the file, correct the edit's string and rerun.

- [ ] **Step 5: Run the specs, the type check and the registry build**

Run the four commands of Task 1 step 5 with `t3` in the log names, then:

```bash
pnpm exec vitest run registry/bases/base-ui/examples 2>&1 | grep -E 'Test Files|^ +Tests'
grep -rnE 'ConfirmButton|PopoverIconButton|ToolbarButton|SearchInput|BinaryFileCard|MenuButton[^H]|SplitButton[^H]|Sidebar(Group|Menu)Collapsible|components/data-display/section' registry src | grep -v '/ui/'
```

Expected: `Test Files  68 passed (68)`, `Tests  362 passed (362)`; the 3 baseline errors; `Checked 1 registry file and 22 items.`; the heroes' `2 passed`, `4 passed`; the grep prints nothing.

- [ ] **Step 6: Commit**

`$S/msg-t3.txt`:

```
refactor(registry-ui): compose upstream parts where a wrapper only re-assembled them

Why: ConfirmButton, PopoverIconButton, ToolbarButton, SearchInput,
BinaryFileCard, MenuButton, SplitButton, SidebarGroupCollapsible,
SidebarMenuCollapsible and Section each added no behaviour and no
recipe of their own, so each was a second name for a composition
upstream already publishes. Their callers now compose the upstream
parts, and the split-button and menu-button items go with them.

ConfirmButton never closed its dialog after onConfirm; that defect
leaves with it.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
E=apps/registry-ui/registry/bases/base-ui/examples
git add "$E/split-button-hero.spec.tsx" "$E/menu-button-hero.spec.tsx"
git add -A -- apps/registry-ui/registry apps/registry-ui/registry.json
git commit -q -F "$S/msg-t3.txt" -- apps/registry-ui/registry apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook's success line for 5 projects; the subject above.

---

### Task 4: Rename each family for what it is

**Files:**

- Move: 13 modules and their specs (25 files), as `rename-moves.py` lists: `disclosure` to `collapsible-card`, `permission` to `permission-card`, `tool` to `tool-call-card`, `reasoning` to `reasoning-collapsible`, `command-switcher` to `command-menu`, `avatar-editor` to `avatar-picker`, `frontmatter-editor` to `frontmatter-form`, `dirty-dot` to `unsaved-indicator`, `status-dot` to `status-indicator`, `emoji-appearance` to `emoji-appearance-toggle-group`, `container` to `page-container`, `field-group` to `panel-row`, `field-grid` to `panel-field-group`
- Modify: every file that declares, imports, styles off or names one of the renamed identifiers, slots or groups; `apps/registry-ui/registry.json` (3 `path` values)

**Interfaces:**

- Consumes: the Task 1 to 3 tree; `move-files.py` and `check-old-paths.py` from Task 1.
- Produces: the names in the spec's families table - `CollapsibleCard*`, `PermissionCard*`, `ToolCallCard*`, `ReasoningCollapsible*` (`useReasoningCollapsible`), `CommandMenu*` (`useCommandMenu`), `AvatarPicker*` (`AvatarPickerValue`, `AvatarPickerTab`, `useAvatarPicker`), `FrontmatterForm*` (`FrontmatterFormField*`, `useFrontmatterFormContext`, `useFrontmatterFormField`), `UnsavedIndicator`, `StatusIndicator`, `EmojiAppearanceToggleGroup*`, `EmojiPickerGrid`, `EmojiPickerCell`, `PageContainer` (`pageContainerVariants`), `PanelRow*`, `PanelFieldGroup*`, `TreeItemIndent*`; `data-slot` and `group/` names in the same words, kebab-cased.

- [ ] **Step 1: Write the rename script and its tables**

`$S/rename-identifiers.py`:

```python
"""Rename identifiers and data-slot / group names, scoped to a module and its importers.

usage: rename-identifiers.py <mapping.py> [--apply]

The mapping defines RENAMES, a list of dicts:
  file    the declaring module, relative to apps/registry-ui
  prefix  [(Old, New)]: Old as a whole identifier or followed by a capital (Old, OldProps, OldItem)
  exact   [(old, new)]: whole identifiers only
  kebab   [(old, new)]: in data-slot values and group/ peer/ names, as a whole name or a prefix before '-'
Scope is the declaring file plus every file whose imports resolve to it, so a same-named
upstream symbol elsewhere is never touched; slot names also reach those files' specs,
which query the DOM their module renders. Without --apply every match is listed; a match
inside a string literal is flagged for review.
"""
import os, re, runpy, subprocess, sys

APPLY = '--apply' in sys.argv
RENAMES = runpy.run_path(sys.argv[1])['RENAMES']
EXTS = ['.tsx', '.ts', '/index.ts', '/index.tsx']
IMPORT = re.compile(r"""(?:from|import)\s*\(?\s*(['"])([^'"]+)\1|vi\.mock\(\s*(['"])([^'"]+)\3""")

files = [f for f in subprocess.run(['git', 'ls-files', 'registry', 'src'], capture_output=True,
                                   text=True, check=True).stdout.split()
         if f.endswith(('.ts', '.tsx')) and os.path.isfile(f)]


def resolve(spec, importer):
    if spec.startswith('@/registry/'):
        stem = spec[2:]
    elif spec.startswith('.'):
        stem = os.path.normpath(os.path.join(os.path.dirname(importer), spec))
    else:
        return None
    stem = re.sub(r'\.js$', '', stem)
    for ext in [''] + EXTS:
        if os.path.isfile(stem + ext):
            return stem + ext
    return None


def importers(target):
    out = []
    for f in files:
        for m in IMPORT.finditer(open(f).read()):
            if resolve(m.group(2) or m.group(4), f) == target:
                out.append(f)
                break
    return out


def fresh(old, new):
    """Where the new name extends the old one, skip text that already carries it."""
    return '(?!' + re.escape(new[len(old):]) + ')' if new.startswith(old) and new != old else ''


def patterns(rule):
    pats = [(re.compile(r'\b' + re.escape(o) + fresh(o, n) + r'(?=[A-Z]|\b)'), o, n)
            for o, n in rule.get('prefix', [])]
    pats += [(re.compile(r'\b' + re.escape(o) + r'\b'), o, n) for o, n in rule.get('exact', [])]
    pats += [(re.compile(r'''((?:data-slot=|slot=)["']|\[data-slot=["']?|\[slot=["']?|(?:group|peer)[^\s"'/]*/)''' + re.escape(o)
                         + fresh(o, n) + r'''(?=[-"'`\]:\s])'''), o, n) for o, n in rule.get('kebab', [])]
    return pats


in_string = re.compile(r'''(['"`])(?:(?!\1).)*$''')
changed = {}
for rule in RENAMES:
    scope = [rule['file']] + [f for f in importers(rule['file']) if f != rule['file']]
    # a spec queries the DOM its module renders, so it sees the slot names of what that module renders
    specs = [f.replace('.tsx', '.spec.tsx') for f in scope if not f.endswith('.spec.tsx')]
    specs = [f for f in specs if os.path.isfile(f) and f not in scope]
    for f in scope + specs:
        text = changed.get(f, open(f).read())
        for pat, old, new in patterns(rule):
            if f in specs and not pat.pattern.startswith('((?:data-slot'):
                continue
            hits = list(pat.finditer(text))
            for h in hits:
                line_start = text.rfind('\n', 0, h.start()) + 1
                before = text[line_start:h.start()]
                is_kebab = h.re.pattern.startswith('((?:data-slot')
                flag = '  <- inside a string' if not is_kebab and in_string.search(before) else ''
                line = text.count('\n', 0, h.start()) + 1
                print(f'{f}:{line}: {old} -> {new}{flag}')
            if pat.pattern.startswith('((?:data-slot'):
                text = pat.sub(lambda m: m.group(1) + new, text)
            else:
                text = pat.sub(new, text)
        changed[f] = text

# Prose outside the scope names these families too. A backticked name is always an
# identifier, and a rule marked global names something only this repo declares.
everywhere = [f for f in files if '/ui/' not in f]
for rule in RENAMES:
    for old, new in rule.get('prefix', []) + rule.get('exact', []):
        if rule.get('global'):
            pat = re.compile(r'\b' + re.escape(old) + fresh(old, new) + r'(?=[A-Z]|\b)')
        else:
            pat = re.compile(r'(?<=`)' + re.escape(old) + fresh(old, new) + r'(?=[A-Z]\w*`|`)')
        for f in everywhere:
            text = changed.get(f, open(f).read())
            if pat.search(text):
                print(f'{f}: {old} -> {new} (prose)')
                changed[f] = pat.sub(new, text)

print(f'{len(changed)} files in scope')
if APPLY:
    for f, text in changed.items():
        open(f, 'w').write(text)
    print('applied')
```

`$S/renames.py`:

```python
"""Pass 2, rule 3: names that state what each family is, and the files that carry them.

`global` marks a name only this repo declares, renamed in every file outside ui/.
"""
B = 'registry/bases/base-ui/components/'

RENAMES = [
    {'file': B + 'layout/disclosure.tsx', 'global': True,
     'prefix': [('Disclosure', 'CollapsibleCard')],
     'exact': [('disclosureVariants', 'collapsibleCardVariants')],
     'kebab': [('disclosure', 'collapsible-card')]},
    {'file': B + 'feedback/permission.tsx',
     'prefix': [('Permission', 'PermissionCard')],
     'kebab': [('permission', 'permission-card')]},
    {'file': B + 'layout/tool.tsx',
     'prefix': [('Tool', 'ToolCallCard')],
     'kebab': [('tool', 'tool-call-card')]},
    {'file': B + 'layout/reasoning.tsx',
     'prefix': [('Reasoning', 'ReasoningCollapsible')],
     'exact': [('useReasoning', 'useReasoningCollapsible')]},
    {'file': B + 'navigation/command-switcher.tsx', 'global': True,
     'prefix': [('CommandSwitcher', 'CommandMenu')],
     'exact': [('useCommandSwitcher', 'useCommandMenu')]},
    {'file': B + 'layout/avatar-editor.tsx', 'global': True,
     'prefix': [('AvatarEditor', 'AvatarPicker'), ('AvatarValue', 'AvatarPickerValue'),
                ('AvatarTab', 'AvatarPickerTab')],
     'exact': [('useAvatarEditor', 'useAvatarPicker')],
     'kebab': [('avatar-editor', 'avatar-picker')]},
    {'file': B + 'layout/frontmatter-editor.tsx', 'global': True,
     'exact': [('FrontmatterEditor', 'FrontmatterForm'), ('FrontmatterEditorProps', 'FrontmatterFormProps'),
               ('FrontmatterValue', 'FrontmatterFormValue'),
               ('FrontmatterContext', 'FrontmatterFormContext'),
               ('FrontmatterContextValue', 'FrontmatterFormContextValue'),
               ('useFrontmatterContext', 'useFrontmatterFormContext'),
               ('useFrontmatterField', 'useFrontmatterFormField')],
     'prefix': [('FrontmatterField', 'FrontmatterFormField')],
     'kebab': [('frontmatter-editor', 'frontmatter-form')]},
    {'file': B + 'feedback/dirty-dot.tsx', 'global': True,
     'prefix': [('DirtyDot', 'UnsavedIndicator')],
     'kebab': [('dirty-dot', 'unsaved-indicator')]},
    {'file': B + 'feedback/status-dot.tsx', 'global': True,
     'prefix': [('StatusDot', 'StatusIndicator')],
     'kebab': [('status-dot', 'status-indicator')]},
    {'file': B + 'data-entry/emoji-appearance.tsx', 'global': True,
     'prefix': [('EmojiAppearance', 'EmojiAppearanceToggleGroup')],
     'kebab': [('emoji-appearance', 'emoji-appearance-toggle-group')]},
    {'file': B + 'data-entry/emoji-picker.tsx', 'global': True,
     'exact': [('EmojiGrid', 'EmojiPickerGrid'), ('EmojiCell', 'EmojiPickerCell')]},
    {'file': B + 'layout/container.tsx',
     'prefix': [('Container', 'PageContainer')],
     'exact': [('containerVariants', 'pageContainerVariants')],
     'kebab': [('container', 'page-container')]},
    {'file': B + 'layout/field-group.tsx',
     'exact': [('FieldGroup', 'PanelRow'), ('FieldGroupProps', 'PanelRowProps')],
     'kebab': [('field-group', 'panel-row')]},
    {'file': B + 'layout/field-grid.tsx', 'global': True,
     'prefix': [('FieldGrid', 'PanelFieldGroup')],
     'kebab': [('field-grid', 'panel-field-group')]},
    {'file': B + 'data-entry/tree-item.tsx', 'global': True,
     'prefix': [('TreeIndent', 'TreeItemIndent')],
     'kebab': [('tree-indent', 'tree-item-indent')]},
]
```

`$S/rename-moves.py`:

```python
"""Pass 2, rule 3: each renamed family's file takes its root's name."""
import os

_BASE = 'registry/bases/base-ui/components/'
_FILES = {
    'layout/disclosure': 'layout/collapsible-card',
    'feedback/permission': 'feedback/permission-card',
    'layout/tool': 'layout/tool-call-card',
    'layout/reasoning': 'layout/reasoning-collapsible',
    'navigation/command-switcher': 'navigation/command-menu',
    'layout/avatar-editor': 'layout/avatar-picker',
    'layout/frontmatter-editor': 'layout/frontmatter-form',
    'feedback/dirty-dot': 'feedback/unsaved-indicator',
    'feedback/status-dot': 'feedback/status-indicator',
    'data-entry/emoji-appearance': 'data-entry/emoji-appearance-toggle-group',
    'layout/container': 'layout/page-container',
    'layout/field-group': 'layout/panel-row',
    'layout/field-grid': 'layout/panel-field-group',
}
MOVES = {}
for old, new in _FILES.items():
    for suffix in ('.tsx', '.spec.tsx'):
        if os.path.exists(f'registry/bases/base-ui/components/{old}{suffix}'):
            MOVES[f'components/{old}{suffix}'] = f'components/{new}{suffix}'
```

- [ ] **Step 2: Dry-run the identifier rename and read the string hits**

Run (from `apps/registry-ui`):

```bash
python3 "$S/rename-identifiers.py" "$S/renames.py" > "$S/rename-dry.txt"; tail -1 "$S/rename-dry.txt"
grep 'inside a string' "$S/rename-dry.txt"
```

Expected: `50 files in scope` on the last line, and 85 `inside a string` lines. Each is a rename landing after a quote or backtick on its line: a doc comment, a thrown developer error such as `'AvatarEditor parts must be used within <AvatarEditor>'`, or a test's `describe`/`it` title, all naming the component. Read each and confirm none is text a user reads (an `aria-label`, a placeholder, visible copy); in the rehearsal none was.

- [ ] **Step 3: Apply the identifier rename, then the file moves**

Run (from `apps/registry-ui`):

```bash
python3 "$S/rename-identifiers.py" "$S/renames.py" --apply | tail -1
python3 "$S/move-files.py" "$S/rename-moves.py" | grep -E 'files move|paths move'
python3 "$S/move-files.py" "$S/rename-moves.py" --apply | tail -1
```

Expected: `applied`; then `25 files move; ...` and `3 registry.json paths move`; then `applied`. The identifier rename goes first because it finds a module's importers by resolving imports to the declaring file's current path.

- [ ] **Step 4: Run the specs, the type check and the registry build**

Run the four commands of Task 1 step 5 with `t4` in the log names.
Expected: `Test Files  68 passed (68)`, `Tests  362 passed (362)`; the 3 baseline errors; `Checked 1 registry file and 22 items.`

- [ ] **Step 5: Check no old name, path, slot or doubled name survives**

Run (from `apps/registry-ui`):

```bash
python3 "$S/check-old-paths.py" "$S/kind-moves.py" "$S/rename-moves.py"
grep -rnP "(data-slot=|slot=|\[data-slot=|\[slot=|group[^\s\"'/]*/)[\"']?(disclosure|permission|tool|container|field-group|field-grid|dirty-dot|status-dot|emoji-appearance|avatar-editor|frontmatter-editor|tree-indent)(?![-\w]*card|-toggle-group|-picker|-form|-item-indent|-collapsible)" registry src | grep -v '/ui/'
grep -rnoE '\w*(CallCardCallCard|PermissionCardCard|CollapsibleCollapsible|ToggleGroupToggleGroup|PageContainerPage|IndicatorIndicator|TreeItemItem)\w*' registry src
grep -rnwE 'Disclosure\w*|CommandSwitcher\w*|AvatarEditor\w*|FrontmatterEditor\w*|DirtyDot|StatusDot|EmojiGrid|EmojiCell|FieldGrid\w*|TreeIndent\w*' registry src | grep -v '/ui/'
grep -c 'FieldGroup' registry/bases/base-ui/ui/field.tsx
git status --short registry/bases/base-ui/ui
```

Expected: the first four print nothing; the `FieldGroup` count in upstream's `ui/field.tsx` is unchanged from `git show HEAD:apps/registry-ui/registry/bases/base-ui/ui/field.tsx | grep -c FieldGroup`; the last prints nothing.

- [ ] **Step 6: Commit**

`$S/msg-t4.txt`:

```
refactor(registry-ui): name each family for the component it is

Why: several roots were named for a behaviour (Disclosure, Reasoning),
a guess at the content (Tool, Permission), or a shape upstream already
owns (FieldGroup took upstream's name and data-slot, so upstream's
group/field-group selectors matched it). Each is now a subject plus a
shape the design system uses, its parts open with the root's name, and
each file, data-slot and group name follows.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git add -A -- apps/registry-ui/registry apps/registry-ui/src apps/registry-ui/registry.json
git commit -q -F "$S/msg-t4.txt" -- apps/registry-ui/registry apps/registry-ui/src apps/registry-ui/registry.json
git log -1 --format='%h %s'
```

Expected: the hook's success line for 5 projects; the subject above.

---

### Task 5: One export block at each file's foot

**Files:**

- Modify: the files under `components/` (outside `components/docs/`, specs excluded) that export inline - 77 declarations

**Interfaces:**

- Consumes: the Task 4 tree.
- Produces: no inline `export function`, `export const`, `export interface` or `export type` in `components/**/*.tsx`; every export in one `export { }` and one `export type { }` at the foot. No exported name changes.

- [ ] **Step 1: Write the fold script**

`$S/export-at-foot.py`:

```python
"""Pass 2, rule 7a: every composed component file exports once, at its foot.

Run from apps/registry-ui/registry/bases/base-ui. Inline `export` on a top-level function,
const, interface or type is dropped and the name joins `export { }` or `export type { }` at
the foot, merged with any block already there. Without --apply the planned names are listed.
"""
import glob, re, sys

APPLY = '--apply' in sys.argv
INLINE = re.compile(r'^export (function|const|interface|type|async function) ([A-Za-z_]\w*)', re.M)
BLOCK = re.compile(r'^export (type )?\{([^}]*)\};\n?', re.M)

total = 0
for f in sorted(glob.glob('components/**/*.tsx', recursive=True)):
    if '/docs/' in f or f.endswith('.spec.tsx'):
        continue
    text = open(f).read()
    found = [(kind, name) for kind, name in INLINE.findall(text)]
    if not found:
        continue
    values, types = [], []
    for m in BLOCK.finditer(text):
        names = [n.strip() for n in m.group(2).split(',') if n.strip()]
        (types if m.group(1) else values).extend(names)
    for kind, name in found:
        (types if kind in ('interface', 'type') else values).append(name)
    text = INLINE.sub(lambda m: m.group(0)[len('export '):], text)
    text = BLOCK.sub('', text).rstrip('\n') + '\n\n'
    if values:
        text += f"export {{ {', '.join(dict.fromkeys(values))} }};\n"
    if types:
        text += f"export type {{ {', '.join(dict.fromkeys(types))} }};\n"
    total += len(found)
    print(f'{f}: {", ".join(n for _, n in found)}')
    if APPLY:
        open(f, 'w').write(text)
print(f'{total} inline exports folded')
```

- [ ] **Step 2: Dry-run it**

Run (from `apps/registry-ui/registry/bases/base-ui`): `python3 "$S/export-at-foot.py" | tail -1`
Expected: `77 inline exports folded`

- [ ] **Step 3: Apply it and confirm it has nothing left to fold**

Run (from `apps/registry-ui/registry/bases/base-ui`):

```bash
python3 "$S/export-at-foot.py" --apply | tail -1
python3 "$S/export-at-foot.py" | tail -1
grep -rlnE '^export (function|const [A-Z])' components --include='*.tsx' | grep -v /docs/
```

Expected: `77 inline exports folded`, then `0 inline exports folded`, then nothing.

- [ ] **Step 4: Run the specs, the type check and the registry build**

Run the four commands of Task 1 step 5 with `t5` in the log names.
Expected: `Test Files  68 passed (68)`, `Tests  362 passed (362)`; the 3 baseline errors; `Checked 1 registry file and 22 items.`

- [ ] **Step 5: Commit**

`$S/msg-t5.txt`:

```
refactor(registry-ui): export each composed family once, at its foot

Why: exports were typed inline wherever a declaration happened to sit,
so a file's public surface could only be read by scanning all of it.
One export block at the foot states what the family exports.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Run (from the repo root):

```bash
git add -A -- apps/registry-ui/registry/bases/base-ui/components
git commit -q -F "$S/msg-t5.txt" -- apps/registry-ui/registry/bases/base-ui/components
git log -1 --format='%h %s'
```

Expected: the hook's success line for 5 projects; the subject above.

---

## After this plan

The spec's kind-folder check still prints `components/chat` and its loose-file check prints `components/language-switcher-data.tsx`: both are the `types/`, `constants/` and `lib/` extraction, rule 4, and move in plan B with the slots, `data-*` state, recipes and the three defects.

Plan B also carries three renames that come with a reshape: `LabeledControl` becomes `PanelFieldLabel`, `ChatEmptyState` becomes `ChatSuggestionItem`, and `LanguageSwitcher` splits into `LanguageCombobox` and `LanguageToggleGroup`.
