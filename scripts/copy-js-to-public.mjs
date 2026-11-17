import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

await readdir(sourceDirectory);
await mkdir(path.join(publicDirectory, 'js'), { recursive: true });
await mkdir(path.join(publicDirectory, 'docs', 'css'), { recursive: true });
await mkdir(path.join(publicDirectory, 'docs', 'endpoints'), { recursive: true });
await copyJavaScriptTree(sourceDirectory, path.join(publicDirectory, 'js'));
await copyFile(
  path.join(projectRoot, 'docs', 'css', 'model.css'),
  path.join(publicDirectory, 'css', 'model.css'),
);
await copyFile(
  path.join(projectRoot,  'docs', 'endpoints', 'models_pathways.json'),
  path.join(publicDirectory, 'endpoints', 'models_pathways.json'),
);
await copyFile(
  path.join(projectRoot,  'docs', 'endpoints', 'model_descriptions.xml'),
  path.join(publicDirectory,  'endpoints', 'model_descriptions.xml'),
);

console.log('Copied app assets to public/ for Vercel static delivery.');
