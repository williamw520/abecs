/*
  BitVec.js - A high performance JavaScript bit vector class.
  Copyright (C) 2020 William Wong.  All rights reserved.
  williamw520@gmail.com
*/

// Local defines for word bit info.
const WORD_ADDRESS_BITS = 5;                            // 32-bit word needs 5 bits for addressing.
const BITS_PER_WORD     = 1 << WORD_ADDRESS_BITS;       // 32 bits per word
const BITMASK32         = 0xFFFFFFFF;

// Local util functions.
const wordIdx           = (bitIndex) => bitIndex >>> WORD_ADDRESS_BITS;
const wordsOfBits       = (nbits) => wordIdx(nbits - 1) + 1;
const rand32            = (rng) => (rng || Math.random)() * 0xFFFFFFFF;     // use a custom random-number-generator; default to Math.random().
const bitCount          = (word32) => {
    // Henry Warren's pop-count.
    word32 -= ((word32 >>> 1) & 0x55555555);
    word32 = (word32 & 0x33333333) + ((word32 >>> 2) & 0x33333333);
    return (((word32 + (word32 >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24);
}
const trailing0s        = (word32) => {
    const INVERSE = (word32 ^ (word32 - 1)) >>> 1;      // invert any trailing 0's to 1's, and make the rest as 0's.
    return bitCount(INVERSE);
}


export class BitVec {

    // Initialize the bit vector object with the number of bits.
    constructor(numberOfBits) {
        this.nbits = numberOfBits || BITS_PER_WORD;     // default to 32 bits.
        this.words = new Uint32Array(wordsOfBits(numberOfBits));
    }

    clone() {
        let b = new BitVec(this.nbits);
        b.words = this.words.slice();
        return b;
    }

    bitOn(bitIndex)     { this._bounded(bitIndex);  this._wordOr( wordIdx(bitIndex), 1 << bitIndex)             }
    bitOff(bitIndex)    { this._bounded(bitIndex);  this._wordAnd(wordIdx(bitIndex), 1 << bitIndex)             }
    flip(bitIndex)      { this._bounded(bitIndex);  this._wordXor(wordIdx(bitIndex), 1 << bitIndex)             }
    set(bitIndex, val)  { this._bounded(bitIndex);  val ? this.bitOn(bitIndex) : this.bitOff(bitIndex)          }
    get(bitIndex)       { this._bounded(bitIndex);  return (this.words[ wordIdx(bitIndex) ] >>> bitIndex) & 1   }
    isOn(bitIndex)      { this._bounded(bitIndex);  return this.get(bitIndex) == 1                              }
    isOff(bitIndex)     { this._bounded(bitIndex);  return this.get(bitIndex) == 0                              }
    cardinality()       { return this.words.reduce( (sum, w) => (sum += bitCount(w), sum), 0 )                  }
    clear()             { this.words.forEach( (_, i) => this.words[i] = 0 )                                     }
    setAll()            { this.words.forEach( (_, i) => this.words[i] = BITMASK32 ); this._trimMsbs();          }
    randomize(rng)      { this.words.forEach( (_, i) => this.words[i] = rand32(rng) );  this._trimMsbs();       }
    rangeOn(from, to)   { this._rangeOp(from, to, this._wordOr.bind(this))                                      }
    rangeOff(from, to)  { this._rangeOp(from, to, this._wordAnd.bind(this))                                     }
    rangeFlip(from, to) { this._rangeOp(from, to, this._wordXor.bind(this))                                     }

    slice(fromBitIndex, toBitIndex) {
        fromBitIndex = fromBitIndex || 0;
        toBitIndex   = toBitIndex || this.nbits;
        let bv = new BitVec(toBitIndex - fromBitIndex);
        for (let i = fromBitIndex, j = 0; i < toBitIndex; i++, j++) {
            bv.set(j, this.get(i));
        }
        return bv;
    }

    nextOn(fromBitIndex) {
        if (fromBitIndex >= this.nbits || fromBitIndex < 0)
            return -1;
        let widx = wordIdx(fromBitIndex);
        let word = this.words[widx] & (BITMASK32 << fromBitIndex);
        while (true) {
            if (word != 0)
                return (widx * BITS_PER_WORD) + trailing0s(word);
            if (++widx == this.wordCount)
                return -1;
            word = this.words[widx];
        }
    }

    nextOff(fromBitIndex) {
        if (fromBitIndex >= this.nbits || fromBitIndex < 0)
            return -1;
        let widx = wordIdx(fromBitIndex);
        let word = (~this.words[widx]) & (BITMASK32 << fromBitIndex);
        while (true) {
            if (word != 0) {
                let nextOffIndex = (widx * BITS_PER_WORD) + trailing0s(word);
                return nextOffIndex >= this.nbits ? -1 : nextOffIndex;
            }
            if (++widx == this.wordCount)
                return -1;
            word = ~this.words[widx];
        }
    }

    iterLsb(cb) {
        for (let i = 0; i < this.nbits; i++)
            cb(this.get(i), i);
    }

    iterMsb(cb) {
        for (let i = this.nbits - 1; i >= 0; i--)
            cb(this.get(i), i);
    }

    not() {
        this.rangeFlip(0, this.nbits);
    }

    and(b) {
        if (this == b)
            return;
        for (let k = this.wordCount; k >= b.wordCount; k--)
            this.words[k] = 0;                                  // set the excessive bits to 0 since and'ing with the missing bits is 0.
        for (let k = 0; k < this.wordCount; k++)
            this.words[k] &= b.words[k];                        // and'ing the common prefix bits.
    }

    or(b) {
        if (this == b)
            return;
        let common = Math.min(this.wordCount, b.wordCount);     // get the common prefix word length before increasing any capacity.
        this._ensureCap(b.nbits);
        for (let k = 0; k < common; k++)
            this.words[k] |= b.words[k];                        // or'ing the common prefix bits.
        if (common < this.wordCount) {
            this.words.set(b.words.slice(common), common);      // copy the remaining words
            this._cleanseLast();
        }
    }

    xor(b) {
        if (this == b)
            return;
        let common = Math.min(this.wordCount, b.wordCount);     // get the common prefix word length before increasing any capacity.
        this._ensureCap(b.nbits);
        for (let k = 0; k < common; k++)
            this.words[k] ^= b.words[k];                        // xor'ing the common prefix bits.
        if (common < this.wordCount) {
            this.words.set(b.words.slice(common), common);      // copy the remaining words
            this._cleanseLast();
        }
    }

    // Clears the bits of this bit vector where the corresponding bit is set in the parameter bit vector b.
    andNot(b) {
        // Apply logical (a & !b) on words in common.
        let common = Math.min(this.wordCount, b.wordCount);
        for (let k = common - 1; k >= 0; k--)
            this.words[k] &= ~b.words[k];
    }

    rshift(bitsToShift) {
        bitsToShift = bitsToShift % BITS_PER_WORD;              // limit the shifting to 32 bits.
        const OPENING = BITS_PER_WORD - bitsToShift;            // the bit positions opened up after shifting, to store the previous carry bits.
        const LOWER_MASK = (1 << bitsToShift) - 1;              // mask to get the lower bits of the word, which are carried into the next word.
        let carryBits = 0;                                      // the carry bits shifted off from the previous word.
        for (let k = this.wordCount - 1; k >= 0; k--) {
            let offBits = this.words[k] & LOWER_MASK;           // the shifted off bits after right shift.
            this.words[k]  = this.words[k] >>> bitsToShift;
            this.words[k] |= (carryBits << OPENING);            // put the previous carry bits in the opened bit positions after shifting.
            carryBits = offBits;                                // the shifted off bits are carried to the next word.
        }
        return carryBits;                                       // return any shifted off carry bits.
    }

    lshift(bitsToShift) {
        bitsToShift = bitsToShift % BITS_PER_WORD;              // limit the shifting to 32 bits.
        const OPENING = BITS_PER_WORD - bitsToShift;            // the bit positions opened up after shifting, to store the previous carry bits.
        const UPPER_MASK = ~((1 << bitsToShift) - 1);           // mask to get the upper bits of the word, which are carried into the next word.

        let shiftedOffBits = 0;
        for (let i = this.nbits - 1; i >= this.nbits - bitsToShift; i--) {
            shiftedOffBits = (shiftedOffBits << 1) | this.get(i);
        }

        let carryBits = 0;                                      // the carry bits shifted off from the previous word.
        for (let k = 0; k < this.wordCount; k++) {
            let offBits = this.words[k] & UPPER_MASK;           // the shifted off bits after left shift.
            this.words[k]  = this.words[k] << bitsToShift;
            this.words[k] |= (carryBits >>> OPENING);           // put the previous carry bits in the opened bit positions after shifting.
            carryBits = offBits;                                // the shifted off upper bits are carried to the next word.
        }

        return shiftedOffBits;                                  // return any shifted off carry bits; move upper bits to the lower positions.
    }

    equals(b) {
        if (this == b)
            return true;

        if (this.nbits != b.nbits)
            return false;

        let lastWordIndex = this.wordCount - 1;
        for (let k = 0; k < lastWordIndex; k++) {
            if (this.words[k] != b.words[k])
                return false;
        }
        if (lastWordIndex >= 0) {
            let lastWMask = BITMASK32 >>> -this.nbits;
            if ((this.words[lastWordIndex] & lastWMask) != (b.words[lastWordIndex] & lastWMask))
                return false;
        }

        return true;
    }

    _rangeOp(fromBitIndex, toBitIndex, wordMaskFn) {
        this._bounded2(fromBitIndex);
        this._bounded2(toBitIndex);

        if (fromBitIndex >= toBitIndex)
            return;

        let firstWidx   = wordIdx(fromBitIndex);
        let lastWidx    = wordIdx(toBitIndex - 1);
        let firstWMask  = BITMASK32 << fromBitIndex;        // partial bit mask for the first word.
        let lastWMask   = BITMASK32 >>> -toBitIndex;        // partial bit mask for the last word.
        if (firstWidx == lastWidx) {
            // same word indices, only one word; process with the first and last word masks combined.
            wordMaskFn(firstWidx, firstWMask & lastWMask);
        } else {
            // process the first word of the multiple words, with the first word mask.
            wordMaskFn(firstWidx, firstWMask);

            // process the intermediate words, with a full word mask of all 32 bits.
            for (let widx = firstWidx + 1; widx < lastWidx; widx++) {
                wordMaskFn(widx, BITMASK32);
            }

            // process the last word, with the last word mask.
            wordMaskFn(lastWidx, lastWMask);
        }
    }

    resize(nbits) {
        if (this.nbits == nbits) {
            return;
        } else if (this.nbits < nbits) {
            // Expand to the bigger number of bits.
            let original = this.words;
            this.nbits = nbits;
            this.words = new Uint32Array(wordsOfBits(nbits));
            this.words.set(original, 0);
        } else {
            // Shrink to the smaller number of bits.
            this.nbits = nbits;
            this.words = this.words.slice(0, wordsOfBits(nbits));
            this._cleanseLast();
        }
    }

    toString() {
        return this.asBinary();
    }

    asBinary() {
        let digits = [];
        this.iterMsb( d => digits.push(d) );
        return digits.join("");
    }

    asHex() {
        return [...this.words].map(w => w.toString(16).padStart(8, "0")).reverse().join("");
    }

    static ofBinary(digitsStr) {
        let nbits = digitsStr.length;
        let bvec = new BitVec(nbits);
        for (let i = 0; i < nbits; i++) {
            bvec.set((nbits - i - 1), (digitsStr.charAt(i) == "1"));
        }
        return bvec;
    }

    static ofHex(hexStr) {
        let words = [];
        let end = hexStr.length;
        let begin = end;
        while (begin > 0) {
            begin = end >= 8 ? end - 8 : 0;
            let value = parseInt(hexStr.slice(begin, end), 16);
            if (isNaN(value)) {
                throw Error("Invalid hexadecimal character.");
            }
            words.push(value);
            end -= 8;
        }

        let bvec = new BitVec();
        bvec.nbits = words.length * BITS_PER_WORD;
        bvec.words = Uint32Array.from(words);
        return bvec;
    }

    get wordCount()         { return this.words.length                      }
    _wordBits()             { return this.wordCount * BITS_PER_WORD         }
    _trimMsbs()             { this.rangeOff(this.nbits, this._wordBits())   }
    _wordOr(widx, mask)     { this.words[widx] |= mask                      }
    _wordAnd(widx, mask)    { this.words[widx] &= ~mask                     }
    _wordXor(widx, mask)    { this.words[widx] ^= mask                      }
    _bounded(bitIndex)      { if (bitIndex < 0 || bitIndex >= this.nbits)       throw Error("Bit index is out of bound")    }
    _bounded2(bitIndex)     { if (bitIndex < 0 || bitIndex >  this._wordBits()) throw Error("Bit index is out of bound")    }

    _ensureCap(nbits) {
        if (this.nbits < nbits)
            this.resize(nbits);
    }

    _cleanseLast() {
        let lastWidx    = wordIdx(this.nbits - 1);
        let lastWMask   = BITMASK32 >>> -this.nbits;
        this._wordAnd(lastWidx, ~lastWMask);                    // clear bits beyond the last bit in the last word.
    }        
    
}

