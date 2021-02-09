/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai"
import { ethers } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import type { ValidatorRegistry } from "types"
import { hex2buf } from "../src/utils/utils"

async function testFixture() {
  const { beefyValidatorAddresses, beefyMerkleTree } = await getMerkleTestData()
  const merkleRoot = beefyMerkleTree.getHexRoot()

  const validatorRegistryFactory = await ethers.getContractFactory("ValidatorRegistry")
  const validatorRegistryContract = (await validatorRegistryFactory.deploy(merkleRoot)) as ValidatorRegistry
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

    it("Should set the root correctly", async function () {
      const { validatorRegistryContract, beefyMerkleTree } = await testFixture()

      expect(await validatorRegistryContract.root()).to.equal(beefyMerkleTree.getHexRoot())
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
      const result = await validatorRegistryContract.checkValidatorInSet(senderAddress, hexProof)

      expect(result).to.be.true
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
      const result = await validatorRegistryContract.checkValidatorInSet(badSenderAddress0, hexProof1)

      expect(result).to.be.false
    })
  })
})
