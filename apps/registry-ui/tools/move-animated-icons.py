"""Moves the 37 animated icons into icons/<name>-icon.tsx and repoints every reference, once.

Run from apps/registry-ui. Each rewrite asserts its count before it writes, so a surprise stops the
run at the file that surprised it.
"""
import json
import pathlib
import re
import subprocess

UI = pathlib.Path('registry/bases/base-ui/ui')
ICONS = pathlib.Path('registry/bases/base-ui/icons')
HANDLE = re.compile(r'^export interface \w+IconHandle\b', re.M)

names = sorted(p.stem for p in UI.glob('*.tsx') if HANDLE.search(p.read_text()))
assert len(names) == 37, names

ICONS.mkdir(exist_ok=True)
for name in names:
    subprocess.run(['git', 'mv', str(UI / f'{name}.tsx'), str(ICONS / f'{name}-icon.tsx')], check=True)

alternation = '|'.join(re.escape(n) for n in names)

# Imports: '@/registry/bases/base-ui/ui/<name>' in either quote, in registry/ and src/.
imports = re.compile(r"(['\"])@/registry/bases/base-ui/ui/(" + alternation + r")\1")
sources = [p for root in ('registry', 'src') for p in pathlib.Path(root).rglob('*.ts*') if p.is_file()]
expected_sites = sum(len(imports.findall(p.read_text())) for p in sources)
assert expected_sites == 63, expected_sites
written = 0
for path in sources:
    text = path.read_text()
    new, count = imports.subn(lambda m: f"{m[1]}@/registry/bases/base-ui/icons/{m[2]}-icon{m[1]}", text)
    if count:
        path.write_text(new)
        written += count
assert written == 63, written

# registry.json: dependency URLs, then one item per icon.
registry_path = pathlib.Path('registry.json')
registry = json.loads(registry_path.read_text())
url = re.compile(r'^https://lucide-animated\.com/r/(' + alternation + r')\.json$')
edges = 0
for item in registry['items']:
    deps = item.get('registryDependencies', [])
    for i, dep in enumerate(deps):
        m = url.match(dep)
        if m:
            deps[i] = f'https://ui.zeroxsolutions.com/r/{m[1]}-icon.json'
            edges += 1
    if 'registryDependencies' in item:
        item['registryDependencies'] = sorted(deps)
assert edges == 43, edges
for name in names:
    title = ' '.join(part.capitalize() for part in name.split('-')) + ' Icon'
    registry['items'].append({
        'name': f'{name}-icon',
        'type': 'registry:ui',
        'title': title,
        'description': f'An animated {name} icon, adapted from lucide-animated, that renders phrasing content and stays still under reduced motion.',
        'dependencies': ['motion'],
        'registryDependencies': ['@shadcn/utils'],
        'files': [{
            'path': f'registry/bases/base-ui/icons/{name}-icon.tsx',
            'type': 'registry:ui',
            'target': f'components/general/{name}-icon.tsx',
        }],
    })
registry_path.write_text(json.dumps(registry, indent=2) + '\n')

# Docs: the manual install line of each page that names a lucide-animated URL.
docs_url = re.compile(r'https://lucide-animated\.com/r/(' + alternation + r')\.json')
pages = [p for p in pathlib.Path('content/docs/components').glob('*.mdx') if docs_url.search(p.read_text())]
assert len(pages) == 13, [p.name for p in pages]
for page in pages:
    page.write_text(docs_url.sub(lambda m: f'https://ui.zeroxsolutions.com/r/{m[1]}-icon.json', page.read_text()))

print(f'moved {len(names)} icons, {written} imports, {edges} edges, {len(pages)} pages')
