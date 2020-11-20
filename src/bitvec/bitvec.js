/*
  BitVec - A high performance JavaScript bit vector class.
  Copyright (C) 2020 William Wong.  All rights reserved.
  williamw520@gmail.com
*/


/**
  BitVec - A high performance JavaScript bit vector class.
  @module bitvec
  @author William Wong (williamw520@gmail.com)
  @description A high performance JavaScript bit vector class.
*/


//const ENABLE_BOUND_CHECK = true;  // Note: Enabling check causes a branching test that disrupts speculative execution in the CPU.
const ENABLE_BOUND_CHECK = false;   // The slowdown can be from 20% to 300% for some operations.  Run test-benchmark.js for comparison.


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


/**
 * @class
 * @classdesc A high performance JavaScript bit vector class.
 * @memberof module:bitvec
 */
class BitVec {

    /** Initialize the bit vector object with the number of bits.
     *  @param {int} numberOfBits - set the bit vector with the number of bits.
     *  @constructor
     */
    constructor(numberOfBits) {
        this.nbits = numberOfBits || BITS_PER_WORD;     // default to 32 bits.
        this.words = new Uint32Array(wordsOfBits(numberOfBits));
    }

    /** Clone a new bit vector object.
     *  @return {BitVec}
     */
    clone() {
        let b = new BitVec(this.nbits);
        b.words = this.words.slice();
        return b;
    }

    /** Turn the bit on at the bit index.  
     *  @param {int} bitIndex - bit index to set the bit. */
    bitOn(bitIndex)     { this._bounded(bitIndex);  this._wordOr( wordIdx(bitIndex), 1 << bitIndex)             }
    
    /** Turn the bit off at the bit index.  
     *  @param {int} bitIndex - bit index to clear the bit. */
    bitOff(bitIndex)    { this._bounded(bitIndex);  this._wordAnd(wordIdx(bitIndex), 1 << bitIndex)             }
    
    /** Flip the bit from on to off, or from off to on, at the bit index.  
     * @param {int} bitIndex - bit index to flip the bit. */
    flip(bitIndex)      { this._bounded(bitIndex);  this._wordXor(wordIdx(bitIndex), 1 << bitIndex)             }

    /** Set the bit at the bit index to the value.
     *  @param {int} bitIndex - bit index to set the bit value.
     *  @param {boolean} val - the boolean value to set; 1 or 0 is acceptable, too. */
    set(bitIndex, val)  { this._bounded(bitIndex);  val ? this.bitOn(bitIndex) : this.bitOff(bitIndex)          }

    /** Get the bit value at the bit index.
     *  @param {int} bitIndex - bit index to get the bit value.
     *  @return {int} 1 for on, 0 for off. */
    get(bitIndex)       { this._bounded(bitIndex);  return (this.words[ wordIdx(bitIndex) ] >>> bitIndex) & 1   }
    
    /** Check whether the bit is on at the bit index.
     *  @param {int} bitIndex - bit index to check.
     *  @return {boolean} true for the bit is on; false for the bit is off. */
    isOn(bitIndex)      { this._bounded(bitIndex);  return this.get(bitIndex) == 1                              }
    
    /** Check whether the bit is off at the bit index.
     *  @param {int} bitIndex - bit index to check.
     *  @return {boolean} true for the bit is off; false for the bit is on. */
    isOff(bitIndex)     { this._bounded(bitIndex);  return this.get(bitIndex) == 0                              }
    
    /** Check whether all the bits in the vector are on.
     *  @return {boolean} true for all the bits are on; false for not all the bits are on. */
    isAllOn()           { return this.rangeIsOn(0, this.nbits)                                                  }
    
    /** Check whether all the bits in the vector are off.
     *  @return {boolean} true for all the bits are off; false for not all the bits are off. */
    isAllOff()          { return this.rangeIsOff(0, this.nbits)                                                 }
    
    /** Get the number of bits that are on.
     *  @return {int} the number of ON bits */
    cardinality()       { return this.words.reduce( (sum, w) => (sum += bitCount(w), sum), 0 )                  }

    /** Clear all the bits to off in the vector. */
    clear()             { this.words.forEach( (_, i) => this.words[i] = 0 )                                     }
    
    /** Set all the bits to on in the vector. */
    setAll()            { this.words.forEach( (_, i) => this.words[i] = BITMASK32 ); this._trimMsbs();          }

