import { expect } from "chai"
import { ethers, waffle, artifacts } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import { LightClientBridge, ValidatorRegistry } from "../types"

const NUMBER_OF_SIGNERS = 5

const testCommitment1 = {
  commitment: {
    payload: "0x47fb590e34f51fd6156e2e1f6049a05bedc9dc8bc9550c5cde38a3afb61ae3c3",
    block_number: 6,
    validator_set_id: 0,
  },
  signatures: [
    "0xe22c329e80d16ab6f58560e96e171837c98304355bcc4161adb78f57fbbd99851cabff9873a6f5c7db3651e188ccf7e3b544610055b92877d78ac1ac4468c247",
    "0x01c8e8d11a3e0196695b4fe8cefd16d24697d941c708c1fea02d04523f0604c9a778344ea13b02a0fcb1c8e489fdaa0f300149c905413b9b188e4faa33fe61fc",
  ],
}

const testCommitment2 = {
  commitment: {
    payload: "0x4a6516c2f427383bbe90f367f875f360b8c0986e2a01b2b29451904576dddcb7",
    block_number: 8,
    validator_set_id: 0,
  },
  signatures: [
    "0xaa97c821f95a83edd4c9cefb7e03dc5dae00a977d51ee49f29a8f8c0efa0e187582833e6814b5508fe04272826a6b9a95b11d64901260ee8fa218b7e194b48a0",
    "0x01f44abd89dadbd4245ea1495114f8908ef48f4d77be5bc5e4bcdf81a670ebf2ca56c151dc89e4e65cc274625a9adb99fab3785f975933d4c25303fa05488ec8",
  ],
}

async function testFixture() {
  const { beefyValidatorAddresses, beefyMerkleTree } = await getMerkleTestData()
  const merkleRoot = beefyMerkleTree.getHexRoot()

  const validatorRegistryFactory = await ethers.getContractFactory("ValidatorRegistry")
  const validatorRegistryContract = (await validatorRegistryFactory.deploy(merkleRoot)) as ValidatorRegistry
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

/**
 * Note: We can use Waffle's chai matchers here without explicitly
 * stating `chai.use(solidity)`
 */
describe("LightClientBridge Contract", function () {
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
      const {
        lightClientBridgeContract,
        validatorRegistryContract,
        beefyValidatorAddresses,
        beefyMerkleTree,
      } = await testFixture()
      const [signer] = await ethers.getSigners()

      const validatorClaimsBitfield = 123

      const leaf0 = beefyMerkleTree.getLeaves()[0]
      const validatorPublicKeyMerkleProof0 = beefyMerkleTree.getHexProof(leaf0)

      expect(
        await validatorRegistryContract.checkValidatorInSet(beefyValidatorAddresses[0], validatorPublicKeyMerkleProof0)
      ).to.be.true

      const result = await lightClientBridgeContract.newSignatureCommitment(
        testCommitment2.commitment.payload,
        validatorClaimsBitfield,
        testCommitment2.signatures[0],
        beefyValidatorAddresses[0] as any,
        validatorPublicKeyMerkleProof0
      )
      expect(result).to.not.be.reverted

      expect(await lightClientBridgeContract.currentId()).to.equal(1)

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
      const {
        lightClientBridgeContract,
        validatorRegistryContract,
        beefyValidatorAddresses,
        beefyMerkleTree,
      } = await testFixture()
      const [signer] = await ethers.getSigners()

      const payload = ethers.utils.solidityKeccak256(["string"], ["test"])
      const payloadForSigning: Uint8Array = ethers.utils.arrayify(payload)
      const validatorClaimsBitfield = 123

      const leaf = beefyMerkleTree.getLeaves()[0]
      const validatorPublicKeyMerkleProof = beefyMerkleTree.getHexProof(leaf)

      expect(await validatorRegistryContract.checkValidatorInSet(signer.address, validatorPublicKeyMerkleProof)).to.be
        .true

      const newSigResult = await lightClientBridgeContract.newSignatureCommitment(
        testCommitment2.commitment.payload,
        validatorClaimsBitfield,
        testCommitment2.signatures[0],
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
        testCommitment2.commitment.payload,
        testCommitment2.signatures as any,
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
