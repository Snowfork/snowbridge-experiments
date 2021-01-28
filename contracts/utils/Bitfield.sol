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
}
