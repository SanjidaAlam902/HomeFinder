'use strict';
// Image upload helpers: content sniffing (never trust the client's MIME type), random names, safe deletion.
const fs = require('fs/promises'), path = require('path'), crypto = require('crypto');

// Detect the real format from the file's first bytes.
function sniff(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: '.jpg', mime: 'image/jpeg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: '.png', mime: 'image/png' };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', mime: 'image/webp' };
  return null;
}

const URL_RE = /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/;
const isUploadUrl = u => typeof u === 'string' && URL_RE.test(u);

// Validate every file first; only write to disk if all pass. Returns URLs like /uploads/<random>.jpg
async function saveImages(files, dir) {
  const checked = files.map(f => ({ f, kind: sniff(f.buffer) }));
  if (checked.some(c => !c.kind)) { const e = new Error('Only real JPG, PNG or WebP images are allowed'); e.status = 400; throw e; }
  const written = [];
  try {
    for (const { f, kind } of checked) {
      const name = crypto.randomBytes(16).toString('hex') + kind.ext;
      await fs.writeFile(path.join(dir, name), f.buffer, { flag: 'wx', mode: 0o644 });
      written.push('/uploads/' + name);
    }
  } catch (e) { await removeImages(written, dir); throw e; }
  return written;
}

// Delete files by URL. Only exact, server-generated names are ever touched (no path traversal).
async function removeImages(urls, dir) {
  await Promise.all((urls || []).filter(isUploadUrl).map(u => fs.unlink(path.join(dir, path.basename(u))).catch(() => {})));
}

module.exports = { sniff, saveImages, removeImages, isUploadUrl };
