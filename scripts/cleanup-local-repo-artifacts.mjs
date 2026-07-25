import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

const generatedLocalPaths = ['supabase/.temp', 'supabase/.branches'];

function runGitRm(paths) {
  try {
    execFileSync('git', ['rm', '-r', '-f', '--ignore-unmatch', '--', ...paths], {
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

const removedThroughGit = runGitRm(generatedLocalPaths);

if (!removedThroughGit) {
  for (const path of generatedLocalPaths) {
    if (existsSync(path)) rmSync(path, { recursive: true, force: true });
  }
}

console.log(
  'Local repository artifacts cleanup OK: Supabase .temp and .branches metadata were removed.'
);
