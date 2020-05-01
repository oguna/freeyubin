const fs = require('fs');
const path = require('path');
const readline = require('readline');

let filename = "data/KEN_ALL.CSV"
let rs = fs.createReadStream(filename, 'utf8');
let rl = readline.createInterface(rs, {});
let dict = new Map();
rl.on('line', (line) => {
    if (line.length > 0) {
        let columns = line.split(',')
        let postcode = columns[2].substr(1, columns[2].length - 2)
        let address = (columns[6] + " " + columns[7] + " " + columns[8]).replace(/"/gi, "")
        dict.set(postcode, address)
    }
}).on('close', () => {
    let outputContent = "";
    for (let [k, v] of dict.entries()) {
        outputContent += k + "\t" + v + "\n"
    }
    fs.writeFileSync("a.txt", outputContent)
})