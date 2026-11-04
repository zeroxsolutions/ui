// Run as a script, reads a GitHub workflow runs array (the `workflow_runs` of the list-runs API, newest
// first) on stdin and prints the base commit `deployBase` picks, or nothing when it picks none.
import { readFileSync } from 'node:fs';

/** A workflow run as the GitHub API lists it; `conclusion` is null until the run completes. */
export interface WorkflowRun {
  head_sha: string;
  conclusion: string | null;
}

/**
 * The commit a deploy diffs against: the `head_sha` of the newest successful run in `runs`, which is
 * ordered newest first. A failed or cancelled run is skipped, so the next deploy still carries what it
 * did not ship. Returns undefined when no run succeeded, and the caller deploys every project.
 */
export function deployBase(runs: WorkflowRun[]): string | undefined {
  return runs.find((run) => run.conclusion === 'success')?.head_sha;
}

if (import.meta.main) {
  const base = deployBase(JSON.parse(readFileSync(0, 'utf8')) as WorkflowRun[]);
  if (base !== undefined) process.stdout.write(`${base}\n`);
}
