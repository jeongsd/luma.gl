import test from 'luma.gl/test/setup';
import {promisify, compressImage, loadImage} from 'luma.gl';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

const TEST_DIR = path.join(__dirname, '..', 'data');
const TEST_FILE = path.join(TEST_DIR, 'test.png');

const IMAGE = {
  width: 2,
  height: 3,
  data: new Uint8Array([
    255, 0, 0, 255, 0, 255, 255, 255,
    0, 0, 255, 255, 255, 255, 0, 255,
    0, 255, 0, 255, 255, 0, 255, 255
  ])
};

// Test that we can write and read an image, and that result is identical
/* eslint-disable func-names */
test('io#write-read-image', async function(t) {
  await promisify(mkdirp)(TEST_DIR);
  const file = fs.createWriteStream(TEST_FILE);
  file.on('close', async function() {
    const result = await loadImage(TEST_FILE);
    t.same(result, IMAGE);
    t.end();
  });
  compressImage(IMAGE).pipe(file);
});
