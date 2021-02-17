import { expect } from "chai"
import { ethers, waffle, artifacts } from "hardhat"
import { ecsign } from "ethereumjs-util"
import getMerkleTestData from "./data/merkleTestData"
import { LightClientBridge } from "../types"

const NUMBER_OF_SIGNERS = 5

async function testFixture() {
  const { deployMockContract, provider } = waffle

  const { merkleTree, verifierAddresses, verifierPrivateKeys } = await getMerkleTestData()
  const merkleRoot = merkleTree.getHexRoot()

  const ValidatorRegistryABI = (await artifacts.readArtifact("ValidatorRegistry")).abi

  const [signer] = provider.getWallets()
  const mockValidatorRegistry = await deployMockContract(signer, ValidatorRegistryABI)
  mockValidatorRegistry.mock["root"].returns(merkleRoot)

  const lightClientBridgeFactory = await ethers.getContractFactory("LightClientBridge")
  const lightClientBridgeContract = (await lightClientBridgeFactory.deploy(
    mockValidatorRegistry.address
  )) as LightClientBridge
  await lightClientBridgeContract.deployed()

  return {
    lightClientBridgeContract,
    mockValidatorRegistry,
    merkleTree,
    verifierAddresses,
    verifierPrivateKeys,
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
      const { lightClientBridgeContract, mockValidatorRegistry } = await testFixture()

      expect(await lightClientBridgeContract.validatorRegistry()).to.equal(mockValidatorRegistry.address)
    })

    it("Count should initally be zero", async function () {
      const { lightClientBridgeContract } = await testFixture()

      expect(await lightClientBridgeContract.count()).to.equal(0)
    })
  })

  describe("newSignatureCommitment function", function () {
    it("Should not revert when submitting a valid newSignatureCommitment", async function () {
      const { lightClientBridgeContract, mockValidatorRegistry, merkleTree, verifierAddresses } = await testFixture()
      const [signer] = await ethers.getSigners()

      const statement = ethers.utils.solidityKeccak256(["string"], ["test"])
      const statementForSigning: Uint8Array = ethers.utils.arrayify(statement)
      const validatorClaimsBitfield = 123

      const senderSignatureCommitment = await signer.signMessage(statementForSigning)

      const leaf = merkleTree.getLeaves()[0]
      const senderPublicKeyMerkleProof = merkleTree.getHexProof(leaf)

      await mockValidatorRegistry.mock.checkValidatorInSet
        .withArgs(signer.address, senderPublicKeyMerkleProof)
        .returns(true)

      const result = await lightClientBridgeContract.newSignatureCommitment(
        statement,
        validatorClaimsBitfield,
        senderSignatureCommitment,
        signer.address,
        senderPublicKeyMerkleProof
      )
      expect(result).to.not.be.reverted

      expect(await lightClientBridgeContract.count()).to.equal(1)

      // TODO add assertion for the stake being locked up (whose stake? signer? or relayer?)
      // TODO add assertion for the event being emitted
    })

    it("Should revert when validatorPublicKey is not in in validatorRegistry given validatorPublicKeyMerkleProof")
    it("Should revert when validatorPublicKey is not in validatorClaimsBitfield")
    it("Should revert when validatorPublicKey is not signer of statement in validatorSignatureCommitment")
    it("Should revert when validatorClaimsBitfield is too short")
  })

  describe("completeSignatureCommitment function", function () {
    it("Should not revert when calling completeSignatureCommitment after newSignatureCommitment", async function () {
      const { lightClientBridgeContract, mockValidatorRegistry, merkleTree, verifierAddresses } = await testFixture()
      const [signer] = await ethers.getSigners()

      const statement = ethers.utils.solidityKeccak256(["string"], ["test"])
      const statementForSigning: Uint8Array = ethers.utils.arrayify(statement)
      const validatorClaimsBitfield = 123

      const senderSignatureCommitment = await signer.signMessage(statementForSigning)

      const leaf = merkleTree.getLeaves()[0]
      const senderPublicKeyMerkleProof = merkleTree.getHexProof(leaf)

      await mockValidatorRegistry.mock.checkValidatorInSet
        .withArgs(signer.address, senderPublicKeyMerkleProof)
        .returns(true)

      const newSigResult = await lightClientBridgeContract.newSignatureCommitment(
        statement,
        validatorClaimsBitfield,
        senderSignatureCommitment,
        signer.address,
        senderPublicKeyMerkleProof
      )
      expect(newSigResult).to.not.be.reverted

      const countId = 1
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
        countId,
        statement,
        randomSignatureCommitments as any,
        randomSignatureBitfieldPositions as any,
        randomSignerAddresses as any,
        randomPublicKeyMerkleProofs as any
      )

      // TODO add assertion for the stake being refundend

      // TODO add assertion for processStatement being called

      // TODO add assertion for event being emitted
    })

    it("Should revert when random signature positions are different (different bitfield)")
    it(
      "Should revert when a signature is randomly provided that was not in the validatorClaimsBitField when newSignatureCommitment was called"
    )
    it("Should revert when a randomValidatorAddresses is not in in validatorRegistry given randomPublicKeyMerkleProofs")
    it("Should revert when a randomValidatorAddresses is not signer of statement in randomSignatureCommitments")
    it("Should revert when statement is not for the current validator set") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when statement is older than latest committed one") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when statement is not for a previous epoch") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when statement is not for the next epoch but has no validator set changes") // TODO is that not covered above? Do we need other test cases here?
    it("Should revert when statement is not for a future epoch after the next") // TODO is that not covered above? Do we need other test cases here?

    context("validator set changes", function () {
      it("should correctly call the method to update the validator set of mockValidatorRegistry")
    })
  })
})
