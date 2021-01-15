// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.7.0;

/**
 *
 * @dev MMRVerification library for MMR inclusion proofs generated
 *      by https://github.com/nervosnetwork/merkle-mountain-range.
 *
 *      The index of this MMR implementation starts from 1 not 0.
 */
library MMRVerification {

    function verifyInclusionProof(
        bytes32 root,
        bytes32 leafNodeHash,
        uint256 leafIndex,
        uint256 leafCount,
        bytes32[] memory proofItems
    )
        public pure returns (bool)
    {
        uint256 width = leafCount;
        uint256 leafPos = leafIndexToPos(leafIndex);
        if(!isLeaf(leafPos)) {
            return false;
        }

        // Calculate the index of our leaf's mountain peak
        uint256 targetPeakIndex;
        uint256 numLeftPeaks;
        uint256[] memory peakIndexes = getPeakIndexes(width);
        for (uint256 i = 0; i < peakIndexes.length; i++) {
            if (peakIndexes[i] >= leafPos) {
                targetPeakIndex = peakIndexes[i];
                break;
            }
            numLeftPeaks = numLeftPeaks + 1;
        }

        // Calculate our leaf's mountain peak hash by hashing siblings in order
        bytes32 mountainHash = leafNodeHash;
        uint256 firstSibIndex = numLeftPeaks;
        uint256 lastSibIndex = proofItems.length-1;
        for(uint i = firstSibIndex; i < lastSibIndex; i++ ) {
            mountainHash = keccak256(abi.encodePacked(proofItems[i], mountainHash));
        }

        // Bag the right peaks (they're already rolled up into one hash)
        bytes32 bagger = keccak256(abi.encodePacked(proofItems[proofItems.length-1], mountainHash));

        // Bag left peaks one-by-one
        for(uint i = firstSibIndex; i > 0; i--) {
            bagger = keccak256(abi.encodePacked(bagger, proofItems[i-1]));
        }

        return bagger == root;
    }

    function getSize(uint256 width) public pure returns (uint256) {
        return (width << 1) - numOfPeaks(width);
    }

    // Counts the number of 1s in the binary representation of an integer
    function bitCount(uint256 n) public pure returns(uint256)
    {
        uint256 count;
        while(n > 0) {
            count = count + 1;
            n = n & (n-1);
        }
        return count;
    }

   function leafIndexToPos(uint256 index) public pure returns(uint256) {
        return leafIndexToMmrSize(index) - trailingZeros(index+1);
    }

    function leafIndexToMmrSize(uint256 index) public pure returns(uint256) {
        uint256 leavesCount = index + 1;
        uint256 peaksCount = bitCount(leavesCount);
        return (2 * leavesCount) - peaksCount;
    }

    // Counts the number of 1s in the binary representation of an integer
    function trailingZeros(uint256 x) public pure returns(uint256)
    {
       if (x == 0) return(32);
       uint256 n = 1;
       if ((x & 0x0000FFFF) == 0) {n = n +16; x = x >>16;}
       if ((x & 0x000000FF) == 0) {n = n + 8; x = x >> 8;}
       if ((x & 0x0000000F) == 0) {n = n + 4; x = x >> 4;}
       if ((x & 0x00000003) == 0) {n = n + 2; x = x >> 2;}
       return n - (x & 1);
    }

    /**
     * @dev It returns the height of the highest peak
     */
    function mountainHeight(uint256 size) public pure returns (uint8) {
        uint8 height = 1;
        while (uint256(1) << height <= size + height) {
            height++;
        }
        return height - 1;
    }

    /**
     * @dev It returns the height of the index
     */
    function heightAt(uint256 index) public pure returns (uint8 height) {
        uint256 reducedIndex = index;
        uint256 peakIndex;
        // If an index has a left mountain subtract the mountain
        while (reducedIndex > peakIndex) {
            reducedIndex -= (uint256(1) << height) - 1;
            height = mountainHeight(reducedIndex);
            peakIndex = (uint256(1) << height) - 1;
        }
        // Index is on the right slope
        height = height - uint8((peakIndex - reducedIndex));
    }

    /**
     * @dev It returns whether the index is the leaf node or not
     */
    function isLeaf(uint256 index) public pure returns (bool) {
        return heightAt(index) == 1;
    }

    /**
     * @dev It returns all peaks of the smallest merkle mountain range tree which includes
     *      the given index(size)
     */
    function getPeakIndexes(uint256 width)
        public
        pure
        returns (uint256[] memory peakIndexes)
    {
        peakIndexes = new uint256[](numOfPeaks(width));
        uint256 count;
        uint256 size;
        for (uint256 i = 255; i > 0; i--) {
            if (width & (1 << (i - 1)) != 0) {
                // peak exists
                size = size + (1 << i) - 1;
                peakIndexes[count++] = size;
            }
        }
        require(count == peakIndexes.length, "Invalid bit calculation");
    }

    function numOfPeaks(uint256 width) public pure returns (uint256 num) {
        uint256 bits = width;
        while (bits > 0) {
            if (bits % 2 == 1) num++;
            bits = bits >> 1;
        }
        return num;
    }

}
