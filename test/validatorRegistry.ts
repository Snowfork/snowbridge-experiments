/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai"
import { ethers } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import type { ValidatorRegistry } from "types"
import { hex2buf } from "../src/utils/utils"

async function testFixture() {
  const { merkleTree, verifierAddresses } = await getMerkleTestData()
  const merkleRoot = merkleTree.getHexRoot()

  const validatorRegistryFactory = await ethers.getContractFactory("ValidatorRegistry")
  const validatorRegistryContract = (await validatorRegistryFactory.deploy(merkleRoot)) as ValidatorRegistry
  await validatorRegistryContract.deployed()

  return {
    validatorRegistryContract,
    merkleTree,
    verifierAddresses,
  }
}

describe("ValidatorRegistry Contract", function () {
  context("constructor", function () {
    it("Should deploy the contract successfully", async function () {
      const { validatorRegistryContract } = await testFixture()

      expect(validatorRegistryContract).to.haveOwnProperty("address")
    })

    it("Should set the root correctly", async function () {
      const { validatorRegistryContract, merkleTree } = await testFixture()

      expect(await validatorRegistryContract.root()).to.equal(merkleTree.getHexRoot())
    })
  })

  context("checkValidatorInSet function", function () {
    it("Should correctly verify with valid proofs", async function () {
      const { validatorRegistryContract, merkleTree, verifierAddresses } = await testFixture()

      const leaf = merkleTree.getLeaves()[0]
      const proof = merkleTree.getProof(leaf)
      const root = hex2buf(await validatorRegistryContract.root())

      expect(merkleTree.verify(proof, leaf, root)).to.be.true

      const hexProof = merkleTree.getHexProof(leaf)
      const senderAddress = verifierAddresses[0]
      const result = await validatorRegistryContract.checkValidatorInSet(senderAddress, hexProof)

      expect(result).to.be.true
    })

    it("Should not verify an invalid proof", async function () {
      const { validatorRegistryContract, merkleTree, verifierAddresses } = await testFixture()

      const leaf = merkleTree.getLeaves()[1]
      const proof = merkleTree.getProof(leaf)
      const root = hex2buf(await validatorRegistryContract.root())

      expect(merkleTree.verify(proof, leaf, root)).to.be.false

      const hexProof = merkleTree.getHexProof(leaf)
      const badSenderAddress = verifierAddresses[1]
      const result = await validatorRegistryContract.checkValidatorInSet(badSenderAddress, hexProof)

      expect(result).to.be.false
    })
  })
})
