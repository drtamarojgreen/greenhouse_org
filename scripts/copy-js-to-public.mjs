import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync } from 'node:fs';



const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourceDirectory = path.join(projectRoot, 'js');
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

async function copyIfExists(sourcePath, destinationPath) {
  if (!existsSync(sourcePath)) {
    console.warn(`Skipping missing asset: ${path.relative(projectRoot, sourcePath)}`);
    return;
  }
  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
  console.log(`Copied ${path.relative(projectRoot, sourcePath)} -> ${path.relative(projectRoot, destinationPath)}`);
}

// 1. Copy the whole js/ tree into public/js/
if (existsSync(sourceDirectory)) {
  await copyJavaScriptTree(sourceDirectory, path.join(publicDirectory, 'js'));
} else {
  console.warn('Skipping missing source directory: js/');
}

// 2. Copy models assets if they exist.
//    Source and destination are now consistent (no public/docs vs public mismatch).
await copyIfExists(
  path.join(projectRoot, 'docs', 'css', 'model.css'),
  path.join(publicDirectory, 'css', 'model.css'),
);
await copyIfExists(
  path.join(projectRoot, 'docs', 'endpoints', 'models_pathways.json'),
  path.join(publicDirectory, 'endpoints', 'models_pathways.json'),
);
await copyIfExists(
  path.join(projectRoot, 'docs', 'endpoints', 'model_descriptions.xml'),
  path.join(publicDirectory, 'endpoints', 'model_descriptions.xml'),
);

mkdirSync('public', { recursive: true });

// Adjust source paths to match whether folders live in root or docs/
const assetMappings = [
  ['docs/index.html', 'public/index.html'],
  ['docs/css', 'public/css'],
  ['docs/site', 'public/site'],
  ['site', 'public/site'],
  ['docs/js', 'public/js'],
  ['docs/images', 'public/images'],
  ['docs/endpoints', 'public/endpoints']
];

for (const [src, dest] of assetMappings) {
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
    console.log(`Copied ${src} -> ${dest}`);
  }
}


console.log('Copied app assets to public/ for Vercel static delivery.');