// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";

/**
 * @title A entry contract for the Ethereum light client
 */
contract LightClientBridge {
    using SafeMath for uint256;

    /* Events */

    /**
     * @notice Notifies an observer that the prover's attempt at initital
     * verification was successful.
     * @dev Note that the prover must wait until `n` blocks have been mined
     * subsequent to the generation of this event before the 2nd tx can be sent
     * @param prover The address of the calling prover
     * @param blockNumber The blocknumber in which the initial validation
     * succeeded
     * @param id An identifier to provide disambiguation
     */
    event InitialVerificationSuccessful(address prover, uint256 blockNumber, uint256 id);

    /**
     * @notice Notifies an observer that the complete verification process has
     *  finished successfuly and the block will be accepted
     * @param prover The address of the successful prover
     * @param statement the statement which was approved for inclusion
     * @param id the identifier used
     */
    event FinalVerificationSuccessful(address prover, bytes32 statement, uint256 id);

    /* Types */

    struct ValidationData {
        bytes32 statement;
        uint256 validatorClaimsBitfield;
        uint256 blockNumber;
        uint256 id;
    }

    /* State */

    ValidatorRegistry private validatorRegistry;
    uint256 private count;
    mapping(bytes32 => ValidationData) public validationData;

    constructor() {
        validatorRegistry = new ValidatorRegistry();
        count = 0;
    }

    /* Public Functions */

    /**
     * @notice Executed by the prover in order to begin the process of block
     * acceptance by the light client
     * @param statement contains the statement signed by the validator(s)
     * @param validatorClaimsBitfield a bitfield containing the membership status of each
     * validator who has claimed to have signed the statement
     * @param senderSignatureCommitment the signature of an arbitrary validator
     * @param senderPublicKeyMerkleProof Proof required for validation of the Merkle tree
     */
    function newSignatureCommitment(
        bytes32 statement,
        uint256 validatorClaimsBitfield,
        bytes memory senderSignatureCommitment,
        bytes32[] calldata senderPublicKeyMerkleProof
    ) public payable {
        //1 - check if senderPublicKeyMerkleProof is valid based on the
        //    ValidatorRegistry merkle root, ie, confirm that the senderPublicKey
        //    is from an active validator, with senderPublicKey being returned
        require(
            validatorRegistry.checkValidatorInSet(validatorClaimsBitfield, senderPublicKeyMerkleProof, msg.sender),
            "Error: Sender must be in validator set"
        );

        //2 - check if senderSignatureCommitment is correct, ie, check if it matches
        //    the signature of senderPublicKey on the statement
        require(validateSignature(statement, senderSignatureCommitment, msg.sender), "Error: Invalid Signature");

        //3 - we're good now, so record statement, validatorClaimsBitfield,
        //    senderPublicKey, blocknumber, etc
        count = count.add(1);
        bytes32 dataHash = keccak256(abi.encodePacked(statement, validatorClaimsBitfield, block.number, count));
        validationData[dataHash] = ValidationData(statement, validatorClaimsBitfield, block.number, count);

        //4 - _(only to be done later, lock up sender stake as collateral)_
        emit InitialVerificationSuccessful(msg.sender, block.number, count);
    }

    /**
     * @notice Performs the second step in the validation logic
     * @param id an identifying value generated in the previous transaction
     * @param statement contains the statement signed by the validator(s)
     * @param randomSignatureCommitments an array of signatures from the randomly chosen validators
     * @param randomSignatureBitfieldPositions an array of bitfields from the chosen validators
     * @param randomPublicKeyMerkleProofs an array of merkle proofs from the chosen validators
     */
    function completeSignatureCommitment(
        uint256 id,
        bytes32 statement,
        bytes[] memory randomSignatureCommitments,
        uint256[] memory randomSignatureBitfieldPositions,
        bytes32[] memory randomPublicKeyMerkleProofs
    ) public {
        //1 - Calculate the random number, with the same offchain logic, ie:
        // uint8[] = getRandomNumbers()

        //2 - Require random numbers generated onchain match random numbers
        //    provided to transaction

        //3 - For each randomSignature, do:
        //    - Take corresponding randomSignatureBitfieldPosition, check with the
        //      onchain bitfield that it corresponds to a positive bitfield entry
        //      for a validator that did actually sign
        //    - Take corresponding randomSignatureCommitments, check with the onchain
        //      bitfield that it corresponds to a positive bitfield entry for a
        //      validator that did actually sign
        //    - Take corresponding randomPublicKeyMerkleProof, check if it is
        //      valid based on the ValidatorRegistry merkle root, ie, confirm that
        //      the randomPublicKey is from an active validator, with randomPublicKey
        //      being returned
        //    - Take corresponding randomSignatureCommitments, check if it is correct,
        //      ie, check if it matches the signature of randomPublicKey on the
        //      statement

        //4 - We're good, we accept the statement

        //5 - We process the statement (maybe do this in/from another contract
        //    can see later)
        // processStatement(statement);

        emit FinalVerificationSuccessful(msg.sender, statement, id);
    }

    /* Private Functions */

    function validateSignature(
        bytes32 hash,
        bytes memory signature,
        address checkAddress
    ) private view returns (bool) {
        //TODO Implement this function
        //1. Parse signature values `(uint8 r, bytes32 s, bytes32 v)` from `bytes signature`
        //2. Perform ecrecover(hash, r, s, v)
        //3. Return boolean showing if the `recovered address == checkAddress`

        return true;
    }

    function getRandomNumbers() private view returns (uint8[5] memory) {
        //    - get statement.blocknumber, add 45
        //    - get randomSeedBlockHash
        //    - create randomSeed with same randomSeed logic as used offchain
        //    - generate 5 random numbers between 1 and 167

        uint8[5] memory nums = [2, 189, 42, 9, 134];
        return nums;
    }

    function processStatement(bytes32 statement) private {
        checkForValidatorSetChanges(statement);
        // TODO Implement the remaining functionality in this function
    }

    /**
     * @notice Check if the statement includes instruction to change the validator set,
     * and if it does then make the required changes
     * @dev This function should call out to the validator registry contract
     * @param statement The value to check if changes are required
     */
    function checkForValidatorSetChanges(bytes32 statement) private {
        // TODO Implement this function
    }
}

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
     */
    function registerValidator(address validator) public onlyOwner returns (bool success) {}

    /**
     * @notice Called in order to unregister a validator
     * @param validator An array of validators to unregister
     */
    function unregisterValidator(address validator) public onlyOwner returns (bool success) {}

    /**
     * @notice Checks if a validator is in the set, and if it's address is a member
     * of the merkle tree
     * @param validatorClaimsBitfield a bitfield containing the membership status of each
     * validator who has claimed to have signed the statement
     * @param senderPublicKeyMerkleProof Proof required for validation of the Merkle tree
     * @param validator The address of the validator to check
     * @return If it is in the set
     */
    function checkValidatorInSet(
        uint256 validatorClaimsBitfield,
        bytes32[] memory senderPublicKeyMerkleProof,
        address validator
    ) public view returns (bool) {
        //TODO Logic
        // 1. Perform a check to see if the validator is one of the validators, using the bitfield
        // 2. Check that the merkle proofs verify correctly

        return true;
    }
}