    /** Fill the bit vector with randomly ON or OFF bits.
     *  @param {function} rng - optional random number generator, default to Math.random if none is provided. */
    randomize(rng)      { this.words.forEach( (_, i) => this.words[i] = rand32(rng) );  this._trimMsbs();       }

    /** Turn the range of bits to on.
     *  @param {int} from - the bit index of the beginning of the bit range.
     *  @param {int} to - the bit index of the end of the bit range (not inclusive). */
    rangeOn(from, to)   { this._rangeOp(from, to, this._wordOr.bind(this))                                      }

    /** Turn the range of bits to off.
     *  @param {int} from - the bit index of the beginning of the bit range.
     *  @param {int} to - the bit index of the end of the bit range (not inclusive). */
    rangeOff(from, to)  { this._rangeOp(from, to, this._wordAnd.bind(this))                                     }
    
    /** Flip the range of bits.
     *  @param {int} from - the bit index of the beginning of the bit range.
     *  @param {int} to - the bit index of the end of the bit range (not inclusive). */
    rangeFlip(from, to) { this._rangeOp(from, to, this._wordXor.bind(this))                                     }
    
    /** Check whether the range of bits are all on.
     *  @param {int} from - the bit index of the beginning of the bit range.
     *  @param {int} to - the bit index of the end of the bit range (not inclusive).
     *  @return {boolean} true for all the bits are on; false for not all the bits are on. */
    rangeIsOn(from, to) {
        let flag = true;
        this._rangeOp(from, to, (widx, mask) => { flag = flag && this._wordOn(widx, mask) });
        return flag && (from < to);
    }
    
    /** Check whether the range of bits are all off.
     *  @param {int} from - the bit index of the beginning of the bit range.
     *  @param {int} to - the bit index of the end of the bit range (not inclusive).
     *  @return {boolean} true for all the bits are off; false for not all the bits are off. */
    rangeIsOff(from,to) {
        let flag = true;
        this._rangeOp(from, to, (i, m) => flag = flag && this._wordOff(i, m));
        return flag && (from < to);
    }
    
    /** Take a slice of the bit vector and returns it as a new BitVec.
     *  @param {int} from - the bit index of the beginning of the bit slice.
     *  @param {int} to - the bit index of the end of the bit slice (not inclusive).
     *  @return {BitVec} the new BitVec object containing the bit slice. */
    slice(fromBitIndex, toBitIndex) {
        fromBitIndex = fromBitIndex || 0;
        toBitIndex   = toBitIndex || this.nbits;
        let bv = new BitVec(toBitIndex - fromBitIndex);
        for (let i = fromBitIndex, j = 0; i < toBitIndex; i++, j++) {
            bv.set(j, this.get(i));
        }
        return bv;
    }

    /** Search for the next ON bit, starting from the given bit index.
     *  @param {int} fromBitIndex - the starting bit index for the next ON bit (inclusive).
     *  @return {int} the bit index of the found ON bit, -1 if not found.
     */
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

    /** Search for the next OFF bit, starting from the given bit index.
     *  @param {int} fromBitIndex - the starting bit index for the next OFF bit (inclusive).
     *  @return {int} the bit index of the found OFF bit, -1 if not found.
     */
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

    /** Iterate bits in the vector starting from the least signifcant bit.
     *  @param {function} cb - the iterating function for each bit. */
    iterLsb(cb) {
        for (let i = 0; i < this.nbits; i++)
            cb(this.get(i), i);
    }

    /** Iterate bits in the vector starting from the most signifcant bit.
     *  @param {function} cb - the iterating function for each bit. */
    iterMsb(cb) {
        for (let i = this.nbits - 1; i >= 0; i--)
            cb(this.get(i), i);
    }

    /** Flip all the bits in the vector. */
    not() {
        this.rangeFlip(0, this.nbits);
    }

    /** Apply a bitwise AND operation on the bit vector with the incoming vector.
     *  The two vectors don't have to have the same number of bits.
     *  The extra bits will become 0, as a result of the AND operation.
     *  @param {BitSet} b the incoming bit vector for the operation. */
    and(b) {
        if (this == b)
            return;
        for (let k = this.wordCount; k >= b.wordCount; k--)
            this.words[k] = 0;                                  // set the excessive bits to 0 since and'ing with the missing bits is 0.
        for (let k = 0; k < this.wordCount; k++)
            this.words[k] &= b.words[k];                        // and'ing the common prefix bits.
    }

