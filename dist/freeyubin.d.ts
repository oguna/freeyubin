declare class BitVector {
    words: Uint32Array;
    sizeInBits: number;
    lb: Uint32Array;
    sb: Uint16Array;
    constructor(words: Uint32Array, sizeInBits: number);
    rank(pos: number, b: boolean): number;
    select(count: number, b: boolean): number;
    private lowerBoundBinarySearchLB;
    private lowerBoundBinarySearchSB;
    nextClearBit(fromIndex: number): number;
    size(): number;
    get(pos: number): boolean;
    toString(): string;
}

declare class LOUDSTrie {
    bitVector: BitVector;
    edges: Uint16Array;
    constructor(bitVector: BitVector, edges: Uint16Array);
    reverseLookup(index: number): string;
    parent(x: number): number;
    firstChild(x: number): number;
    traverse(index: number, c: number): number;
    lookup(key: string): number;
    predictiveSearch(index: number): IterableIterator<number>;
    size(): number;
}

declare class BitList {
    words: Uint32Array;
    size: number;
    constructor(size?: number);
    add(value: boolean): void;
    set(pos: number, value: boolean): void;
    get(pos: number): boolean;
}

declare class CompactDictionary {
    keyTrie: LOUDSTrie;
    valueTrie: LOUDSTrie;
    mappingBitVector: BitVector;
    mapping: Int32Array;
    hasMappingBitList: BitList;
    constructor(buffer: ArrayBuffer);
    private static readTrie;
    private static decode;
    private static encode;
    private static createHasMappingBitList;
    search(key: string): IterableIterator<string>;
    predictiveSearch(key: string): IterableIterator<string>;
}

declare class CompactDictionaryBuilder {
    static build(dict: Map<string, string[]>): ArrayBuffer;
}

export { CompactDictionary, CompactDictionaryBuilder };
