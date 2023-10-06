import fs from 'fs';
import readline from 'readline';

const filename = "UTF_ALL.CSV"
const rs = fs.createReadStream(filename, 'utf8');
const rl = readline.createInterface(rs, {});
const dict = new Map();
rl.on('line', (line) => {
    if (line.length > 0) {
        const columns = line.split(',')
        const postcode = columns[2].substring(1, 8)
        const address = (columns[6] + " " + columns[7] + " " + columns[8]).replace(/"/gi, "")
        dict.set(postcode, address)
    }
}).on('close', () => {
    const outputs = [];
    for (let [k, v] of dict.entries()) {
        outputs.push(k + "\t" + v)
    }
    fs.writeFileSync("a.txt", outputs.join('\n'))
})