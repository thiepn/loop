import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST_DIR = new URL('../dist/', import.meta.url);
const TEMPLATE_URL = new URL('./sw-template.js', import.meta.url);
const BASE_PATH = '/loop/';

async function walk(directoryUrl) {
  const entries = await readdir(directoryUrl, {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const child = new URL(
      encodeURIComponent(entry.name) + (entry.isDirectory() ? '/' : ''),
      directoryUrl,
    );

    if (entry.isDirectory()) {
      files.push(...await walk(child));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    files.push(child);
  }

  return files;
}

function toDistRelative(fileUrl) {
  const distPath = DIST_DIR.pathname;
  const filePath = fileUrl.pathname;
  const relativePath = relative(
    decodeURIComponent(distPath),
    decodeURIComponent(filePath),
  );

  return relativePath.split(sep).join('/');
}

function publicUrl(relativePath) {
  return `${BASE_PATH}${relativePath}`;
}

const allFiles = await walk(DIST_DIR);
const cacheable = allFiles
  .map(toDistRelative)
  .filter((path) => (
    path !== 'sw.js'
    && !path.endsWith('.map')
    && !path.startsWith('.')
  ))
  .sort();

const required = [
  'index.html',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.svg',
  'icons/icon-512.svg',
  'icons/icon-maskable-512.svg',
];

for (const path of required) {
  if (!cacheable.includes(path)) {
    throw new Error(`Missing required PWA build asset: ${path}`);
  }
}

const manifestText = await readFile(
  new URL('../dist/manifest.webmanifest', import.meta.url),
  'utf8',
);
const manifest = JSON.parse(manifestText);
const iconSizes = new Set(
  Array.isArray(manifest.icons)
    ? manifest.icons.map((icon) => icon?.sizes)
    : [],
);

if (!iconSizes.has('192x192') || !iconSizes.has('512x512')) {
  throw new Error(
    'PWA manifest must include explicit 192x192 and 512x512 icons.',
  );
}

const precacheUrls = [
  BASE_PATH,
  ...cacheable.map(publicUrl),
];

const digest = createHash('sha256')
  .update(JSON.stringify(precacheUrls))
  .digest('hex')
  .slice(0, 12);

const template = await readFile(TEMPLATE_URL, 'utf8');
const output = template
  .replace('__CACHE_VERSION__', digest)
  .replace(
    '__PRECACHE_URLS__',
    JSON.stringify(precacheUrls, null, 2),
  );

await writeFile(
  new URL('../dist/sw.js', import.meta.url),
  output,
  'utf8',
);

console.log(
  `Generated dist/sw.js with ${precacheUrls.length} precached URLs (${digest}).`,
);
