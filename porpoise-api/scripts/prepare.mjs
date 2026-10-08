import { mkdir, copyFile } from 'node:fs/promises';
import { STANCES } from '../lib/stances.js';
await mkdir(new URL('../assets/', import.meta.url), { recursive: true });
await mkdir(new URL('../public/', import.meta.url), { recursive: true });
for (const stance of STANCES) {
  await copyFile(new URL(`../../porpoise/stances/${stance}.yaml`, import.meta.url),
    new URL(`../assets/${stance}.yaml`, import.meta.url));
}
