import { expect } from "chai"
import { keccak, keccakFromString } from "ethereumjs-util"
import { ethers } from "hardhat"
import { MerkleTree } from "merkletreejs"
import generateSampleData from "../src/utils/sampleData"
import { buf2hex, getMerkleRoot, hex2buf } from "../src/utils/utils"
import type { Verification } from "types"

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

      describe("verify merkle proof with position", async function () {
        const hashedData = [...generateSampleData(100)].map(x => keccakFromString(x))

        const cases = [
          // 1 leaf
          { data: hashedData.slice(0, 1), proofForLeaf: 0, verifyLeaf: 0, succeed: true },
          { data: hashedData.slice(0, 1), proofForLeaf: 0, verifyLeaf: 1, succeed: false },

          // 3 leaves
          { data: hashedData.slice(0, 3), proofForLeaf: 0, verifyLeaf: 0, succeed: true },
          { data: hashedData.slice(0, 3), proofForLeaf: 0, verifyLeaf: 1, succeed: false },
          { data: hashedData.slice(0, 3), proofForLeaf: 0, verifyLeaf: 2, succeed: false },
          { data: hashedData.slice(0, 3), proofForLeaf: 1, verifyLeaf: 0, succeed: false },
          { data: hashedData.slice(0, 3), proofForLeaf: 1, verifyLeaf: 1, succeed: true },
          { data: hashedData.slice(0, 3), proofForLeaf: 1, verifyLeaf: 2, succeed: false },
          { data: hashedData.slice(0, 3), proofForLeaf: 2, verifyLeaf: 0, succeed: false },
          { data: hashedData.slice(0, 3), proofForLeaf: 2, verifyLeaf: 1, succeed: false },
          { data: hashedData.slice(0, 3), proofForLeaf: 2, verifyLeaf: 2, succeed: true },
          { data: hashedData.slice(0, 3), proofForLeaf: 2, verifyLeaf: 3, succeed: false },

          // 5 leaves
          { data: hashedData.slice(0, 3), proofForLeaf: 2, verifyLeaf: 2, succeed: true },
          { data: hashedData.slice(0, 3), proofForLeaf: 2, verifyLeaf: 1, succeed: false },
          { data: hashedData.slice(0, 3), proofForLeaf: 2, verifyLeaf: 3, succeed: false },

          // 8 leaves
          { data: hashedData.slice(0, 8), proofForLeaf: 5, verifyLeaf: 5, succeed: true },
          { data: hashedData.slice(0, 8), proofForLeaf: 5, verifyLeaf: 4, succeed: false },
          { data: hashedData.slice(0, 8), proofForLeaf: 5, verifyLeaf: 6, succeed: false },

          // 9 leaves
          { data: hashedData.slice(0, 9), proofForLeaf: 5, verifyLeaf: 5, succeed: true },
          { data: hashedData.slice(0, 9), proofForLeaf: 5, verifyLeaf: 4, succeed: false },
          { data: hashedData.slice(0, 9), proofForLeaf: 5, verifyLeaf: 6, succeed: false },

          // 100 leaves
          { data: hashedData.slice(0, 100), proofForLeaf: 27, verifyLeaf: 27, succeed: true },
          { data: hashedData.slice(0, 100), proofForLeaf: 27, verifyLeaf: 26, succeed: false },
          { data: hashedData.slice(0, 100), proofForLeaf: 27, verifyLeaf: 28, succeed: false },
        ]

        for (const c of cases) {
          it(`Should ${c.succeed ? "succeed" : "fail"} for ${c.data.length} leaves with a proof for leaf at position ${
            c.proofForLeaf
          } and verifying leaf at position ${c.verifyLeaf}`, async function () {
            const tree = new MerkleTree(c.data, keccak, { sort: false })

            tree.print()

            const root = tree.getRoot()
            const hexRoot = tree.getHexRoot()

            const leaf = hashedData[c.proofForLeaf]
            const hexLeaf = MerkleTree.bufferToHex(leaf)

            const proof = tree.getProof(leaf, c.proofForLeaf).map(p => p.data) as Buffer[]
            const hexProof = tree.getHexProof(leaf)

            // console.log({
            //   proof: proof.map(p => p.toString('hex')),
            //   hexProof: hexProof,
            // })

            // expect(tree.verifyMultiProof(root, [c.proofForLeaf], [leaf], tree.getDepth(), proof)).to.be.true

            const result = await verification.verifyMerkleLeafAtPosition(
              hexRoot,
              hexLeaf,
              c.verifyLeaf,
              c.data.length,
              hexProof
            )
            expect(result).to.equal(c.succeed)
          })
        }
      })

      it("Test if correct hash, but wrong position", async function () {
        const tree = new MerkleTree(hashedData, keccak, { sort: false })

        const root = tree.getRoot()
        const hexRoot = tree.getHexRoot()

        const leaf = hashedData[5]
        const hexLeaf = MerkleTree.bufferToHex(leaf)

        const proof = tree.getProof(leaf, 5)
        const hexProof = tree.getHexProof(leaf)

        tree.print()

        expect(tree.verify(proof, leaf, root)).to.be.true

        const result = await verification.verifyMerkleLeafAtPosition(hexRoot, hexLeaf, 5, hashedData.length, hexProof)
        expect(result).to.be.true
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
      let sortedLeaves: string[]
      let hexRoot: string

      beforeEach(function () {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        sortedLeaves = hashedData.sort(Buffer.compare).map(buf2hex)

        hexRoot = getMerkleRoot(sortedLeaves.map(x => x))
      })

      xit("Should verify an array of hashed data, given the commitment is correct", async function () {
        const result = await verification.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.true
      })

      it("Should not verify an array of hashed data, when the commitment is not correct", async function () {
        sortedLeaves[2] = sortedLeaves[3]

        const result = await verification.verifyMerkleAll(sortedLeaves, hexRoot)
        expect(result).to.be.false
      })
      it("Should not revert when called", async function () {
        await expect(verification.verifyMerkleAll(sortedLeaves, hexRoot)).to.not.be.reverted
      })
    })
  })
})
