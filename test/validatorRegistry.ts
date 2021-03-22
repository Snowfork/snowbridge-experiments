import { expect } from "chai"
import { ethers } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import type { MerkleProof, ValidatorRegistry } from "types"
import { hex2buf } from "../src/utils/utils"
import { Wallet } from "@ethersproject/wallet"

async function testFixture() {
  const { beefyValidatorAddresses, beefyMerkleTree } = await getMerkleTestData()
  const merkleRoot = beefyMerkleTree.getHexRoot()

  const merkleProofFactory = await ethers.getContractFactory("MerkleProof")
  const merkleProofContract = (await merkleProofFactory.deploy()) as MerkleProof
  await merkleProofContract.deployed()

  const validatorRegistryFactory = await ethers.getContractFactory("ValidatorRegistry", {
    libraries: {
      MerkleProof: merkleProofContract.address,
    },
  })
  const validatorRegistryContract = (await validatorRegistryFactory.deploy(
    merkleRoot,
    beefyValidatorAddresses.length
  )) as ValidatorRegistry
  await validatorRegistryContract.deployed()

  return {
    validatorRegistryContract,
    beefyMerkleTree,
    beefyValidatorAddresses,
  }
}

describe("ValidatorRegistry Contract", function () {
  context("constructor", function () {
    it("Should deploy the contract successfully", async function () {
      const { validatorRegistryContract } = await testFixture()

      expect(validatorRegistryContract).to.haveOwnProperty("address")
    })

    it("Should set the root and number of validators correctly", async function () {
      const { beefyValidatorAddresses, validatorRegistryContract, beefyMerkleTree } = await testFixture()

      expect(await validatorRegistryContract.root()).to.equal(beefyMerkleTree.getHexRoot())
      expect(await validatorRegistryContract.numOfValidators()).to.equal(beefyValidatorAddresses.length)
    })
  })

  context("update function", function () {
    it("Should revert if not owner", async function () {
      const { validatorRegistryContract, beefyMerkleTree, beefyValidatorAddresses } = await testFixture()

      const wallet = Wallet.createRandom().connect(ethers.getDefaultProvider())
      const badContract = validatorRegistryContract.connect(wallet)

      const newRoot = "0xbabebabebabebabebabebabebabebabebabebabebabebabebabebabebabebabf"
      const newNumOfValidators = 4

      const call = badContract.update(newRoot, newNumOfValidators)

      expect(call).to.be.revertedWith("abab")

      expect(await validatorRegistryContract.root()).to.equal(beefyMerkleTree.getHexRoot())
      expect(await validatorRegistryContract.numOfValidators()).to.equal(beefyValidatorAddresses.length)
    })

    it("Should update if owner", async function () {
      const { validatorRegistryContract, beefyMerkleTree, beefyValidatorAddresses } = await testFixture()

      const newRoot = "0xbabebabebabebabebabebabebabebabebabebabebabebabebabebabebabebabe"
      const newNumOfValidators = 3

      const call = validatorRegistryContract.update(newRoot, newNumOfValidators)

      expect(call).to.emit(validatorRegistryContract, "ValidatorRegistryUpdated").withArgs(newRoot, newNumOfValidators)

      expect(await validatorRegistryContract.root()).to.equal(newRoot)
      expect(await validatorRegistryContract.numOfValidators()).to.equal(newNumOfValidators)
    })
  })

  context("checkValidatorInSet function", function () {
    it("Should correctly verify with valid proofs", async function () {
      const { validatorRegistryContract, beefyMerkleTree, beefyValidatorAddresses } = await testFixture()

      const leaf = beefyMerkleTree.getLeaves()[0]
      const proof = beefyMerkleTree.getProof(leaf)
      const root = hex2buf(await validatorRegistryContract.root())

      expect(beefyMerkleTree.verify(proof, leaf, root)).to.be.true

      const hexProof = beefyMerkleTree.getHexProof(leaf)
      const senderAddress = beefyValidatorAddresses[0]
      const result = await validatorRegistryContract.checkValidatorInSet(senderAddress, 0, hexProof)

      expect(result).to.be.true
    })

    it("Should not verify with incorrect position", async function () {
      const { validatorRegistryContract, beefyMerkleTree, beefyValidatorAddresses } = await testFixture()

      const leaf = beefyMerkleTree.getLeaves()[0]
      const proof = beefyMerkleTree.getProof(leaf)
      const root = hex2buf(await validatorRegistryContract.root())

      expect(beefyMerkleTree.verify(proof, leaf, root)).to.be.true

      const hexProof = beefyMerkleTree.getHexProof(leaf)
      const senderAddress = beefyValidatorAddresses[0]
      const result = await validatorRegistryContract.checkValidatorInSet(senderAddress, 1, hexProof)

      expect(result).to.be.false
    })

    it("Should not verify an invalid proof", async function () {
      const { validatorRegistryContract, beefyMerkleTree, beefyValidatorAddresses } = await testFixture()

      const leaf0 = beefyMerkleTree.getLeaves()[0]
      const leaf1 = beefyMerkleTree.getLeaves()[1]
      const proof1 = beefyMerkleTree.getProof(leaf1)
      const root = hex2buf(await validatorRegistryContract.root())

      expect(beefyMerkleTree.verify(proof1, leaf0, root)).to.be.false

      const hexProof1 = beefyMerkleTree.getHexProof(leaf1)
      const badSenderAddress0 = beefyValidatorAddresses[0]
      const result = await validatorRegistryContract.checkValidatorInSet(badSenderAddress0, 0, hexProof1)

      expect(result).to.be.false
    })
  })
})
