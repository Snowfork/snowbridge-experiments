import { expect } from "chai"
import { keccak, keccakFromString } from "ethereumjs-util"
import { ethers } from "hardhat"
import { MerkleTree } from "merkletreejs"
import generateSampleData from "../src/utils/sampleData"
import { buf2hex, getMerkleRoot, hex2buf } from "../src/utils/utils"
import type { Verification } from "types"

async function testFixture(options: { leafCount: number }) {
  const VerificationFactory = await ethers.getContractFactory("Verification")
  const verificationContract = (await VerificationFactory.deploy()) as Verification
  await verificationContract.deployed()

  const hashedData = [...generateSampleData(options.leafCount)].map(x => keccakFromString(x))
  const hexData = hashedData.map(buf2hex)

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const sortedLeaves: string[] = hashedData.sort(Buffer.compare).map(buf2hex)
  const hexRoot: string = getMerkleRoot(sortedLeaves.map(x => x))

  return {
    verificationContract,
    hashedData,
    hexData,
    sortedLeaves,
    hexRoot,
  }
}

describe("Verification Contract", function () {
  let verification: Verification
  let hashedData: Buffer[]
  let hexData: string[]

  context("List Data Structure", function () {
    beforeEach(async function () {
      const Verification = await ethers.getContractFactory("Verification")
      verification = (await Verification.deploy()) as Verification
      await verification.deployed()

      const hashedData = [...generateSampleData(100)].map(x => keccakFromString(x))
      hexData = hashedData.map(buf2hex)
    })

    it("Should verify an array of hashed data, given the commitment is correct", async function () {
      const commitment = hexData.reduce((prev, curr) =>
        ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
      )

      const result = await verification.verifyMessageArray(hexData, commitment)

      expect(result).to.be.true
    })

    it("Should not verify an array of hashed data, when the commitment is not correct", async function () {
      const commitment = hexData.reduce((prev, curr) =>
        ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
      )

      const badData = ["s", "n", "O", "w", "f", "U", "n", "k"].map(x => keccakFromString(x)).map(buf2hex)

      const result = await verification.verifyMessageArray(badData, commitment)

      expect(result).to.be.false
    })
    it("Should not revert when called", async function () {
      const commitment = hexData.reduce((prev, curr) =>
        ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
      )

      await expect(verification.verifyMessageArray(hexData, commitment)).to.not.be.reverted
    })
  })

  context("Merkle Tree Data Structure", function () {
    beforeEach(async function () {
      const Verification = await ethers.getContractFactory("Verification")
      verification = (await Verification.deploy()) as Verification
      await verification.deployed()

      hashedData = [...generateSampleData(100)].map(x => keccakFromString(x))
      hexData = hashedData.map(buf2hex)
    })

    describe("When verifying a single leaf in the tree", function () {
      it("Should verify an array of hashed data, given the commitment is correct", async function () {
        const tree = new MerkleTree(hashedData, keccak, { sort: true })

        const root = tree.getRoot()
        const hexRoot = tree.getHexRoot()

        for (let i = 0; i < hashedData.length; i++) {
          const leaf = hashedData[i]
          const hexLeaf = MerkleTree.bufferToHex(leaf)

          const proof = tree.getProof(leaf)
          const hexProof = tree.getHexProof(leaf)

          const result = await verification.verifyMerkleLeaf(hexRoot, hexLeaf, hexProof)

          expect(tree.verify(proof, leaf, root)).to.be.true
          expect(result).to.be.true
        }
      })

      it("Should not verify an array of hashed data, when the commitment is not correct", async function () {
        const tree = new MerkleTree(hashedData, keccak, { sort: true })

        const root = tree.getRoot()
        const hexRoot = tree.getHexRoot()

        const correctLeaf = hashedData[0]
        const incorrectLeaf = keccakFromString("0")
        const incorrectLeafHex = MerkleTree.bufferToHex(incorrectLeaf)

        const proof = tree.getProof(correctLeaf)
        const hexProof = tree.getHexProof(correctLeaf)

        const result = await verification.verifyMerkleLeaf(hexRoot, incorrectLeafHex, hexProof)

        expect(tree.verify(proof, incorrectLeaf, root)).to.be.false
        expect(result).to.be.false
      })
      it("Should not revert when called", async function () {
        const tree = new MerkleTree(hexData, keccak, { sort: true })
        const hexRoot = tree.getHexRoot()
        const hexLeaf = hexData[0]
        const hexProof = tree.getHexProof(hex2buf(hexLeaf))

        await expect(verification.verifyMerkleLeaf(hexRoot, hexLeaf, hexProof)).to.not.be.reverted
      })
    })

    describe("When verifying all leaves in the tree", function () {
      it("Should verify a commitment correctly when the number of leaves is even", async function () {
        const { hexRoot, sortedLeaves, verificationContract } = await testFixture({
          leafCount: 100,
        })
        const result = await verificationContract.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.true
      })

      it("Should verify a commitment correctly when the number of leaves is odd", async function () {
        const { hexRoot, sortedLeaves, verificationContract } = await testFixture({
          leafCount: 5,
        })
        const result = await verificationContract.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.true
      })

      it("Should verify a commitment correctly with 1 leaf", async function () {
        const { hexRoot, sortedLeaves, verificationContract } = await testFixture({
          leafCount: 1,
        })
        const result = await verificationContract.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.true
      })

      it("Should verify a commitment correctly with 2 leaves", async function () {
        const { hexRoot, sortedLeaves, verificationContract } = await testFixture({
          leafCount: 2,
        })
        const result = await verificationContract.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.true
      })

      it("Should not verify an array of hashed data, when the commitment is not correct", async function () {
        const { hexRoot, sortedLeaves, verificationContract } = await testFixture({
          leafCount: 10,
        })
        sortedLeaves[2] = sortedLeaves[3]

        const result = await verificationContract.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.false
      })

    })
  })
})
