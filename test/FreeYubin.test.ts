import { CompactDictionary } from "../src/CompactDictionary";
import { readFileSync } from "fs";

describe("freeyubin", () => {
    const buff = readFileSync('freeyubin-dict-20230929');
    const dict = new CompactDictionary(buff.buffer);

    it("5650871", () => {
        const iter = dict.search('5650871')
        const address = iter.next().value
        expect(address).toEqual('大阪府 吹田市 山田丘');
    });
});
