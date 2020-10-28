// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.7.0;

contract Verification {

    uint256 stateVariable = 1;

    // This function just updates a storage variable.
    // It is used as a control group to establish transaction gas costs.
    function justUpdate() public {
        stateVariable = stateVariable + 1;
    }

    // Data Structure for Set: Array of messages
    // Commitment: Hash of above array
    // Process for verifying all messages in the set: Take all messages in the array, hash the entire array and confirm it matches the commitment.
    // Process for verifying just a single message in the set: Take all messages in the array, hash the entire array and confirm it matches the commitment.
    function verifyDataA(bytes32[] memory _data, bytes32 _commitment)
        public
        returns (bool)
    {
        // Without this state update the function is gasless
        stateVariable = stateVariable + 1;

        bytes32 commitment = "";
        for(uint i = 0; i < _data.length; i++) {
            commitment = keccak256(abi.encodePacked(commitment, _data[i]));
        }

        return _commitment == _commitment;
    }

    // Data Structure for Set: Merkle Tree with each leaf as a message
    // Commitment: Hash of the root of the merkle tree
    // Process for verifying all messages in the set: Take all messages, store them as leaves, build up the entire merkle tree, repeatedly hashing from all leaves to the root.
    // Process for verifying just a single message in the set: Take a single message as a leaf, and take in hashes of subtrees separate from that leaf and build up just that leaf's branch of the merkle tree, repeatedly hashing from just that leaf to the root.

    struct Tree {
        bytes32 root;
        uint256 numbLeaves;
    }

    Tree tree;
    mapping(uint256 => bytes32) public leaves;
    mapping(bytes32 => bytes32) public leafProof;

    constructor() {
        tree = Tree("", 0);
    }

    function verifyDataB(bytes32[] memory _data, bytes32 _commitment)
        public
        returns (bool)
    {

        for(uint i = 0; i < _data.length; i++) {
            // Insert the leaf's data into the tree
            tree.numbLeaves = tree.numbLeaves + 1;
            leaves[tree.numbLeaves] = _data[i];

            // Hash the leaf with the current root to get the new root
            bytes32 rootHash = keccak256(abi.encodePacked(tree.root, _data[i]));
            // Set the root and save it as the leaf's local merkle proof
            leafProof[_data[i]] = rootHash;
            tree.root = rootHash;
        }

        return tree.root == _commitment;
    }

    // /**
    //  * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
    //  * defined by `root`. For this, a `proof` must be provided, containing
    //  * sibling hashes on the branch from the leaf to the root of the tree. Each
    //  * pair of leaves and each pair of pre-images are assumed to be sorted.
    //  */
    // function verifyLeafB(bytes32[] memory proof, bytes32 root, bytes32 leaf)
    //     public
    //     pure
    //     returns (bool)
    // {
    //     bytes32 computedHash = leaf;

    //     for (uint256 i = 0; i < proof.length; i++) {
    //         bytes32 proofElement = proof[i];

    //         if (computedHash <= proofElement) {
    //             // Hash(current computed hash + current element of the proof)
    //             computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
    //         } else {
    //             // Hash(current element of the proof + current computed hash)
    //             computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
    //         }
    //     }

    //     // Check if the computed hash (root) is equal to the provided root
    //     return computedHash == root;
    // }

}
