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

  describe("hash", function () {
    it.only("should work", async function () {
      // test vectors from https://github.com/BLAKE2/BLAKE2/tree/master/testvectors

      // expect(
      //   await blake2b.hash(
      //     "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f"
      //   )
      // ).to.equal("0xc7cb5d1a1a214f1d833a21fe6c7b2420e417c2f220784cbe90072975131bc367")
      expect(await blake2b.hash("0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")).to.equal(
        "0xcb2f5160fc1f7e05a55ef49d340b48da2e5a78099d53393351cd579dd42503d6"
      )
      expect(await blake2b.hash("0x000102030405060708090a0b0c0d0e0f")).to.equal(
        "0xc7cb5d1a1a214f1d833a21fe6c7b2420e417c2f220784cbe90072975131bc367"
      )
    })
  })

  describe("bytesToBytes32", function () {
    it("should work", async function () {
      expect(await blake2b.bytesToBytes32("0x00")).to.eql(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      )
      expect(await blake2b.bytesToBytes32("0x1234")).to.eql(
        "0x0000000000000000000000000000000000000000000000000000000000001234"
      )
      expect(await blake2b.bytesToBytes32("0x12345678901234567890123456789012abcdefabcdefabcdefabcdefabcdefab")).to.eql(
        "0x12345678901234567890123456789012abcdefabcdefabcdefabcdefabcdefab"
      )
      expect(
        await blake2b.bytesToBytes32("0x12345678901234567890123456789012abcdefabcdefabcdefabcdefabcdefabff")
      ).to.eql("0x12345678901234567890123456789012abcdefabcdefabcdefabcdefabcdefab")
    })
  })

  describe("uintTo2Bytes8", function () {
    it("should work", async function () {
      expect(await blake2b.uintTo2Bytes8("0x00")).to.eql(["0x0000000000000000", "0x0000000000000000"])
      expect(await blake2b.uintTo2Bytes8("0x1234")).to.eql(["0x0000000000000000", "0x0000000000001234"])
      expect(await blake2b.uintTo2Bytes8("0x12345678901234567890123456789012")).to.eql([
        "0x1234567890123456",
        "0x7890123456789012",
      ])
      expect(await blake2b.uintTo2Bytes8("0x12345678901234567890123456789012abcdefabcdefabcdefabcdefabcdefab")).to.eql([
        "0xabcdefabcdefabcd",
        "0xefabcdefabcdefab",
      ])
    })
  })
})
