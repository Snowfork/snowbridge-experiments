const { expect } = require("chai")
const { ethers } = require("hardhat")
const { MerkleTree } = require("merkletreejs")
const generateSampleData = require("../src/sampleData")
const { buf2hex, getMerkleRoot, keccak, hex2buf } = require("../src/utils")


describe("Verification contract", function() {
    let verification
    // let hashedData
    let hexData

    let leafValueBytes = [0, 128, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 36, 6, 0, 0, 0, 0, 0, 0, 0, 0];
    let leafHash = "0xc09d4a008a0f1ef37860bef33ec3088ccd94268c0bfba7ff1b3c2a1075b0eb92";
    let proof = {
        leafIndex: 5,
        leafCount: 7,
        items: [
            "0xe53ee36ba6c068b1a6cfef7862fed5005df55615e1c9fa6eeefe08329ac4b94b",
            "0x99af07747700389aba6e6cb0ee5d553fa1241688d9f96e48987bca1d7f275cbe",
            "0xaf3327deed0515c8d1902c9b5cd375942d42f388f3bfe3d1cd6e1b86f9cc456c",
        ]
    }

     // This occurs off-chain in the test

     // 1. should_verify (test): https://github.com/paritytech/substrate/commit/661bbc9a73107d144aaea80e4ed0e4b54a5b2a96#diff-bc8055a7324f264fb179940831634d3ea1812eef10b01728aecd9854f6e881f8R229
     // Takes self, leaf, and Hash

    // Generate MerkleProof using MMR size, proof items (hash/collect?)
    // p = mmr_lib.MerkleProof(self.mmr.mmr_size(), proof.items.into_iter().map(Node:Hash).collect())
    let p = proof;

    // Calculate leaf's position in the MMR
    // position = mmr_lib.leaf_index_to_pos(proof.leaf_index)
    let position =

    // Generate root
    // root = self.mmr.get_root()

    // Verify leaf
    // p.verify_leaf(root, [position, Node::Data(leaf))])

    context("Verify leaf", function() {
        beforeEach(async function() {
        const Verification = await ethers.getContractFactory("Verification")
        verification = await Verification.deploy()
        await verification.deployed()

        // const hashedData = [...generateSampleData(100)].map(x => keccak(x))
        hexData = proof.map(buf2hex)
        })

        it("Should verify an array of hashed data, given the commitment is correct", async function() {
        const commitment = proof.items.reduce((prev, curr) =>
            ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
        )
        console.log("commitment:", commitment)

        const result = await verification.verifyMessageArray(hexData, commitment)

        // expect(result).to.be.true
        })
    })
});
