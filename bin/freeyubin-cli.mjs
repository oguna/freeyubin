#!/usr/bin/env node

import { CompactDictionary } from '../dist/freeyubin.mjs';
import fs from 'fs';

const filename = "freeyubin-dict-20230929"
const buffer = fs.readFileSync(filename);
const dict = new CompactDictionary(buffer.buffer);
const postcode = process.argv[2]
for (const address of dict.search(postcode)) {
    console.log(address)
}
