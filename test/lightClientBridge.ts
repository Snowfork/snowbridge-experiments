import { expect } from "chai"
import web3 from "web3"
import { ethers, waffle, artifacts } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import { LightClientBridge, ValidatorRegistry } from "../types"

const testCommitment = {
  signedCommitmentJSON: {
    commitment: {
      payload: '0x79fa868a511f46c319fefc97c8dac00256c04ca066672905dd74bcd0b7cf8d15',
      block_number: 212,
      validator_set_id: 0
    },
    signatures: [
      '0x53e443dfc419233ae87b4b16f0acf068063973a7abfc709c3e4e4362d44daca8231e2bf581d3a601f11e75a223e61e763be5b52858033a0cb1dbbc68a86e78aa00',
      '0xdbe2f8f441ca30227d2865b9c9c8ca715ddf814ffaa35f107889492b18884671723d083354af411931692ebd4b4e3f1e222378acdfd6cf8de0fa051f9102edad00'
    ]
  },
  commitmentBytes: '0x79fa868a511f46c319fefc97c8dac00256c04ca066672905dd74bcd0b7cf8d15d40000000000000000000000',
  hashedCommitment: '0x4414e69fc0157450f099f217c44efdd9c8b45035849de68930ce50ea86072b57'
};

async function testFixture() {
  const { beefyValidatorAddresses, beefyMerkleTree } = await getMerkleTestData()
  const merkleRoot = beefyMerkleTree.getHexRoot()

  const validatorRegistryFactory = await ethers.getContractFactory("ValidatorRegistry")
  const validatorRegistryContract = (await validatorRegistryFactory.deploy(
    merkleRoot
  )) as ValidatorRegistry
  await validatorRegistryContract.deployed()

  const lightClientBridgeFactory = await ethers.getContractFactory("LightClientBridge")
  const lightClientBridgeContract = (await lightClientBridgeFactory.deploy(
    validatorRegistryContract.address
  )) as LightClientBridge
  await lightClientBridgeContract.deployed()

  return {
    lightClientBridgeContract,
    validatorRegistryContract,
    beefyValidatorAddresses,
    beefyMerkleTree,
  }
}

