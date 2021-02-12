// "SPDX-License-Identifier: Apache-2.0"
pragma solidity ^0.7.0;

import "./Bits.sol";

contract Bitfield {
    uint256 internal constant M1 = 0x5555555555555555555555555555555555555555555555555555555555555555;
    uint256 internal constant M2 = 0x3333333333333333333333333333333333333333333333333333333333333333;
    uint256 internal constant M4  = 0x0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f;
    uint256 internal constant M8  = 0x00ff00ff00ff00ff00ff00ff00ff00ff00ff00ff00ff00ff00ff00ff00ff00ff;
    uint256 internal constant M16 = 0x0000ffff0000ffff0000ffff0000ffff0000ffff0000ffff0000ffff0000ffff;
    uint256 internal constant M32 = 0x00000000ffffffff00000000ffffffff00000000ffffffff00000000ffffffff;
    uint256 internal constant M64 = 0x0000000000000000ffffffffffffffff0000000000000000ffffffffffffffff;
    uint256 internal constant M128 = 0x00000000000000000000000000000000ffffffffffffffffffffffffffffffff;
    uint256 internal constant H01 = 0x0101010101010101010101010101010101010101010101010101010101010101;

    uint256 internal constant ONE = uint256(1);
    using Bits for uint256;

    function randomNBits(uint256 seed, uint length, uint n)
        public
        pure
        returns (uint256[] memory bitfield)
    {
        require(n <= length, "`length` of bitfield must be <= `n` randomly set bits");

        uint found = 0;

        uint256 words = length / 256;
        if (length % 256 > 0) {
            words++;
        }
        bitfield = new uint256[](words);

        for (uint i = 0; found < n; i++) {
            bytes32 randomness = keccak256(abi.encode(seed + i));
            uint256 index = uint256(randomness) % length;

            if (isSet(bitfield, index)) {
                // bit already set, try again
                continue;
            }

            set(bitfield, index);

            found++;
        }

        return bitfield;
    }

    /**
     * Counts the number of set bits in the `prior`, then draws a random number lower than that count, finds the
     * corresponding index, and sets it to true. Repeats that `n` times.
     */
    function randomNBitsFromPriorCounting(uint256 seed, uint256[] memory prior, uint n)
        public
        pure
        returns (uint256[] memory bitfield)
    {
        uint256 priorBits = countSetBits(prior);
        require(n <= priorBits, "`n` must be <= number of set bits in `prior`");

        // track which numbers are still available
        uint256[] memory available = new uint256[](prior.length);
        available = prior;

        bitfield = new uint256[](prior.length);

        for (uint i = 0; i < n; i++) {
            bytes32 randomness = keccak256(abi.encode(seed + i));
            uint256 num = (uint256(randomness) % (priorBits - i)) + 1;

            uint256 index = indexOfNthSetBit(available, num);

            clear(available, index);
            set(bitfield, index);
        }

        return bitfield;
    }

    /**
     * Draws a random number, derives an index in the bitfield, and sets the bit if it is in the `prior` and not yet
     * set. Repeats that `n` times.
     */
    function randomNBitsFromPriorRejectionSampling(uint256 seed, uint256[] memory prior, uint n)
        public
        pure
        returns (uint256[] memory bitfield)
    {
        require(n <= countSetBits(prior), "`n` must be <= number of set bits in `prior`");

        bitfield = new uint256[](prior.length);
        uint found = 0;
        uint256 length = prior.length * 256;

        for (uint i = 0; found < n; i++) {
            bytes32 randomness = keccak256(abi.encode(seed + i));
            uint256 index = uint256(randomness) % length;

            // require randomly seclected bit to be set in prior
            if (!isSet(prior, index)) {
                continue;
            }

            // require a not yet sit (new) bit to be set
            if (isSet(bitfield, index)) {
                continue;
            }

            set(bitfield, index);

            found++;
        }

        return bitfield;
    }

    /**
     * Notice that `n` here is starting at `1`, meaning that in a bitfield 0100 the `n = 1` index would be `2` (starting
     * from right)
     */
    function indexOfNthSetBit(uint256[] memory self, uint n) public pure returns (uint256) {
        uint256 index = 0;
        for (uint i = 0; i < self.length; i++) {
            for (uint j = 0; j < 256; j++) {
                if (self[i].bitSet(uint8(j))) {
                    n--;
                }

                if (n == 0) {
                    return index;
                }

                index++;
            }
        }
        revert("index not found, make sure enough bits are set");
    }

    function countSetBits(uint256[] memory self) public pure returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < self.length; i++) {
            for (uint j = 0; j < 256; j++) {
                if (self[i].bitSet(uint8(j))) {
                    count++;
                }
            }
        }
        return count;
    }

    function countSetShift(uint256[] memory self) public pure returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < self.length; i++) {
            while (self[i] != 0) {
                if (self[i] & 1 == 1) {
                    count++;
                }
                self[i] >>= 1;
            }
        }
        return count;
    }

    function countSetBitsKernighan(uint256[] memory self) public pure returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < self.length; i++) {
            while (self[i] != 0) {
                self[i] = self[i] & (self[i] - 1);
                count++;
            }
        }
        return count;
    }

    function countSetBitsHammingWeight(uint256[] memory self) public pure returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < self.length; i++) {
            uint256 x = self[i];


            x = (x & M1 ) + ((x >>  1) & M1 ); //put count of each  2 bits into those  2 bits
            x = (x & M2 ) + ((x >>  2) & M2 ); //put count of each  4 bits into those  4 bits
            x = (x & M4 ) + ((x >>  4) & M4 ); //put count of each  8 bits into those  8 bits
            x = (x & M8 ) + ((x >>  8) & M8 ); //put count of each 16 bits into those 16 bits
            x = (x & M16) + ((x >> 16) & M16); //put count of each 32 bits into those 32 bits
            x = (x & M32) + ((x >> 32) & M32); //put count of each 64 bits into those 64 bits
            x = (x & M64) + ((x >> 64) & M64); //put count of each 128 bits into those 128 bits
            x = (x & M128) + ((x >> 128) & M128); //put count of each 256 bits into those 256 bits
            count += x;

            // TODO improve efficiency by applying simplifications from https://en.wikipedia.org/wiki/Hamming_weight
            // x -= (x >> 1) & M1;             //put count of each 2 bits into those 2 bits
            // x = (x & M2) + ((x >> 2) & M2); //put count of each 4 bits into those 4 bits
            // x = (x + (x >> 4)) & M4;        //put count of each 8 bits into those 8 bits
            // x = (x + (x >> 8)) & M8;        //put count of each 16 bits into those 16 bits
            // x = (x + (x >> 16)) & M16;        //put count of each 32 bits into those 32 bits
            // count += (x * H01) >> 224;  //returns left 8 bits of x + (x<<32) + (x<<64) + (x<<96) + ...
        }
        return count;
    }

    function isSet(uint256[] memory self, uint256 index) internal pure returns (bool) {
        uint256 element = index / 256;
        uint8 within = uint8(index % 256);
        return self[element].bit(within) == 1;
    }

    function set(uint256[] memory self, uint256 index) internal pure {
        uint256 element = index / 256;
        uint8 within = uint8(index % 256);
        self[element] = self[element].setBit(within);
    }

    function clear(uint256[] memory self, uint256 index) internal pure {
        uint256 element = index / 256;
        uint8 within = uint8(index % 256);
        self[element] = self[element].clearBit(within);
    }
}
