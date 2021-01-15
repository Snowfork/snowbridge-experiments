// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MerkleTree.sol";

/**
 * @title A contract storing state on the current validator set
 * @dev Stores the validator set as a Merkle root
 * @dev Inherits `Ownable` to ensure it can only be callable by the
 * instantiating contract account (which is the LightClientBridge contract)
 */
contract ValidatorRegistry is Ownable, MerkleTree {
    /* Events */

    event ValidatorRegistered(address validator);
    event ValidatorUnregistered(address validator);

    /* State */

    uint256 public validatorSetBitfield;

    constructor(bytes32 validatorSetMerkleRoot) MerkleTree(validatorSetMerkleRoot) {
        uint256 _validatorSetBitfield = 42;
        validatorSetBitfield = _validatorSetBitfield;
    }

    /* Public Functions */

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
     * @notice Checks if a validators address is a member of the merkle tree
     * @param validatorAddress The address of the validator to check
     * @param validatorAddressMerkleProof Proof required for validation of the address
     * @return Returns true if the validator is in the set
     */
    function checkValidatorInSet(address validatorAddress, bytes32[] memory validatorAddressMerkleProof)
        public
        view
        returns (bool)
    {
        bytes32 hashedLeaf = keccak256(abi.encodePacked(validatorAddress));
        return MerkleTree.verify(hashedLeaf, validatorAddressMerkleProof);
    }
}
