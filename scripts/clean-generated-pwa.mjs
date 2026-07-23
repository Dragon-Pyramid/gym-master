import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicDir = resolve(process.cwd(), 'public');
const generatedPatterns = [
  /^sw\.js(?:\.map)?$/,
  /^workbox-[^/]+\.js(?:\.map)?$/,
  /^fallback-[^/]+\.js(?:\.map)?$/,
];

let entries = [];
try {
  entries = await readdir(publicDir, { withFileTypes: true });
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error;
  }
}

const generatedFiles = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => generatedPatterns.some((pattern) => pattern.test(name)));

await Promise.all(
  generatedFiles.map((name) =>
    rm(resolve(publicDir, name), { force: true }),
  ),
);

if (generatedFiles.length > 0) {
  console.log(`Removed stale generated PWA artifacts: ${generatedFiles.join(', ')}`);
} else {
  console.log('No stale generated PWA artifacts found.');
}
