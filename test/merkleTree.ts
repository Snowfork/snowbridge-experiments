import { expect } from "chai"
import { ethers } from "hardhat"
import getMerkleTestData from "./data/merkleTestData"
import type { MerkleTree as MerkleTreeContract } from "types"
import { keccakFromHexString } from "ethereumjs-util"
import { hex2buf } from "../src/utils/utils"

async function testFixture() {
  const { merkleTree, verifierAddresses } = await getMerkleTestData()
  const merkleRoot = merkleTree.getHexRoot()

  const merkleTreeFactory = await ethers.getContractFactory("MerkleTree")
  const merkleTreeContract = (await merkleTreeFactory.deploy(merkleRoot)) as MerkleTreeContract
  await merkleTreeContract.deployed()

  return {
    merkleTreeContract,
    merkleTree,
    verifierAddresses,
  }
}

describe("MerkleTree Contract", function () {
  context("constructor", function () {
    it("Should deploy the contract successfully", async function () {
      const { merkleTreeContract } = await testFixture()

      expect(merkleTreeContract).to.haveOwnProperty("address")
    })

    it("Should set the root correctly", async function () {
      const { merkleTreeContract, merkleTree } = await testFixture()

      expect(await merkleTreeContract.root()).to.equal(merkleTree.getHexRoot())
    })
  })

  context("verify function", function () {
    it("Should not revert", async function () {
      const { merkleTreeContract, merkleTree } = await testFixture()

      const leaf = merkleTree.getLeaves()[0]
      const hexLeaf = merkleTree.getHexLeaves()[0]
      const hexProof = merkleTree.getHexProof(leaf)

      await expect(merkleTreeContract.verify(hexLeaf, hexProof)).to.not.be.reverted
    })

    it("Should correctly verify with valid proofs", async function () {
      const { merkleTreeContract, merkleTree } = await testFixture()

      const leaf = merkleTree.getLeaves()[0]
      const hexLeaf = merkleTree.getHexLeaves()[0]
      const proof = merkleTree.getProof(leaf)
      const hexProof = merkleTree.getHexProof(leaf)
      const root = hex2buf(await merkleTreeContract.root())
      const result = await merkleTreeContract.verify(hexLeaf, hexProof)

      expect(result).to.be.true
      expect(merkleTree.verify(proof, leaf, root)).to.be.true
    })

    it("Should not verify an invalid proof", async function () {
      const { merkleTreeContract, merkleTree } = await testFixture()

      const leaf = merkleTree.getLeaves()[0]
      const hexProof = merkleTree.getHexProof(leaf)
      const badLeaf = keccakFromHexString("0x1234")

      const result = await merkleTreeContract.verify(badLeaf, hexProof)
      expect(result).to.be.false
    })
  })
})
