import { copyFile, cp, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourceJsDirectory = path.join(projectRoot, 'js');
const publicDirectory = path.join(projectRoot, 'public');

async function copyJavaScriptTree(source, destination) {
  const entries = await readdir(source, { withFileTypes: true });
  await mkdir(destination, { recursive: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyJavaScriptTree(sourcePath, destinationPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

await rm(publicDirectory, { recursive: true, force: true });
await mkdir(publicDirectory, { recursive: true });

if (existsSync(sourceJsDirectory)) {
  await copyJavaScriptTree(sourceJsDirectory, path.join(publicDirectory, 'js'));
  console.log('Copied js -> public/js');
} else {
  console.warn('Skipping missing source directory: js/');
}

const assetMappings = [
  ['site', 'public/site'],
  ['docs/css', 'public/css'],
  ['docs/images', 'public/images'],
  ['docs/endpoints', 'public/endpoints'],
  ['docs/assets', 'public/assets'],
];

for (const [relativeSrc, relativeDest] of assetMappings) {
  const src = path.join(projectRoot, relativeSrc);
  const dest = path.join(projectRoot, relativeDest);
  if (existsSync(src)) {
    await cp(src, dest, { recursive: true, force: true });
    console.log(`Copied ${relativeSrc} -> ${relativeDest}`);
  } else {
    console.warn(`Skipping missing directory: ${relativeSrc}`);
  }
}

console.log('Generated public/ directory for static and endpoint delivery.');
