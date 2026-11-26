/**
 * Takes CI's captures as the visual suite's references. Given the `visual-diffs` artefact a failed `visual` job
 * uploaded, unpacked into a directory, it copies each capture over the reference it was compared with: a
 * mismatch's `-actual-` file, and a missing reference's `-reference-` file, which is what CI captured where it
 * found none. The diff images are left where they are. Prints each reference it wrote, so the commit holding
 * them can be checked against the diffs that were reviewed.
 *
 * `pnpm nx adopt-visual @zeroxsolutions/ui -- <unpacked artefact>`
 */
import { copyFileSync, globSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const APP = resolve(import.meta.dirname, '..');
const BASELINES = join(APP, 'visual-baselines');
// The artefact holds `<project>/<spec directory>/<spec file>/<capture>-<kind>-<browser>-<platform>.png`.
const CAPTURE =
  /^ui\/(?<directory>.+)\/(?<file>[^/]+)\.tsx\/(?<arg>.+)-(?<kind>actual|reference)-(?<suffix>[^-]+-[^-]+\.png)$/;

const [artefact] = process.argv.slice(2);
if (artefact === undefined) throw new Error('usage: adopt-visual-captures <unpacked visual-diffs artefact>');

const root = resolve(artefact);
let adopted = 0;
for (const entry of globSync('**/*.png', { cwd: root, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const path = relative(root, join(entry.parentPath, entry.name));
  const capture = CAPTURE.exec(path)?.groups;
  if (capture === undefined) continue;
  const reference = join(BASELINES, capture.directory, capture.file, `${capture.arg}-${capture.suffix}`);
  mkdirSync(dirname(reference), { recursive: true });
  copyFileSync(join(root, path), reference);
  console.log(relative(APP, reference));
  adopted += 1;
}
console.log(`adopted ${adopted} captures`);
