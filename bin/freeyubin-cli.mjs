#!/usr/bin/env node

import migemo from '../lib/index.js';
import fs from 'fs';

const filename = "freeyubin-dict-20220531"
const buffer = fs.readFileSync(filename);
const dict = new migemo.CompactDictionary(buffer.buffer);
const postcode = process.argv[2]
for (const address of dict.search(postcode)) {
    console.log(address)
}
