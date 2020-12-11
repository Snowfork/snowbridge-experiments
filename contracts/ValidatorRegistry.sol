// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title A contract storing state on the current validator set
 * @dev Stores the validator set as a Merkle root
 * @dev Inherits `Ownable` to ensure it can only be callable by the
 * instantiating contract account (which is the LightClientBridge contract)
 */
contract ValidatorRegistry is Ownable {
    event validatorRegistered(address validator);
    event validatorUnregistered(address validator);

    /**
     * @notice The merkle root of a merkle tree that contains one leaf for each
     * validator, with that validators public key
     */
    bytes32 public validatorSetMerkleRoot;

    constructor() {}

    /**
     * @notice Called in order to register a validator
     * @param validator A validator to register
     * @return success Returns true if the validator was registered
     */
    function registerValidator(address validator) public onlyOwner returns (bool success) {
        /**
         * @todo Implement this function
         */
        return true;
    }

    /**
     * @notice Called in order to unregister a validator
     * @param validator An array of validators to unregister
     * @return success Returns true if the validator was unregistered
     */
    function unregisterValidator(address validator) public onlyOwner returns (bool success) {
        /**
         * @todo Implement this function
         */
        return true;
    }

    /**
     * @notice Checks if a validator is in the set, and if it's address is a member
     * of the merkle tree
     * @param validatorClaimsBitfield a bitfield containing the membership status of each
     * validator who has claimed to have signed the statement
     * @param senderPublicKeyMerkleProof Proof required for validation of the Merkle tree
     * @param validator The address of the validator to check
     * @return Returns true if the validator is in the set
     */
    function checkValidatorInSet(
        uint256 validatorClaimsBitfield,
        bytes32[] memory senderPublicKeyMerkleProof,
        address validator
    ) public view returns (bool) {
        /**
         * @todo Implement this function
         * 1. Perform a check to see if the validator is one of the validators, using the bitfield
         * 2. Check that the merkle proofs verify correctly
         */
        return true;
    }
}
