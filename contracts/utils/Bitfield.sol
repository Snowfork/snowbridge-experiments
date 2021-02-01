// "SPDX-License-Identifier: Apache-2.0"
pragma solidity ^0.7.0;

import "./Bits.sol";

contract Bitfield {
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
