/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai"
import { ethers } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import type { ValidatorRegistry } from "types"
import { hex2buf } from "../src/utils/utils"
import { keccakFromHexString } from "ethereumjs-util"

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

      const validatorAddress = verifierAddresses[0]

      const leaf = keccakFromHexString(validatorAddress)
      const proof = merkleTree.getProof(leaf)
      const root = hex2buf(await validatorRegistryContract.root())

      expect(merkleTree.verify(proof, leaf, root)).to.be.true

      const hexProof = merkleTree.getHexProof(leaf)

      const result = await validatorRegistryContract.checkValidatorInSet(validatorAddress, hexProof)

      expect(result).to.be.true
    })

    it("Should not verify an invalid proof", async function () {
      const { validatorRegistryContract, merkleTree, verifierAddresses } = await testFixture()
      const validatorAddress = verifierAddresses[0]

      const leaf = keccakFromHexString(validatorAddress)
      const proof = merkleTree.getProof(leaf)
      const root = hex2buf(await validatorRegistryContract.root())

      expect(merkleTree.verify(proof, leaf, root)).to.be.true

      const hexProof = merkleTree.getHexProof(leaf)
      const badAddress = verifierAddresses[1]

      const result = await validatorRegistryContract.checkValidatorInSet(badAddress, hexProof)

      expect(result).to.be.false
    })
  })
})
