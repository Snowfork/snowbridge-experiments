const { expect } = require("chai")
const { ethers } = require("hardhat")
const { MerkleTree } = require("merkletreejs")
const generateSampleData = require("../src/sampleData")
const { buf2hex, getMerkleRoot, keccak, hex2buf } = require("../src/utils")

describe("Verification contract", function() {
  /**
   * @type import("ethers").Contract
   */
  let verification
  /**
   * @type Buffer[]
   */
  let hashedData
  /**
   * @type string[]
   */
  let hexData

  context("List Data Structure", function() {
    beforeEach(async function() {
      const Verification = await ethers.getContractFactory("Verification")
      verification = await Verification.deploy()
      await verification.deployed()

      const hashedData = [...generateSampleData(100)].map(x => keccak(x))
      hexData = hashedData.map(buf2hex)
    })

    it("Should verify an array of hashed data, given the commitment is correct", async function() {
      const commitment = hexData.reduce((prev, curr) =>
        ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
      )

      const result = await verification.verifyMessageArray(hexData, commitment)

      expect(result).to.be.true
    })

    it("Should not verify an array of hashed data, when the commitment is not correct", async function() {
      const commitment = hexData.reduce((prev, curr) =>
        ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
      )

      const badData = ["s", "n", "O", "w", "f", "U", "n", "k"].map(x => keccak(x)).map(buf2hex)

      const result = await verification.verifyMessageArray(badData, commitment)

      expect(result).to.be.false
    })
    it("Should not revert when called", async function() {
      const commitment = hexData.reduce((prev, curr) =>
        ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
      )

      await expect(verification.verifyMessageArray(hexData, commitment)).to.not.be.reverted
    })
  })

  context("Merkle Tree Data Structure", function() {
    beforeEach(async function() {
      const Verification = await ethers.getContractFactory("Verification")
      verification = await Verification.deploy()
      await verification.deployed()

      hashedData = [...generateSampleData(100)].map(x => keccak(x))
      hexData = hashedData.map(buf2hex)
    })

    describe("When verifying a single leaf in the tree", function() {
      it("Should verify an array of hashed data, given the commitment is correct", async function() {
        const tree = new MerkleTree(hashedData, keccak, { sort: true })

        const root = tree.getRoot()
        const hexRoot = tree.getHexRoot()

        const leaf = hashedData[0]
        const hexLeaf = MerkleTree.bufferToHex(leaf)

        const proof = tree.getProof(leaf)
        const hexProof = tree.getHexProof(leaf)

        const result = await verification.verifyMerkleLeaf(hexRoot, hexLeaf, hexProof)

        expect(tree.verify(proof, leaf, root)).to.be.true
        expect(result).to.be.true
      })

      it("Should not verify an array of hashed data, when the commitment is not correct", async function() {
        const tree = new MerkleTree(hashedData, keccak, { sort: true })

        const root = tree.getRoot()
        const hexRoot = tree.getHexRoot()

        const correctLeaf = hashedData[0]
        const incorrectLeaf = keccak("0")
        const incorrectLeafHex = MerkleTree.bufferToHex(incorrectLeaf)

        const proof = tree.getProof(correctLeaf)
        const hexProof = tree.getHexProof(correctLeaf)

        const result = await verification.verifyMerkleLeaf(hexRoot, incorrectLeafHex, hexProof)

        expect(tree.verify(proof, incorrectLeaf, root)).to.be.false
        expect(result).to.be.false
      })
      it("Should not revert when called", async function() {
        const tree = new MerkleTree(hexData, keccak, { sort: true })
        const hexRoot = tree.getHexRoot()
        const hexLeaf = hexData[0]
        const hexProof = tree.getHexProof(hex2buf(hexLeaf))

        await expect(verification.verifyMerkleLeaf(hexRoot, hexLeaf, hexProof)).to.not.be.reverted
      })
    })

    describe("When verifying all leaves in the tree", function() {
      /**
       * @type string[]
       */
      let sortedLeaves
      /**
       * @type string
       */
      let hexRoot

      beforeEach(function() {
        sortedLeaves = hashedData.sort(Buffer.compare).map(buf2hex)

        hexRoot = getMerkleRoot(sortedLeaves.map(x => x))
      })

      it("Should verify an array of hashed data, given the commitment is correct", async function() {
        const result = await verification.verifyMerkleAll(sortedLeaves, hexRoot)

        expect(result).to.be.true
      })

      it("Should not verify an array of hashed data, when the commitment is not correct", async function() {
        sortedLeaves[2] = sortedLeaves[3]

        const result = await verification.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.false
      })
      it("Should not revert when called", async function() {
        await expect(verification.verifyMerkleAll(sortedLeaves, hexRoot)).to.not.be.reverted
      })
    })
  })
})
