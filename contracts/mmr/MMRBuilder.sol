// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

/**
 *
 * @dev Builds an MMR and generates inclusion proofs according to the
 *      verification requirements of MMRVerification.sol.
 */
library MMRBuilder {
    struct Tree {
        bytes32 root;
        uint256 size;
        uint256 width;
        mapping(uint256 => bytes32) hashes;
        mapping(bytes32 => bytes) data;
    }

    /**
     * @dev This only stores the hashed value of the leaf.
     *      If you need to retrieve the detail data later, use a map to store them.
     */
    function append(Tree storage tree, bytes32 leaf) public {
        // Put the hashed leaf to the map
        tree.hashes[tree.size + 1] = leaf;
        tree.width += 1;
        // Find peaks for the enlarged tree
        uint256[] memory peakIndexes = getPeakIndexes(tree.width);
        // The right most peak's value is the new size of the updated tree
        tree.size = getSize(tree.width);
        // Starting from the left-most peak, get all peak hashes using _getOrCreateNode() function.
        bytes32[] memory peaks = new bytes32[](peakIndexes.length);

        for (uint256 i = 0; i < peakIndexes.length; i++) {
            peaks[i] = _getOrCreateNode(tree, peakIndexes[i]);
        }
    }

    function getPeaks(Tree storage tree)
        public
        view
        returns (bytes32[] memory peaks)
    {
        // Find peaks for the enlarged tree
        uint256[] memory peakNodeIndexes = getPeakIndexes(tree.width);
        // Starting from the left-most peak, get all peak hashes using _getOrCreateNode() function.
        peaks = new bytes32[](peakNodeIndexes.length);
        for (uint256 i = 0; i < peakNodeIndexes.length; i++) {
            peaks[i] = tree.hashes[peakNodeIndexes[i]];
        }
        return peaks;
    }

    function getLeafIndex(uint256 width) public pure returns (uint256) {
        if (width % 2 == 1) {
            return getSize(width);
        } else {
            return getSize(width - 1) + 1;
        }
    }

    function getSize(uint256 width) public pure returns (uint256) {
        return (width << 1) - numOfPeaks(width);
    }

    /**
     * @dev It returns the size of the tree
     */
    function getSize(Tree storage tree) public view returns (uint256) {
        return tree.size;
    }

    /**
     * @dev It returns the width of the tree
     */
    function getWidth(Tree storage tree) public view returns (uint256) {
        return tree.width;
    }

    /**
     * @dev It returns the hash value of a node for the given position. Note that the index starts from 1
     */
    function getNode(Tree storage tree, uint256 index)
        public
        view
        returns (bytes32)
    {
        return tree.hashes[index];
    }

    /**
     * @dev It returns the hash value of a node for the given position. Note that the index starts from 1
     */
    function getHashes(Tree storage tree)
        public
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory hashes;
        for (uint256 i = 0; i < tree.size; i++) {
            hashes[i] = tree.hashes[i];
        }
        return hashes;
    }

    /**
     * @dev It returns a merkle proof for a leaf. Note that the index starts from 1
     */
    function getMerkleProof(Tree storage tree, uint256 index)
        public
        view
        returns (
            bytes32 root,
            uint256 width,
            bytes32[] memory peakBagging,
            bytes32[] memory siblings
        )
    {
        require(index < tree.size, "Out of range");
        require(isLeaf(index), "Not a leaf");

        width = tree.width;
        // Find all peaks for bagging
        uint256[] memory peaks = getPeakIndexes(tree.width);

        peakBagging = new bytes32[](peaks.length);
        uint256 cursor;

        for (uint256 i = 0; i < peaks.length; i++) {
            // Collect the hash of all peaks
            peakBagging[i] = tree.hashes[peaks[i]];
            // Find the peak which includes the target index
            if (peaks[i] >= index && cursor == 0) {
                cursor = peaks[i];
            }
        }

        root = combineBaggedPeaks(peakBagging);

        uint256 left;
        uint256 right;

        // Get hashes of the siblings in the mountain which the index belongs to.
        // It moves the cursor from the summit of the mountain down to the target index
        uint8 height = heightAt(cursor);
        siblings = new bytes32[](height - 1);
        while (cursor != index) {
            height--;
            (left, right) = getChildren(cursor);
            // Move the cursor down to the left side or right side
            cursor = index <= left ? left : right;
            // Remaining node is the sibling
            siblings[height - 1] = tree.hashes[index <= left ? right : left];
        }
    }

    // TODO: Fix so it works with for variable lengths
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

    /**
     * @dev It returns the hash value of the node for the index.
     *      If the hash already exists it simply returns the stored value. On the other hand,
     *      it computes hashes recursively downward.
     *      Only appending an item calls this function
     */
    function _getOrCreateNode(Tree storage tree, uint256 index)
        private
        returns (bytes32)
    {
        require(index <= tree.size, "Out of range");
        if (tree.hashes[index] == bytes32(0)) {
            (uint256 leftIndex, uint256 rightIndex) = getChildren(index);
            bytes32 leftHash = _getOrCreateNode(tree, leftIndex);
            bytes32 rightHash = _getOrCreateNode(tree, rightIndex);
            tree.hashes[index] = hashParent(leftHash, rightHash);
        }
        return tree.hashes[index];
    }
}
