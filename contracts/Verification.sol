// "SPDX-License-Identifier: Apache-2.0"
pragma solidity ^0.7.0;

import "hardhat/console.sol";

/**
 * @title Verifies various hashed data structures
 */
contract Verification {
    /**
     * @notice Verify a flat array of data elements
     *
     * @param _data the array of data elements to be verified
     * @param _commitment the commitment hash to check
     * @return a boolean value representing the success or failure of the operation
     */
    function verifyMessageArray(bytes32[] calldata _data, bytes32 _commitment) public pure returns (bool) {
        bytes32 commitment = _data[0];
        for (uint256 i = 1; i < _data.length; i++) {
            commitment = keccak256(abi.encodePacked(commitment, _data[i]));
        }

        return commitment == _commitment;
    }

    /**
     * @notice Verify all elements in a Merkle Tree data structure
     * @dev Performs an in-place merkle tree root calculation
     * @dev Note there is currently an assumption here that if the number
     *      of leaves is odd, the final leaf will be duplicated prior to
     *      calling this function
     *
     * @param _data the array of data elements to be verified
     * @param _commitment the expected merkle root of the structure
     * @return a boolean value representing the success or failure of the operation
     */
    function verifyMerkleAll(bytes32[] memory _data, bytes32 _commitment) public pure returns (bool) {
        uint256 hashLength = _data.length;

        for (uint256 j = 0; hashLength > 1; j = 0) {
            for (uint256 i = 0; i < hashLength; i = i + 2) {
                _data[j] = keccak256(abi.encodePacked(_data[i], _data[i + 1]));
                j = j + 1;
            }
            // This effectively halves the list length every time,
            // but a subtraction op-code costs less
            hashLength = hashLength - j;
        }

        return _data[0] == _commitment;
    }

    /**
     * @notice Verify a single leaf element in a Merkle Tree
     * @dev For sake of simplifying the verification algorithm,
     *      we make an assumption that the proof elements are sorted
     *
     * @param root the root of the merkle tree
     * @param leaf the leaf which needs to be proved
     * @param proof the array of proofs to help verify the leafs membership
     * @return a boolean value representing the success or failure of the operation
     */
    function verifyMerkleLeaf(
        bytes32 root,
        bytes32 leaf,
        bytes32[] calldata proof
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash < proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }

    /**
     * @notice Verify that a specific leaf element is part of the Merkle Tree at a specific position in the tree
     * @dev For sake of simplifying the verification algorithm,
     *      we make an assumption that the proof elements are sorted
     *
     * @param root the root of the merkle tree
     * @param leaf the leaf which needs to be proved
     * @param pos the position of the leaf, index starting with 0
     * @param width the width or number of leaves in the tree
     * @param proof the array of proofs to help verify the leafs membership, ordered from leaf to root
     * @return a boolean value representing the success or failure of the operation
     */
    function verifyMerkleLeafAtPosition(
        bytes32 root,
        bytes32 leaf,
        uint256 pos,
        uint256 width,
        bytes32[] calldata proof
    ) public view returns (bool) {
        console.log("root");
        console.logBytes32(root);
        console.log("leaf");
        console.logBytes32(leaf);
        console.log("pos", pos);
        console.log("width", width);
        bytes32 computedHash = leaf;

        if (pos + 1 > width) {
            return false;
        }

        uint256 i = 0;
        for (uint256 height = 0; width > 1; height++) {
            console.log("height", height);
            console.log("  pos", pos);
            console.log("  width", width);

            bool computedHashLeft = pos % 2 == 0;
            console.log("  computedHashLeft", computedHashLeft);

            // check if at rightmost branch and whether the computedHash is left
            if (pos + 1 == width && computedHashLeft) {
                // there is no sibling and also no element in proofs, so we just go up one layer in the tree
                pos /= 2;
                width = ((width - 1) / 2) + 1;
                continue;
            }

            if (i >= proof.length) {
                // need another element from the proof we don't have
                return false;
            }

            bytes32 proofElement = proof[i];
            console.log("  proofElement");
            console.logBytes32(proofElement);

            if (computedHashLeft) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }

            console.log(" computedHash");
            console.logBytes32(computedHash);

            pos /= 2;
            width = ((width - 1) / 2) + 1;
            i++;
        }

        return computedHash == root;
    }
}
