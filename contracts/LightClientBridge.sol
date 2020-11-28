// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.8.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title A entry contract for the Ethereum light client
 */
abstract contract LightClientBridge {

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

    address private validatorRegistry;
    uint256 private count;
    mapping(bytes32 => ValidationData) public validationData;

    constructor() public {
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
        bytes32 senderSignatureCommitment,
        bytes32[] calldata senderPublicKeyMerkleProof
    ) public {
        //1 - check if senderPublicKeyMerkleProof is valid based on the
        //    ValidatorRegistry merkle root, ie, confirm that the senderPublicKey
        //    is from an active validator, with senderPublicKey being returned
        require(
            validatorRegistry.checkValidatorInSet(),
            "Error: Sender must be in validator set"
        );

        //2 - check if senderSignatureCommitment is correct, ie, check if it matches
        //    the signature of senderPublicKey on the statement
        require(
            validateSignature(
                statement,
                validatorClaimsBitfield,
                senderSignatureCommitment,
                senderPublicKeyMerkleProof
            ),
            "Error: Invalid Signature"
        );

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
     * @param statement contains the statement signed by the validator(s)
     * @param id an identifying value generated in the previous transaction
     * @param signatures an array of signatures from the randomly chosen validators
     */
    function finaliseValidation(
        bytes32 statement,
        uint256 id,
        bytes32[] signatures
    ) public {
        require(
            validateFinaliseSender(),
            "Error: Sender was not designated relayer"
        );

        require(
            // TODO create another function for this separate from the
            // validation function used in the initialisation stage
            validateSignature(statement, id, signatures),
            "Error: Invalid Signature"
        );

        acceptBlock();
        emit FinalVerificationSuccessful(statement, msg.sender, id);
    }

    /* Private Functions */

    function validateSignature(
        bytes32 statement,
        uint256 validatorClaimsBitfield,
        bytes32 sig,
        bytes32[] calldata proofs
    )
        private
        view
        returns (bool)
    {
        //TODO Implement this function
        //1 - check if senderPublicKeyMerkleProof is valid based on the
        //    ValidatorRegistry merkle root, ie, confirm that the senderPublicKey
        //    is from an active validator, with senderPublicKey being returned
        return true;
    }

    /**
     * @notice Checks that the caller of the finalisation function is the
     * correct sender
     * @dev The exact way in which the validator will be chosen is TBC
     * according to the docs
     * @return A boolean value depending on whether the sender was valid
     * or not
     */
    function validateFinaliseSender() private view returns (bool) {
        return true;
    }

    function acceptBlock() private {
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
 * @dev Stores the validator set as a Merkle root (according to
 * https://hackmd.io/@vKfUEAWlRR2Ogaq8nYYknw/SJmkC_9XP)
 * @dev Inherits `Ownable` to ensure it can only be callable by the
 * instantiating contract account (which is the LightClientBridge contract)
 */
abstract contract ValidatorRegistry is Ownable {

    event validatorRegistered(address validator);
    event validatorUnregistered(address validator);

    /**
     * @notice The merkle root of a merkle tree that contains one leaf for each
     * validator, with that validators public key
     */
    bytes32 public validatorSetMerkleRoot;

    constructor() public {}

    /**
     * @notice Called in order to register a validator
     * @param validator A validator to register
     */
    function registerValidator(address validator)
        public
        onlyOwner
        returns (bool success);

    /**
     * @notice Called in order to unregister a validator
     * @param validator An array of validators to unregister
     */
    function unregisterValidator(address validator)
        public
        onlyOwner
        returns (bool success);

    function checkValidatorInSet(address validator)
        public
        view
        returns (bool inSet);
}
