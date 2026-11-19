import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourceJsPackageJson = path.join(projectRoot, 'js', 'package.json');
const publicDirectory = path.join(projectRoot, 'public');
const publicJsDirectory = path.join(publicDirectory, 'js');

await rm(publicDirectory, { recursive: true, force: true });
await mkdir(publicJsDirectory, { recursive: true });

if (existsSync(sourceJsPackageJson)) {
  await copyFile(sourceJsPackageJson, path.join(publicJsDirectory, 'package.json'));
  console.log('Copied js/package.json -> public/js/package.json');
} else {
  console.warn('Skipping missing file: js/package.json');
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

console.log('Generated public/ static assets and public/js/package.json.');
