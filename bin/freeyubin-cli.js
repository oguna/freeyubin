#!/usr/bin/env node

const migemo = require('../lib/index.js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const filename = "freeyubin-dict-20220531"
let buffer = fs.readFileSync(filename);
let ab = new ArrayBuffer(buffer.length);
let view = new Uint8Array(ab);
buffer.copy(view);
let dict = new migemo.CompactDictionary(ab);
let postcode = process.argv[2]
for (let address of dict.search(postcode)) {
    console.log(address)
}
