import { expect } from "chai"
import web3 from "web3"
import { ethers, waffle, artifacts } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import { LightClientBridge, ValidatorRegistry } from "../types"

const NUMBER_OF_SIGNERS = 5

const testCommitment = {
  signedCommitmentJSON: {
    commitment: {
      payload: '0x458eb462b21eb8b1f96d862c7429d08becff753dfe7bf15e53b7b12a3c7f00e8',
      block_number: 12,
      validator_set_id: 0
    },
    signatures: [
      '0xd093ae4d324b6ed492f6aee0a6260729ce438abff56099f1c183d59455dfaa8b4280d74431470c3b32b1cfe628d9d38f130726d8f48092ec74c7b7904ce453a001',
      '0x4548a01d7fb40f0ee0f21a064572f74dabc983598b1c84f58b6a389eecc1a4c25eae0edb44caa53da51a6c45a53e7fe8b9eb235a20997f3c7c8654656bacff6a00'
    ]
  },
  commitmentBytes: '0x458eb462b21eb8b1f96d862c7429d08becff753dfe7bf15e53b7b12a3c7f00e80c0000000000000000000000',
  hashedCommitment: '0x6e6fece26779b98e5aa5a1acfc3d5b9bf54daed2a6fb6955585e4a993090c3a7'
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
  describe.skip("constructor", function () {
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
      const [signer] = await ethers.getSigners()

      const validatorClaimsBitfield = 123

      const leaf0 = beefyMerkleTree.getLeaves()[0]
      // const validatorPublicKeyMerkleProof0 = beefyMerkleTree.getHexProof(leaf0);

      // expect(await validatorRegistryContract
      //   .checkValidatorInSet(beefyValidatorAddresses[0], validatorPublicKeyMerkleProof0))
      //   .to.be.true
      const recIdIncrement = 27;
      const sig0 = testCommitment.signedCommitmentJSON.signatures[0];
      const recoveryId0 = web3.utils.hexToNumber(`0x${sig0.slice(130)}`);
      console.log({ recoveryId0 });
      const newRecoveryId0 = web3.utils.numberToHex(recoveryId0 + recIdIncrement)
      console.log({ newRecoveryId0 })
      const sig0modified = sig0
        .slice(0, 130)
        .concat(newRecoveryId0.slice(2));
      const sig1 = testCommitment.signedCommitmentJSON.signatures[1];

      const recoveryId1 = web3.utils.hexToNumber(`0x${sig1.slice(130)}`);
      console.log({ recoveryId1 });
      const newRecoveryId1 = web3.utils.numberToHex(recoveryId1 + recIdIncrement)
      console.log({ newRecoveryId1 })

      const sig1modified = sig1
        .slice(0, 130)
        .concat(newRecoveryId1.slice(2));

      const result0 = await lightClientBridgeContract.testSig(
        testCommitment.hashedCommitment,
        sig0modified
      );
      const result1 = await lightClientBridgeContract.testSig(
        testCommitment.hashedCommitment,
        sig1modified
      );

      // const result = await lightClientBridgeContract.newSignatureCommitment(
      //   testCommitment.hashedCommitment,
      //   validatorClaimsBitfield,
      //   sig0,
      //   beefyValidatorAddresses[0] as any,
      //   validatorPublicKeyMerkleProof0
      // )
      // expect(result).to.not.be.reverted

      // expect(await lightClientBridgeContract.currentId()).to.equal(1)

      // TODO add assertion for the stake being locked up (whose stake? signer? or relayer?)
      // TODO add assertion for the event being emitted
    })

    it("Should revert when validatorPublicKey is not in in validatorRegistry given validatorPublicKeyMerkleProof")
    it("Should revert when validatorPublicKey is not in validatorClaimsBitfield")
    it("Should revert when validatorPublicKey is not signer of payload in validatorSignatureCommitment")
    it("Should revert when validatorClaimsBitfield is too short")
  })

  describe("completeSignatureCommitment function", function () {
    xit("Should not revert when calling completeSignatureCommitment after newSignatureCommitment", async function () {
      const { lightClientBridgeContract, validatorRegistryContract, beefyValidatorAddresses, beefyMerkleTree } = await testFixture()
      const [signer] = await ethers.getSigners()

      const payload = ethers.utils.solidityKeccak256(["string"], ["test"])
      const validatorClaimsBitfield = 123

      const leaf = beefyMerkleTree.getLeaves()[0]
      const validatorPublicKeyMerkleProof = beefyMerkleTree.getHexProof(leaf)

      expect(await validatorRegistryContract
        .checkValidatorInSet(signer.address, validatorPublicKeyMerkleProof))
        .to.be.true

      const newSigResult = await lightClientBridgeContract.newSignatureCommitment(
        testCommitment.hashedCommitment,
        validatorClaimsBitfield,
        testCommitment.signedCommitmentJSON.signatures[0],
        beefyValidatorAddresses[0] as any,
        validatorPublicKeyMerkleProof as any
      )
      expect(newSigResult).to.not.be.reverted

      const id = 1
      const randomSignatureCommitments: string[] = []
      const randomSignatureBitfieldPositions: string[] = []
      const randomSignerAddresses: string[] = []
      const randomPublicKeyMerkleProofs: string[] = []
      for (let i = 0; i < NUMBER_OF_SIGNERS; i++) {
        randomSignatureCommitments.push("val")
        randomSignatureBitfieldPositions.push("val")
        randomSignerAddresses.push("val")
        randomPublicKeyMerkleProofs.push("val")
      }

      const completionResult = await lightClientBridgeContract.completeSignatureCommitment(
        id,
        testCommitment.hashedCommitment,
        testCommitment.signedCommitmentJSON.signatures as any,
        randomSignatureBitfieldPositions as any,
        beefyValidatorAddresses as any,
        randomPublicKeyMerkleProofs as any
      )

      // TODO add assertion for the stake being refundend

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
