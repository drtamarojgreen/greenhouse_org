import { mkdir, readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourceDirectory = path.join(projectRoot, 'docs', 'js');
const destinationDirectory = path.join(projectRoot, 'js');

const sourceEntries = await readdir(sourceDirectory, { withFileTypes: true });
const conflicts = [];

for (const entry of sourceEntries) {
  const destination = path.join(destinationDirectory, entry.name);
  try {
    await stat(destination);
    conflicts.push(entry.name);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

if (conflicts.length > 0) {
  throw new Error(
    `Move aborted; these destinations already exist in js/: ${conflicts.join(', ')}`,
  );
}

await mkdir(destinationDirectory, { recursive: true });

for (const entry of sourceEntries) {
  await rename(
    path.join(sourceDirectory, entry.name),
    path.join(destinationDirectory, entry.name),
  );
  console.log(`Moved docs/js/${entry.name} -> js/${entry.name}`);
}

console.log(`Moved ${sourceEntries.length} entries into js/.`);
