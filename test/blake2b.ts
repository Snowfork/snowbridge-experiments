import { expect } from "chai"
import { ethers } from "hardhat"
import { Blake2b } from "../types"
// import blake2TestVectors from "./blake2-kat.json"

describe("Blake2b", function () {
  let blake2b: Blake2b

  beforeEach(async function () {
    const blake2bFactory = await ethers.getContractFactory("Blake2b")
    blake2b = (await blake2bFactory.deploy()) as Blake2b
    await blake2b.deployed()
  })

  describe("constructor", function () {
    it("should deploy the contract successfully", async function () {
      expect(blake2b).to.haveOwnProperty("address")
    })
  })

  describe("countSetBitsNaive", function () {
    it("should work", async function () {
      // test vectors from https://github.com/BLAKE2/BLAKE2/tree/master/testvectors

      expect(await blake2b.hash("0x000102030405060708090a0b0c0d0e0f")).to.equal(
        "0xc7cb5d1a1a214f1d833a21fe6c7b2420e417c2f220784cbe90072975131bc367"
      )
    })
  })
})
