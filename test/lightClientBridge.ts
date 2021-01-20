import { expect } from "chai"
import { ethers, waffle, artifacts } from "hardhat"
import { ecsign } from "ethereumjs-util"
import getMerkleTestData from "./data/merkleTestData"
import type { LightClientBridge } from "types"

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
describe.only("LightClientBridge Contract", function () {
  context("constructor", function () {
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

  context("newSignatureCommitment function", function () {
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
        senderPublicKeyMerkleProof
      )
      expect(result).to.not.be.reverted
    })
  })

  context("completeSignatureCommitment function", function () {
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
        (randomSignatureCommitments as any),
        (randomSignatureBitfieldPositions as any),
        (randomSignerAddresses as any),
        (randomPublicKeyMerkleProofs as any)
      )
    })
  })
})

// Attack vectors to test
/*
TODO

newSignatureCommitment:
  - tests for incorrect/gamed initial validatorPublicKey/validatorPublicKeyMerkleProof/validatorSignatureCommitment ?maybe not even needed actually?
  - validatorClaimsBitfield initial submitted with not enough claims, or too short, or too long?

completeSignatureCommitment:
  - fake random numbers not following algo
  - can the random number generator be fooled/gamed? assess how it works in detail and think about attack vectors on it.
  - correct sigs, but claim validator didnt sign when they actually did?
  - correct sigs, but claim validator signed when they actually didnt?
  - correct sigs, but wrong bitfield position, not actually following rando
  - incorrect/fake sig for some validator?
  - processing:
    - correct statement, but actually an old one or one without latest new mmr
    - correct statement, but skips some epochs so opens a gap?
    - correct statement, but doesnt actually include correct mmrproof to newest leaf
    - correct statement, but actually includes mmrproof to old leaf
    - correct statement, correct mmrproof, but actually wrong beefy_authority_set_merkle_root

- can the Bits.sol implementation be games/is it fully secure? assess how it works in detail and think about attack vectors on it.

*/
