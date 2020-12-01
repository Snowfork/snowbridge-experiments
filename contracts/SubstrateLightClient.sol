// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.7.0;

abstract contract SubstrateLightClient {

    struct Tree {
        bytes32 root;
        uint256 size;
        uint256 width;
        mapping(uint256 => bytes32) hashes;
        mapping(bytes32 => bytes) data;
    }

    // Store the hashed value of the leaf
    function append(bytes32 root, bytes memory data) virtual public;

    // Get the Merkle proof for a leaf
    function getMerkleProof(bytes32 root, uint256 index) virtual public view returns
        (uint256 size, bytes32[] memory peakSet, bytes32[] memory siblings);

    // Returns true if the given value exists in the tree
    function inclusionProof(bytes32 root, uint256 size, uint256 index, bytes memory value,
        bytes32[] memory peakSet, bytes32[] memory siblings) virtual public pure returns (bool);

    // Returns the hash a parent node with hash(M | Left child | Right child) where M is the index of the node
    function hashParent(uint256 index, bytes32 left, bytes32 right) virtual public pure returns (bytes32);

    // Get the height of the highest peak
    function mountainHeight(uint256 size) virtual public pure returns (uint8);

    // Return the index is the leaf node or not
    function isLeaf(uint256 index) virtual public pure returns (bool);

    // Returns all peaks of the smallest merkle mountain range tree which includes the given index
    function getPeaks(uint256 size) virtual public pure returns (uint256[] memory peaks);
}
