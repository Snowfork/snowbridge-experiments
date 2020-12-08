// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.7.0;

/**
    The assumed MMR data structure on Substrate is from https://github.com/paritytech/substrate/pull/7312/files,
    with some slight modifications for gas optimization (merkle root of ParaHeads, adding Option<H256> pub key root):

    MMRLeaf {
        H256 (Polkadot block header hash)
        H256 (root of merkle tree of `ParaHead`s)
        H256 (root of merkle tree of BridgeMessage)
        Option<H256> (merkle root of a tree of new validator pubkey)
    }
 */

abstract contract MMRVerification {
    // Contract storage:
    // - current byte32 MMR root (future: array of current + previous roots as a circular queue with size N)
    // - current public keys of validator set (optimization: merkle tree of public keys, only store root,
    //   future: array of current + previous roots as a circular queue with size N).

    /**
     * @dev Updates the current MMR root, validating the new proposed MMR root by a
     *      subset of validator signatures. Called every time a new MMR root is available.
     * @param newMmrRoot the new proposed MMR root.
     * @param signatures the subset of validator signatures on this MMR root.
     * @param bitmap a bitmap indicating which validators the signatures belong to.
     */
    function updateMMR(
        bytes32 newMmrRoot,
        bytes32[] memory signatures,
        uint8[] memory bitmap
    ) public virtual returns (bool);

    /**
     * @dev Updates the current MMR root and updates the validator set. Called instead of
     *      `updateMMR` for blocks which include a validator set change commitment.
     * @param newMmrRoot the new proposed MMR root.
     * @param signatures the subset of validator signatures on this MMR root.
     * @param bitmap bitmap indicating which validators the signatures belong to.
     * @param valPubKeys new validator public keys.
     * @param pubKeyProof merkle proof of the new validator public keys in the MMR.
     */
    function updateMMRWithValSet(
        bytes32 newMmrRoot,
        bytes32[] memory signatures,
        uint8[] memory bitmap,
        bytes32[] memory valPubKeys,
        bytes32[] memory pubKeyProof
    ) public virtual returns (bool);

    /**
     * @dev Updates the set of validator public keys stored on contract.
     * @param valPubKeys new validator public keys.
     * @param pubKeyProof merkle proof of the new validator public keys in the MMR.
     */
    function updateValSet(bytes32[] memory valPubKeys, bytes32[] memory pubKeyProof) internal virtual returns (bool);

    /**
     * @dev Validate that a set of messages is contained and executes them.
     * @param blockHeader the header hash of the block containing the messages.
     * @param paraHead parachain Header.
     * @param paraHeadSiblingsProof hashes of siblings needed for the merkle proof of the parachain header.
     * @param messages flat list of all messages.
     * @param mmrSiblingsProof hashes of the mmr's siblings.
     */
    function executeMessages(
        bytes32 blockHeader,
        bytes32 paraHead,
        bytes32[] memory paraHeadSiblingsProof,
        bytes32[] memory messages,
        bytes32[] memory mmrSiblingsProof
    ) public virtual;
}
