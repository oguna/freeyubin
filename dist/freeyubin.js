var freeyubin = (function (exports) {
    'use strict';

    function binarySearchUint16(a, fromIndex, toIndex, key) {
        let low = fromIndex;
        let high = toIndex - 1;
        while (low <= high) {
            const mid = (low + high) >>> 1;
            const midVal = a[mid];
            if (midVal < key)
                low = mid + 1;
            else if (midVal > key)
                high = mid - 1;
            else
                return mid;
        }
        return -(low + 1);
    }
    function bitCount(i) {
        i = i - ((i >>> 1) & 0x55555555);
        i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
        i = (i + (i >>> 4)) & 0x0f0f0f0f;
        i = i + (i >>> 8);
        i = i + (i >>> 16);
        return i & 0x3f;
    }
    function numberOfTrailingZeros(i) {
        let x, y;
        if (i == 0)
            return 64;
        let n = 63;
        y = i;
        if (y != 0) {
            n = n - 32;
            x = y;
        }
        else
            x = (i >>> 32);
        y = x << 16;
        if (y != 0) {
            n = n - 16;
            x = y;
        }
        y = x << 8;
        if (y != 0) {
            n = n - 8;
            x = y;
        }
        y = x << 4;
        if (y != 0) {
            n = n - 4;
            x = y;
        }
        y = x << 2;
        if (y != 0) {
            n = n - 2;
            x = y;
        }
        return n - ((x << 1) >>> 31);
    }

    class LOUDSTrie {
        constructor(bitVector, edges) {
            this.bitVector = bitVector;
            this.edges = edges;
        }
        reverseLookup(index) {
            if (index <= 0 || this.edges.length <= index) {
                throw new RangeError();
            }
            let sb = new Array();
            while (index > 1) {
                sb.push(this.edges[index]);
                index = this.parent(index);
            }
            return sb.reverse().map(v => String.fromCharCode(v)).join('');
        }
        parent(x) {
            return this.bitVector.rank(this.bitVector.select(x, true), false);
        }
        firstChild(x) {
            let y = this.bitVector.select(x, false) + 1;
            if (this.bitVector.get(y)) {
                return this.bitVector.rank(y, true) + 1;
            }
            else {
                return -1;
            }
        }
        traverse(index, c) {
            let firstChild = this.firstChild(index);
            if (firstChild == -1) {
                return -1;
            }
            let childStartBit = this.bitVector.select(firstChild, true);
            let childEndBit = this.bitVector.nextClearBit(childStartBit);
            let childSize = childEndBit - childStartBit;
            let result = binarySearchUint16(this.edges, firstChild, firstChild + childSize, c);
            return result >= 0 ? result : -1;
        }
        lookup(key) {
            let nodeIndex = 1;
            for (let i = 0; i < key.length; i++) {
                let c = key.charCodeAt(i);
                nodeIndex = this.traverse(nodeIndex, c);
                if (nodeIndex == -1) {
                    break;
                }
            }
            return (nodeIndex >= 0) ? nodeIndex : -1;
        }
        *predictiveSearch(index) {
            let lower = index;
            let upper = index + 1;
            while (upper - lower > 0) {
                for (let i = lower; i < upper; i++) {
                    yield i;
                }
                lower = this.bitVector.rank(this.bitVector.select(lower, false) + 1, true) + 1;
                upper = this.bitVector.rank(this.bitVector.select(upper, false) + 1, true) + 1;
            }
        }
        size() {
            return this.edges.length - 2;
        }
    }

    class BitVector {
        constructor(words, sizeInBits) {
            const expectedWordsLength = ((sizeInBits + 63) >> 6) * 2;
            if (expectedWordsLength != words.length) {
                throw new Error(`expected: ${expectedWordsLength} actual: ${words.length}`);
            }
            this.words = words;
            this.sizeInBits = sizeInBits;
            this.lb = new Uint32Array((sizeInBits + 511) >>> 9);
            this.sb = new Uint16Array(this.lb.length * 8);
            let sum = 0;
            let sumInLb = 0;
            for (let i = 0; i < this.sb.length; i++) {
                const bc = i < (this.words.length >>> 1) ? bitCount(this.words[i * 2]) + bitCount(this.words[i * 2 + 1]) : 0;
                this.sb[i] = sumInLb;
                sumInLb += bc;
                if ((i & 7) == 7) {
                    this.lb[i >>> 3] = sum;
                    sum += sumInLb;
                    sumInLb = 0;
                }
            }
        }
        rank(pos, b) {
            if (pos < 0 && this.sizeInBits <= pos) {
                throw new RangeError();
            }
            let count1 = this.sb[pos >>> 6] + this.lb[pos >>> 9];
            const posInDWord = pos & 63;
            if (posInDWord >= 32) {
                count1 += bitCount(this.words[(pos >>> 5) & 0xFFFFFFFE]);
            }
            const posInWord = pos & 31;
            const mask = 0x7FFFFFFF >>> (31 - posInWord);
            count1 += bitCount(this.words[pos >>> 5] & mask);
            return b ? count1 : (pos - count1);
        }
        select(count, b) {
            const lbIndex = this.lowerBoundBinarySearchLB(count, b) - 1;
            const countInLb = count - (b ? this.lb[lbIndex] : (512 * lbIndex - this.lb[lbIndex]));
            const sbIndex = this.lowerBoundBinarySearchSB(countInLb, lbIndex * 8, lbIndex * 8 + 8, b) - 1;
            let countInSb = countInLb - (b ? this.sb[sbIndex] : (64 * (sbIndex % 8) - this.sb[sbIndex]));
            let wordL = this.words[sbIndex * 2];
            let wordU = this.words[sbIndex * 2 + 1];
            if (!b) {
                wordL = ~wordL;
                wordU = ~wordU;
            }
            const lowerBitCount = bitCount(wordL);
            let i = 0;
            if (countInSb > lowerBitCount) {
                wordL = wordU;
                countInSb -= lowerBitCount;
                i = 32;
            }
            while (countInSb > 0) {
                countInSb -= wordL & 1;
                wordL >>>= 1;
                i++;
            }
            return sbIndex * 64 + (i - 1);
        }
        lowerBoundBinarySearchLB(key, b) {
            let high = this.lb.length;
            let low = -1;
            if (b) {
                while (high - low > 1) {
                    let mid = (high + low) >>> 1;
                    if (this.lb[mid] < key) {
                        low = mid;
                    }
                    else {
                        high = mid;
                    }
                }
            }
            else {
                while (high - low > 1) {
                    let mid = (high + low) >>> 1;
                    if (512 * mid - this.lb[mid] < key) {
                        low = mid;
                    }
                    else {
                        high = mid;
                    }
                }
            }
            return high;
        }
        lowerBoundBinarySearchSB(key, fromIndex, toIndex, b) {
            let high = toIndex;
            let low = fromIndex - 1;
            if (b) {
                while (high - low > 1) {
                    const mid = (high + low) >>> 1;
                    if (this.sb[mid] < key) {
                        low = mid;
                    }
                    else {
                        high = mid;
                    }
                }
            }
            else {
                while (high - low > 1) {
                    const mid = (high + low) >>> 1;
                    if (64 * (mid & 7) - this.sb[mid] < key) {
                        low = mid;
                    }
                    else {
                        high = mid;
                    }
                }
            }
            return high;
        }
        nextClearBit(fromIndex) {
            let u = fromIndex >> 5;
            let word = ~this.words[u] & (0xffffffff << fromIndex);
            while (true) {
                if (word != 0)
                    return (u * 32) + numberOfTrailingZeros(word);
                if (++u == this.words.length)
                    return -1;
                word = ~this.words[u];
            }
        }
        size() {
            return this.sizeInBits;
        }
        get(pos) {
            if (pos < 0 && this.sizeInBits <= pos) {
                throw new RangeError();
            }
            return ((this.words[pos >>> 5] >>> (pos & 31)) & 1) == 1;
        }
        toString() {
            let s = "";
            for (let i = 0; i < this.sizeInBits; i++) {
                const bit = ((this.words[i >>> 6] >>> (i & 63)) & 1) == 1;
                s += bit ? '1' : '0';
                if ((i & 63) == 63) {
                    s += ' ';
                }
            }
            return s;
        }
    }

    class BitList {
        constructor(size) {
            if (size == undefined) {
                this.words = new Uint32Array(8);
                this.size = 0;
            }
            else {
                this.words = new Uint32Array((size + 31) >> 5);
                this.size = size;
            }
        }
        add(value) {
            if (this.words.length < (this.size + 1 + 31) >> 5) {
                const newWords = new Uint32Array(this.words.length * 2);
                newWords.set(this.words, 0);
                this.words = newWords;
            }
            this.set(this.size, value);
            this.size++;
        }
        set(pos, value) {
            if (this.size < pos) {
                throw new Error();
            }
            if (value) {
                this.words[pos >> 5] |= 1 << (pos & 31);
            }
            else {
                this.words[pos >> 5] &= ~(1 << (pos & 31));
            }
        }
        get(pos) {
            if (this.size < pos) {
                throw new Error();
            }
            return ((this.words[pos >> 5] >> (pos & 31)) & 1) == 1;
        }
    }

    class CompactDictionary {
        constructor(buffer) {
            const dv = new DataView(buffer);
            let offset = 0;
            [this.keyTrie, offset] = CompactDictionary.readTrie(dv, offset, true);
            [this.valueTrie, offset] = CompactDictionary.readTrie(dv, offset, false);
            const mappingBitVectorSize = dv.getUint32(offset);
            offset += 4;
            const mappingBitVectorWords = new Uint32Array(((mappingBitVectorSize + 63) >> 6) * 2);
            for (let i = 0; i < mappingBitVectorWords.length >> 1; i++) {
                mappingBitVectorWords[i * 2 + 1] = dv.getUint32(offset);
                offset += 4;
                mappingBitVectorWords[i * 2] = dv.getUint32(offset);
                offset += 4;
            }
            this.mappingBitVector = new BitVector(mappingBitVectorWords, mappingBitVectorSize);
            const mappingSize = dv.getUint32(offset);
            offset += 4;
            this.mapping = new Int32Array(mappingSize);
            for (let i = 0; i < mappingSize; i++) {
                this.mapping[i] = dv.getInt32(offset);
                offset += 4;
            }
            if (offset != buffer.byteLength) {
                throw new Error();
            }
            this.hasMappingBitList = CompactDictionary.createHasMappingBitList(this.mappingBitVector);
        }
        static readTrie(dv, offset, compactHiragana) {
            const keyTrieEdgeSize = dv.getInt32(offset);
            offset += 4;
            const keyTrieEdges = new Uint16Array(keyTrieEdgeSize);
            for (let i = 0; i < keyTrieEdgeSize; i++) {
                let c;
                if (compactHiragana) {
                    c = this.decode(dv.getUint8(offset));
                    offset += 1;
                }
                else {
                    c = dv.getUint16(offset);
                    offset += 2;
                }
                keyTrieEdges[i] = c;
            }
            const keyTrieBitVectorSize = dv.getUint32(offset);
            offset += 4;
            const keyTrieBitVectorWords = new Uint32Array(((keyTrieBitVectorSize + 63) >> 6) * 2);
            for (let i = 0; i < keyTrieBitVectorWords.length >>> 1; i++) {
                keyTrieBitVectorWords[i * 2 + 1] = dv.getUint32(offset);
                offset += 4;
                keyTrieBitVectorWords[i * 2] = dv.getUint32(offset);
                offset += 4;
            }
            return [new LOUDSTrie(new BitVector(keyTrieBitVectorWords, keyTrieBitVectorSize), keyTrieEdges), offset];
        }
        static decode(c) {
            if (0x20 <= c && c <= 0x7e) {
                return c;
            }
            if (0xa1 <= c && c <= 0xf6) {
                return (c + 0x3040 - 0xa0);
            }
            throw new RangeError();
        }
        static encode(c) {
            if (0x20 <= c && c <= 0x7e) {
                return c;
            }
            if (0x3041 <= c && c <= 0x3096) {
                return (c - 0x3040 + 0xa0);
            }
            if (0x30fc == c) {
                return (c - 0x3040 + 0xa0);
            }
            throw new RangeError();
        }
        static createHasMappingBitList(mappingBitVector) {
            const numOfNodes = mappingBitVector.rank(mappingBitVector.size() + 1, false);
            const bitList = new BitList(numOfNodes);
            let bitPosition = 0;
            for (let node = 1; node < numOfNodes; node++) {
                let hasMapping = mappingBitVector.get(bitPosition + 1);
                bitList.set(node, hasMapping);
                bitPosition = mappingBitVector.nextClearBit(bitPosition + 1);
            }
            return bitList;
        }
        *search(key) {
            const keyIndex = this.keyTrie.lookup(key);
            if (keyIndex != -1 && this.hasMappingBitList.get(keyIndex)) {
                const valueStartPos = this.mappingBitVector.select(keyIndex, false);
                const valueEndPos = this.mappingBitVector.nextClearBit(valueStartPos + 1);
                const size = valueEndPos - valueStartPos - 1;
                if (size > 0) {
                    const offset = this.mappingBitVector.rank(valueStartPos, false);
                    const result = new Array(size);
                    for (let i = 0; i < result.length; i++) {
                        yield this.valueTrie.reverseLookup(this.mapping[valueStartPos - offset + i]);
                    }
                    return result;
                }
            }
        }
        *predictiveSearch(key) {
            const keyIndex = this.keyTrie.lookup(key);
            if (keyIndex > 1) {
                for (let i of this.keyTrie.predictiveSearch(keyIndex)) {
                    if (this.hasMappingBitList.get(i)) {
                        const valueStartPos = this.mappingBitVector.select(i, false);
                        const valueEndPos = this.mappingBitVector.nextClearBit(valueStartPos + 1);
                        const size = valueEndPos - valueStartPos - 1;
                        const offset = this.mappingBitVector.rank(valueStartPos, false);
                        for (let j = 0; j < size; j++) {
                            yield this.valueTrie.reverseLookup(this.mapping[valueStartPos - offset + j]);
                        }
                    }
                }
            }
        }
    }

    class LOUDSTrieBuilder {
        static build(keys) {
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] == null) {
                    throw new Error();
                }
                if (i > 0 && keys[i - 1] > keys[i]) {
                    throw new Error();
                }
            }
            const nodes = new Uint32Array(keys.length);
            for (let i = 0; i < nodes.length; i++) {
                nodes[i] = 1;
            }
            let cursor = 0;
            let currentNode = 1;
            let edges = "  ";
            const louds = new BitList();
            louds.add(true);
            while (true) {
                let lastChar = 0;
                let lastParent = 0;
                let restKeys = 0;
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i].length < cursor) {
                        continue;
                    }
                    if (keys[i].length == cursor) {
                        louds.add(false);
                        lastParent = nodes[i];
                        lastChar = 0;
                        continue;
                    }
                    const currentChar = keys[i].charCodeAt(cursor);
                    const currentParent = nodes[i];
                    if (lastParent != currentParent) {
                        louds.add(false);
                        louds.add(true);
                        edges += String.fromCharCode(currentChar);
                        currentNode = currentNode + 1;
                    }
                    else if (lastChar != currentChar) {
                        louds.add(true);
                        edges += String.fromCharCode(currentChar);
                        currentNode = currentNode + 1;
                    }
                    nodes[i] = currentNode;
                    lastChar = currentChar;
                    lastParent = currentParent;
                    restKeys++;
                }
                if (restKeys == 0) {
                    break;
                }
                cursor++;
            }
            const bitVectorWords = new Uint32Array(louds.words.buffer, 0, ((louds.size + 63) >> 6) * 2);
            const bitVector = new BitVector(bitVectorWords, louds.size);
            const uint16Edges = new Uint16Array(edges.length);
            for (let i = 0; i < edges.length; i++) {
                uint16Edges[i] = edges.charCodeAt(i);
            }
            return [new LOUDSTrie(bitVector, uint16Edges), nodes];
        }
    }

    class CompactHiraganaString {
        static decodeBytes(bytes) {
            let result = "";
            for (let i = 0; i < bytes.length; i++) {
                result += CompactHiraganaString.decodeByte(bytes[i]);
            }
            return result;
        }
        static decodeByte(c) {
            if (0x20 <= c && c <= 0x7e) {
                return String.fromCharCode(c);
            }
            if (0xa1 <= c && c <= 0xf6) {
                return String.fromCharCode(c + 0x3040 - 0xa0);
            }
            throw new RangeError();
        }
        static encodeString(str) {
            const result = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                result[i] = CompactHiraganaString.encodeChar(str.charCodeAt(i));
            }
            return result;
        }
        static encodeChar(b) {
            if (b == 0) {
                return 0;
            }
            if (0x20 <= b && b <= 0x7e) {
                return b;
            }
            if (0x3041 <= b && b <= 0x3096) {
                return b - 0x3040 + 0xa0;
            }
            if (0x30fc === b) {
                return b - 0x3040 + 0xa0;
            }
            throw new RangeError('unknown character to encode: ' + b);
        }
    }

    class CompactDictionaryBuilder {
        static build(dict) {
            // remove some keys
            const keysToRemove = new Array();
            for (const key of dict.keys()) {
                try {
                    CompactHiraganaString.encodeString(key);
                }
                catch (e) {
                    keysToRemove.push(key);
                    console.log("skipped the world: " + key);
                }
            }
            for (const key of keysToRemove) {
                dict.delete(key);
            }
            // build key trie
            const keys = Array.from(dict.keys()).sort();
            const keyTrie = LOUDSTrieBuilder.build(keys)[0];
            // build value trie
            const valuesSet = new Set();
            for (const value of dict.values()) {
                for (const v of value) {
                    valuesSet.add(v);
                }
            }
            const values = Array.from(valuesSet.values()).sort();
            const valueTrie = LOUDSTrieBuilder.build(values)[0];
            // build trie mapping
            let mappingCount = 0;
            for (const i of dict.values()) {
                mappingCount += i.length;
            }
            const mapping = new Uint32Array(mappingCount);
            let mappingIndex = 0;
            const mappingBitList = new BitList();
            for (let i = 1; i <= keyTrie.size(); i++) {
                let key = keyTrie.reverseLookup(i);
                mappingBitList.add(false);
                let values = dict.get(key);
                if (values != undefined) {
                    for (let j = 0; j < values.length; j++) {
                        mappingBitList.add(true);
                        mapping[mappingIndex] = valueTrie.lookup(values[j]);
                        mappingIndex++;
                    }
                }
            }
            // calculate output size
            const keyTrieDataSize = 8 + keyTrie.edges.length + ((keyTrie.bitVector.size() + 63) >>> 6) * 8;
            const valueTrieDataSize = 8 + valueTrie.edges.length * 2 + ((valueTrie.bitVector.size() + 63) >>> 6) * 8;
            const mappingDataSize = 8 + ((mappingBitList.size + 63) >>> 6) * 8 + mapping.length * 4;
            const outputDataSize = keyTrieDataSize + valueTrieDataSize + mappingDataSize;
            // ready output
            const arrayBuffer = new ArrayBuffer(outputDataSize);
            const dataView = new DataView(arrayBuffer);
            let dataViewIndex = 0;
            // output key trie
            dataView.setInt32(dataViewIndex, keyTrie.edges.length);
            dataViewIndex += 4;
            for (let i = 0; i < keyTrie.edges.length; i++) {
                const compactChar = CompactHiraganaString.encodeChar(keyTrie.edges[i]);
                dataView.setUint8(dataViewIndex, compactChar);
                dataViewIndex += 1;
            }
            dataView.setInt32(dataViewIndex, keyTrie.bitVector.size());
            dataViewIndex += 4;
            const keyTrieBitVectorWords = keyTrie.bitVector.words;
            for (let i = 0; i < keyTrieBitVectorWords.length >>> 1; i++) {
                dataView.setUint32(dataViewIndex, keyTrieBitVectorWords[i * 2 + 1]);
                dataViewIndex += 4;
                dataView.setUint32(dataViewIndex, keyTrieBitVectorWords[i * 2]);
                dataViewIndex += 4;
            }
            // output value trie
            dataView.setInt32(dataViewIndex, valueTrie.edges.length);
            dataViewIndex += 4;
            for (let i = 0; i < valueTrie.edges.length; i++) {
                dataView.setUint16(dataViewIndex, valueTrie.edges[i]);
                dataViewIndex += 2;
            }
            dataView.setInt32(dataViewIndex, valueTrie.bitVector.size());
            dataViewIndex += 4;
            const valueTrieBitVectorWords = valueTrie.bitVector.words;
            for (let i = 0; i < valueTrieBitVectorWords.length >>> 1; i++) {
                dataView.setUint32(dataViewIndex, valueTrieBitVectorWords[i * 2 + 1]);
                dataViewIndex += 4;
                dataView.setUint32(dataViewIndex, valueTrieBitVectorWords[i * 2]);
                dataViewIndex += 4;
            }
            // output mapping
            dataView.setInt32(dataViewIndex, mappingBitList.size);
            dataViewIndex += 4;
            const mappingWordsLen = (mappingBitList.size + 63) >> 6;
            for (let i = 0; i < mappingWordsLen; i++) {
                dataView.setUint32(dataViewIndex, mappingBitList.words[i * 2 + 1]);
                dataViewIndex += 4;
                dataView.setUint32(dataViewIndex, mappingBitList.words[i * 2]);
                dataViewIndex += 4;
            }
            // TODO: padding to 64bit words
            dataView.setInt32(dataViewIndex, mapping.length);
            dataViewIndex += 4;
            for (let i = 0; i < mapping.length; i++) {
                dataView.setUint32(dataViewIndex, mapping[i]);
                dataViewIndex += 4;
            }
            // check data size
            if (dataViewIndex !== outputDataSize) {
                throw new Error(`file size is not valid: expected=${outputDataSize} actual=${dataViewIndex}`);
            }
            return arrayBuffer;
        }
    }

    exports.CompactDictionary = CompactDictionary;
    exports.CompactDictionaryBuilder = CompactDictionaryBuilder;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=freeyubin.js.map