describe.only("LightClientBridge Contract", function () {
  describe("constructor", function () {
    it("Should deploy the contract successfully", async function () {
      const { lightClientBridgeContract } = await testFixture()

      expect(lightClientBridgeContract).to.haveOwnProperty("address")
    })

    it("Should set the validatorRegistry contract correctly", async function () {
      const { lightClientBridgeContract, validatorRegistryContract } = await testFixture()

      expect(await lightClientBridgeContract.validatorRegistry()).to.equal(validatorRegistryContract.address)
    })

    it("currentId should initally be zero", async function () {
      const { lightClientBridgeContract } = await testFixture()

      expect(await lightClientBridgeContract.currentId()).to.equal(0)
    })
  })

  describe("newSignatureCommitment function", function () {

    it("Should not revert when submitting a valid newSignatureCommitment", async function () {
      const { lightClientBridgeContract, validatorRegistryContract, beefyValidatorAddresses, beefyMerkleTree } = await testFixture()

      //TODO: Add bitfield stuff properly
      const validatorClaimsBitfield = 123

      // Get validator leaves and proofs for each leaf
      const leaf0 = beefyMerkleTree.getLeaves()[0]
      const validatorPublicKeyMerkleProof0 = beefyMerkleTree.getHexProof(leaf0);
      const leaf1 = beefyMerkleTree.getLeaves()[1]
      const validatorPublicKeyMerkleProof1 = beefyMerkleTree.getHexProof(leaf1);

      // Confirm validators are in fact part of validator set
      expect(await validatorRegistryContract
        .checkValidatorInSet(beefyValidatorAddresses[0], validatorPublicKeyMerkleProof0))
        .to.be.true

      expect(await validatorRegistryContract
        .checkValidatorInSet(beefyValidatorAddresses[1], validatorPublicKeyMerkleProof1))
        .to.be.true

      // Update signature format (Polkadot uses recovery IDs 0 or 1, Eth uses 27 or 28, so we need to add 27)
      const recIdIncrement = 27;
      let sig0 = testCommitment.signedCommitmentJSON.signatures[0];
      const recoveryId0 = web3.utils.hexToNumber(`0x${sig0.slice(130)}`);
      const newRecoveryId0 = web3.utils.numberToHex(recoveryId0 + recIdIncrement)

      let sig1 = testCommitment.signedCommitmentJSON.signatures[1];
      const recoveryId1 = web3.utils.hexToNumber(`0x${sig1.slice(130)}`);
      const newRecoveryId10 = web3.utils.numberToHex(recoveryId1 + recIdIncrement)

      sig0 = sig0
        .slice(0, 130)
        .concat(newRecoveryId0.slice(2));

      sig1 = sig1
        .slice(0, 130)
        .concat(newRecoveryId10.slice(2));

      const result = lightClientBridgeContract.newSignatureCommitment(
        testCommitment.hashedCommitment,
        validatorClaimsBitfield,
        sig0,
        beefyValidatorAddresses[0] as any,
        validatorPublicKeyMerkleProof0
      )

      expect(result).to.not.be.reverted

      expect(await lightClientBridgeContract.currentId()).to.equal(1)

      // TODO add assertion for the stake being locked up (whose stake? signer? or relayer?)
      // TODO add assertion for any event being emitted
    })

    it("Should revert when validatorPublicKey is not in in validatorRegistry given validatorPublicKeyMerkleProof")
    it("Should revert when validatorPublicKey is not in validatorClaimsBitfield")
    it("Should revert when validatorPublicKey is not signer of payload in validatorSignatureCommitment")
    it("Should revert when validatorClaimsBitfield is too short")
  })

  describe("completeSignatureCommitment function", function () {
    it("Should not revert when calling completeSignatureCommitment after newSignatureCommitment", async function () {
      const { lightClientBridgeContract, validatorRegistryContract, beefyValidatorAddresses, beefyMerkleTree } = await testFixture()

      //TODO: Add bitfield stuff properly
      const validatorClaimsBitfield = 123

      // Get validator leaves and proofs for each leaf
      const leaf0 = beefyMerkleTree.getLeaves()[0]
      const validatorPublicKeyMerkleProof0 = beefyMerkleTree.getHexProof(leaf0);
      const leaf1 = beefyMerkleTree.getLeaves()[1]
      const validatorPublicKeyMerkleProof1 = beefyMerkleTree.getHexProof(leaf1);

      // Confirm validators are in fact part of validator set
      expect(await validatorRegistryContract
        .checkValidatorInSet(beefyValidatorAddresses[0], validatorPublicKeyMerkleProof0))
        .to.be.true

      expect(await validatorRegistryContract
        .checkValidatorInSet(beefyValidatorAddresses[1], validatorPublicKeyMerkleProof1))
        .to.be.true

      // Update signature format (Polkadot uses recovery IDs 0 or 1, Eth uses 27 or 28, so we need to add 27)
      const recIdIncrement = 27;
      let sig0 = testCommitment.signedCommitmentJSON.signatures[0];
      const recoveryId0 = web3.utils.hexToNumber(`0x${sig0.slice(130)}`);
      const newRecoveryId0 = web3.utils.numberToHex(recoveryId0 + recIdIncrement)

      let sig1 = testCommitment.signedCommitmentJSON.signatures[1];
      const recoveryId1 = web3.utils.hexToNumber(`0x${sig1.slice(130)}`);
      const newRecoveryId10 = web3.utils.numberToHex(recoveryId1 + recIdIncrement)

      sig0 = sig0
        .slice(0, 130)
        .concat(newRecoveryId0.slice(2));

      sig1 = sig1
        .slice(0, 130)
        .concat(newRecoveryId10.slice(2));

      const result = lightClientBridgeContract.newSignatureCommitment(
        testCommitment.hashedCommitment,
        validatorClaimsBitfield,
        sig0,
        beefyValidatorAddresses[0] as any,
        validatorPublicKeyMerkleProof0
      )

      expect(result).to.not.be.reverted

      expect(await lightClientBridgeContract.currentId()).to.equal(1)

      //TODO Generate randomSignatureBitfieldPositions properly
      const randomSignatureBitfieldPositions: string[] = []

      // Populate randomSignerAddresses and randomPublicKeyMerkleProofs and randomSignatureCommitments
      // based on randomSignatureBitfieldPositions required
      const randomValidatorAddresses: string[] = beefyValidatorAddresses
      const randomPublicKeyMerkleProofs: string[] = []
      const randomSignatureCommitments: string[] = testCommitment.signedCommitmentJSON.signatures

      const validationDataID = 0;
      const completionResult = await lightClientBridgeContract.completeSignatureCommitment(
        validationDataID,
        testCommitment.hashedCommitment,
        randomSignatureCommitments as any,
        randomSignatureBitfieldPositions as any,
        randomValidatorAddresses as any,
        randomPublicKeyMerkleProofs as any
      )
      expect(completionResult).to.not.be.reverted

      // TODO add assertion for the stake being refunded

      // TODO add assertion for processPayload being called

      // TODO add assertion for event being emitted
    })

    it("Should revert when random signature positions are different (different bitfield)")
    it(
      "Should revert when a signature is randomly provided that was not in the validatorClaimsBitField when newSignatureCommitment was called"
    )
    it("Should revert when a randomValidatorAddresses is not in in validatorRegistry given randomPublicKeyMerkleProofs")
    it("Should revert when a randomValidatorAddresses is not signer of payload in randomSignatureCommitments")
    it("Should revert when payload is not for the current validator set") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when payload is older than latest committed one") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when payload is not for a previous epoch") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when payload is not for the next epoch but has no validator set changes") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when payload is not for a future epoch after the next") // TODO is that not covered above? Do we need other test cases here?

    context("validator set changes", function () {
      it("should correctly call the method to update the validator set of validatorRegistry")
    })
  })
})
