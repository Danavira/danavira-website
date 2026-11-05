// Fails if any image in the repo carries a GPS position in its EXIF data.
//
// Phones write where a photo was taken into the file. Astro strips metadata
// from the resized copies it serves, but the original is committed to a public
// repository, so the location would still be one click away. The CMS converts
// uploads to WebP in the browser, which drops EXIF; this catches photos added
// any other way. HEIC is rejected outright: browsers cannot show it and it
// keeps its metadata.
//
// To clean a photo: re-export it without location, or run
//   exiftool -gps:all= -overwrite_original <file>
import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const scanDirs = ['src', 'public'];
const GPS_IFD = 0x8825;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

/** The TIFF block ("II*\0" or "MM\0*") of a file's EXIF data, if it has any. */
function exifTiff(buf, ext) {
  if (ext === '.jpg' || ext === '.jpeg') {
    let i = 2;
    while (i + 4 < buf.length && buf[i] === 0xff) {
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker === 0xe1 && buf.toString('latin1', i + 4, i + 10) === 'Exif\0\0') {
        return buf.subarray(i + 10, i + 2 + len);
      }
      if (marker === 0xda) break; // start of scan: no more metadata
      i += 2 + len;
    }
  } else if (ext === '.webp') {
    for (let i = 12; i + 8 <= buf.length;) {
      const id = buf.toString('latin1', i, i + 4);
      const len = buf.readUInt32LE(i + 4);
      if (id === 'EXIF') {
        const data = buf.subarray(i + 8, i + 8 + len);
        return data.toString('latin1', 0, 6) === 'Exif\0\0' ? data.subarray(6) : data;
      }
      i += 8 + len + (len % 2);
    }
  } else if (ext === '.png') {
    for (let i = 8; i + 8 <= buf.length;) {
      const len = buf.readUInt32BE(i);
      if (buf.toString('latin1', i + 4, i + 8) === 'eXIf') return buf.subarray(i + 8, i + 8 + len);
      i += 12 + len;
    }
  }
  return null;
}

/** Whether IFD0 of a TIFF block points at a GPS IFD. */
function hasGps(tiff) {
  if (!tiff || tiff.length < 8) return false;
  const le = tiff.toString('latin1', 0, 2) === 'II';
  const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return false;
  const count = u16(ifd);
  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12;
    if (entry + 12 > tiff.length) break;
    if (u16(entry) === GPS_IFD) return true;
  }
  return false;
}

const problems = [];
let checked = 0;
for (const dir of scanDirs) {
  for await (const file of walk(join(root, dir))) {
    const ext = extname(file).toLowerCase();
    const rel = relative(root, file);
    if (ext === '.heic' || ext === '.heif') {
      problems.push(`${rel}: HEIC is not supported; export as JPEG or upload through the CMS`);
      continue;
    }
    if (!['.jpg', '.jpeg', '.webp', '.png'].includes(ext)) continue;
    checked++;
    if (hasGps(exifTiff(await readFile(file), ext))) {
      problems.push(`${rel}: contains a GPS location in its EXIF data`);
    }
  }
}

if (problems.length) {
  console.error(`lint-images: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
  console.error('Remove the location, for example: exiftool -gps:all= -overwrite_original <file>');
  process.exit(1);
}
console.log(`lint-images: ${checked} images clean`);
