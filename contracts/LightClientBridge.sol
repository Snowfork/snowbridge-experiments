// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "./utils/Bits.sol";
import "./ValidatorRegistry.sol";

/**
 * @title A entry contract for the Ethereum light client
 */
contract LightClientBridge {
    using SafeMath for uint256;
    using Bits for uint256;

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
        address senderAddress;
        bytes32 statement;
        uint256 validatorClaimsBitfield;
        uint256 blockNumber;
    }

    /* State */

    ValidatorRegistry public validatorRegistry;
    uint256 public count;
    mapping(uint256 => ValidationData) public validationData;

    /* Constants */

    uint256 public constant BLOCK_WAIT_PERIOD = 45;
    uint256 public constant NUMBER_OF_SIGNERS = 5;
    uint256 public constant MAXIMUM_NUM_SIGNERS = 167;

    /**
     * @notice Deploys the LightClientBridge contract
     * @dev If the validatorSetRegistry should be initialised with 0 entries, then input
     * 0x00 as validatorSetRoot
     * @param _validatorRegistry The contract to be used as the validator registry
     */
    constructor(ValidatorRegistry _validatorRegistry) {
        validatorRegistry = _validatorRegistry;
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
        /**
         * @dev Check if senderPublicKeyMerkleProof is valid based on ValidatorRegistry merkle root
         */
        require(
            validatorRegistry.checkValidatorInSet(msg.sender, senderPublicKeyMerkleProof),
            "Error: Sender must be in validator set"
        );

        /**
         * @dev Check if senderSignatureCommitment is correct, ie. check if it matches
         * the signature of senderPublicKey on the statement
         */
        require(ECDSA.recover(statement, senderSignatureCommitment) == msg.sender, "Error: Invalid Signature");

        count = count.add(1);
        /// @follow-up How can we be sure of 1-to-1 relationship between the bitfield position and validator address?
        validationData[count] = ValidationData(msg.sender, statement, validatorClaimsBitfield, block.number);

        /**
         * @todo Lock up the sender stake as collateral
         */
        emit InitialVerificationSuccessful(msg.sender, block.number, count);
    }

    /**
     * @notice Performs the second step in the validation logic
     * @param id an identifying value generated in the previous transaction
     * @param statement contains the statement signed by the validator(s)
     * @param randomSignatureCommitments an array of signatures from the randomly chosen validators
     * @param randomSignatureBitfieldPositions an array of bitfields from the chosen validators
     * @param randomSignerAddresses an array of the ethereum address of each signer
     * @param randomPublicKeyMerkleProofs an array of merkle proofs from the chosen validators
     */
    function completeSignatureCommitment(
        uint256 id,
        bytes32 statement,
        bytes[NUMBER_OF_SIGNERS] memory randomSignatureCommitments,
        uint8[NUMBER_OF_SIGNERS] memory randomSignatureBitfieldPositions,
        address[NUMBER_OF_SIGNERS] memory randomSignerAddresses,
        bytes32[][NUMBER_OF_SIGNERS] memory randomPublicKeyMerkleProofs
    ) public {
        ValidationData storage data = validationData[id];

        /**
         * @dev Some simple validation checks
         * @note Is there anything else we should be checking here?
         */
        require(statement == data.statement, "Error: Statement does not match argument");

        /**
         * @dev Generate an array of numbers
         */
        uint8[NUMBER_OF_SIGNERS] memory randomNumbers = getRandomNumbers(data);

        /**
         *  @dev For each randomSignature, do:
         */
        for (uint256 i = 0; i < NUMBER_OF_SIGNERS; i++) {
            // @note Require random numbers generated onchain match random numbers
            // provided to transaction (this requires both arrays to remain in the order they were generated in)
            require(randomNumbers[i] == randomSignatureBitfieldPositions[i], "Error: Random number error");

            // @note Take corresponding randomSignatureBitfieldPosition, check with the
            // onchain bitfield that it corresponds to a positive bitfield entry
            // for a validator that did actually sign
            uint8 bitFieldPosition = randomSignatureBitfieldPositions[i];
            require(data.validatorClaimsBitfield.bitSet(bitFieldPosition), "Error: Bitfield positions incorrect");

            // @note Take corresponding randomPublicKeyMerkleProof, check if it is
            //  valid based on the ValidatorRegistry merkle root, ie, confirm that
            //  the randomSignerAddress is from an active validator
            require(
                validatorRegistry.checkValidatorInSet(randomSignerAddresses[i], randomPublicKeyMerkleProofs[i]),
                "Error: Sender must be in validator set"
            );

            // @note Take corresponding randomSignatureCommitments, check if it is correct,
            // ie. check if it matches the signature of randomSignerAddresses on the statement
            require(
                ECDSA.recover(statement, randomSignatureCommitments[i]) == randomSignerAddresses[i],
                "Error: Invalid Signature"
            );
        }

        /**
         * @follow-up Do we need a try-catch block here?
         */
        processStatement(statement);

        emit FinalVerificationSuccessful(msg.sender, statement, id);

        /**
         * @dev We no longer need the data held in state, so delete it for a gas refund
         */
        delete validationData[id];
    }

    /* Private Functions */

    /**
     * @notice Deterministically generates an array of numbers using the blockhash as a seed
     * @dev Note that `blockhash(blockNum)` will only work for the 256 most recent blocks
     * @dev Each generated number must be less than 167
     * @param data a storage reference to the validationData struct
     * @return onChainRandNums an array storing the random numbers generated inside this function
     */
    function getRandomNumbers(ValidationData storage data)
        private
        view
        returns (uint8[NUMBER_OF_SIGNERS] memory onChainRandNums)
    {
        // @note Get statement.blocknumber, add 45
        uint256 randomSeedBlockNum = data.blockNumber.add(BLOCK_WAIT_PERIOD);
        // @note Create a hash seed from the block number
        bytes32 randomSeedBlockHash = blockhash(randomSeedBlockNum);

        /**
         * @todo This is just a dummy random number generation process until the final implementation is known
         */
        for (uint8 i = 0; i < NUMBER_OF_SIGNERS; i++) {
            randomSeedBlockHash = keccak256(abi.encode(randomSeedBlockHash));
            // @note Type conversion from bytes32 -> uint8, by way of bytes1 (to work around limitations)
            onChainRandNums[i] = uint8(bytes1(randomSeedBlockHash));
        }
    }

    /**
     * @notice Perform some operation[s] using the statement
     * @param statement The statement variable passed in via the initial function
     */
    function processStatement(bytes32 statement) private {
        checkForValidatorSetChanges(statement);
        // @todo Implement this function
    }

    /**
     * @notice Check if the statement includes instruction to change the validator set,
     * and if it does then make the required changes
     * @dev This function should call out to the validator registry contract
     * @param statement The value to check if changes are required
     */
    function checkForValidatorSetChanges(bytes32 statement) private {
        // @todo Implement this function
    }
}