    /** Apply a bitwise OR operation on the bit vector with the incoming vector.
     *  The two vectors don't have to have the same number of bits.
     *  The extra bits will become 1, as a result of the OR operation.
     *  The size of the vector will be expanded if the incoming vector has a larger size.
     *  @param {BitSet} b the incoming bit vector for the operation. */
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

    /** Apply a bitwise XOR operation on the bit vector with the incoming vector.
     *  The two vectors don't have to have the same number of bits.
     *  The extra bits will be copied from the incoming vector, as a result of the XOR operation.
     *  The size of the vector will be expanded if the incoming vector has a larger size.
     *  @param {BitSet} b the incoming bit vector for the operation. */
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

    /** Apply a logical (a AND NOT(b)) on the bits in common.
     *  This effectively clears the bits of the vector where the corresponding bits are set in the incoming bit vector.
     *  @param {BitSet} b the incoming bit vector for the operation. */
    andNot(b) {
        let common = Math.min(this.wordCount, b.wordCount);
        for (let k = common - 1; k >= 0; k--)
            this.words[k] &= ~b.words[k];
    }

    /** Perform a left shift on the bit vector.
     *  @param {int} bitsToShift the number of bits to shift, limited to 32 bits.
     *  @return {int} the shifted off carry bits */
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

    /** Perform a right shift on the bit vector.
     *  @param {int} bitsToShift the number of bits to shift, limited to 32 bits.
     *  @return {int} the shifted off carry bits */
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

    /** Compare the bit vector with another bit vector to see if they are equal.
     *  @param {BitVec} b the other bit vector to be compared.
     *  @return {boolean} true if equal, false if not. */
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
        let firstWMask  = BITMASK32 << fromBitIndex;        // partial bit mask for the first word from LSB.
        let lastWMask   = BITMASK32 >>> -toBitIndex;        // partial bit mask for the last word to the MSB.
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

    /** Resize the bit vector, to either expand or shrink the vector.
     *  @param {int} nbits the number of bits as the new size. */
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

    /** Return the number of bits in the vector.
     *  @return {int} the number of bits */
    get size()              { return this.nbits                                         }

    /** Return the number of words in the vector.
     *  @return {int} */
    get wordCount()         { return this.words.length                                  }
    
    /** Return a string of digits 0 and 1 representing the bit vector.
     *  @return {string} the binary string */
    toString() {
        return this.asBinary();
    }

    /** Return a string of digits 0 and 1 representing the bit vector.
     *  @return {string} the binary string */
    asBinary() {
        let digits = [];
        this.iterMsb( d => digits.push(d) );
        return digits.join("");
    }

    /** Return a hexadecimal string representing the bit vector.
     *  @return {string} the binary string */
    asHex() {
        return [...this.words].map(w => w.toString(16).padStart(8, "0")).reverse().join("");
    }

    /** Create a BitVec object from the binary digit 0 and 1 string.
     *  @return {BitVec} the created object */
    static ofBinary(digitsStr) {
        let nbits = digitsStr.length;
        let bvec = new BitVec(nbits);
        for (let i = 0; i < nbits; i++) {
            bvec.set((nbits - i - 1), (digitsStr.charAt(i) == "1"));
        }
        return bvec;
    }

    /** Create a BitVec object from the hexadecimal string.
     *  @return {BitVec} the created object */
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

    _wordBits()             { return this.wordCount * BITS_PER_WORD                     }
    _trimMsbs()             { this.rangeOff(this.nbits, this._wordBits())               }
    _wordOr(widx, mask)     { this.words[widx] |= mask                                  }
    _wordAnd(widx, mask)    { this.words[widx] &= ~mask                                 }
    _wordXor(widx, mask)    { this.words[widx] ^= mask                                  }
    _wordOn(widx, mask)     { return (this.words[widx] & mask) == (BITMASK32 & mask)    }   // AND BITMASK32 to mask to handle negative number after AND
    _wordOff(widx, mask)    { return (this.words[widx] & mask) == 0                     }
    _bounded(bitIndex)      { if (ENABLE_BOUND_CHECK && (bitIndex < 0 || bitIndex >= this.nbits))       throw Error("Bit index is out of bound")    }
    _bounded2(bitIndex)     { if (ENABLE_BOUND_CHECK && (bitIndex < 0 || bitIndex >  this._wordBits())) throw Error("Bit index is out of bound")    }

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

export {
    BitVec,
    ENABLE_BOUND_CHECK,
};

