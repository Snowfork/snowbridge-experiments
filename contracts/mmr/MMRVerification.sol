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

    /**
     * @dev It returns true when the given params verifies that the given value exists in the MMR.
     */
    function inclusionProof(
        bytes32 root,
        uint256 width,
        uint256 index,
        bytes32 value,
        bytes32[] memory peaks,
        bytes32[] memory siblings
    )
        public pure returns (bool) {
        uint256 size = getSize(width);
        require(size >= index, "Index is out of range");

        // Check the root equals the peak bagging hash
        if(root != combineBaggedPeaks(peaks)) {
            return false;
        }

        // Find the mountain where the target index belongs to
        uint256 cursor;
        bytes32 targetPeak;
        uint256[] memory peakIndexes = getPeakIndexes(width);
        for (uint256 i = 0; i < peakIndexes.length; i++) {
            if (peakIndexes[i] >= index) {
                targetPeak = peaks[i];
                cursor = peakIndexes[i];
                break;
            }
        }

        // Check target peak found
        if(targetPeak == bytes32(0)) {
            return false;
        }

        // Find the path climbing down
        uint256[] memory path = new uint256[](siblings.length + 1);
        uint256 left;
        uint256 right;
        uint8 height = uint8(siblings.length) + 1;
        while (height > 0) {
            // Record the current cursor and climb down
            path[--height] = cursor;
            if (cursor == index) {
                // On the leaf node. Stop climbing down
                break;
            } else {
                // On the parent node. Go left or right
                (left, right) = getChildren(cursor);
                cursor = index > left ? right : left;
                continue;
            }
        }

        // // Calculate the summit hash climbing up again
        bytes32 node;
        while (height < path.length) {
            // Move cursor
            cursor = path[height];
            if (height == 0) {
                // cursor is on the leaf
                node = value;
            } else if (cursor - 1 == path[height - 1]) {
                // cursor is on a parent and a sibling is on the left
                node = hashParent(siblings[height - 1], node);
            } else {
                // cursor is on a parent and a sibling is on the right
                node = hashParent(node, siblings[height - 1]);
            }
            // Climb up
            height++;
        }

        // Computed hash value of the summit should equal to the target peak hash
        if(node != targetPeak) {
            return false;
        }
        return true;
    }

  // TODO: Fix so it works with for variable input array lengths
    function combineBaggedPeaks(bytes32[] memory peakBagging)
        public
        pure
        returns (bytes32 root)
    {
        bytes32 temp;
        for (uint256 i = peakBagging.length - 1; i > 0; i--) {
            if (i == peakBagging.length - 1) {
                temp = keccak256(
                    abi.encodePacked(peakBagging[i], peakBagging[i - 1])
                );
            } else {
                temp = keccak256(abi.encodePacked(temp, peakBagging[i - 1]));
            }
        }
        root = temp;
    }

    function getSize(uint256 width) public pure returns (uint256) {
        return (width << 1) - numOfPeaks(width);
    }

    /**
     * @dev It returns the hash a parent node with hash(Left child | Right child)
     *      M is the index of the node
     */

    function hashParent(bytes32 left, bytes32 right)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(left, right));
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
     * @dev It returns the children when it is a parent node
     */
    function getChildren(uint256 index)
        public
        pure
        returns (uint256 left, uint256 right)
    {
        left = index - (uint256(1) << (heightAt(index) - 1));
        right = index - 1;
        require(left != right, "Not a parent");
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
