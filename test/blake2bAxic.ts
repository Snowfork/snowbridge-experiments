import { expect } from "chai"
import { ethers } from "hardhat"
import { Blake2bAxic } from "../types"
// import blake2TestVectors from "./blake2-kat.json"

describe("Blake2bAxic", function () {
  let blake2b: Blake2bAxic

  beforeEach(async function () {
    const blake2bFactory = await ethers.getContractFactory("Blake2bAxic")
    blake2b = (await blake2bFactory.deploy()) as Blake2bAxic
    await blake2b.deployed()
  })

  describe("constructor", function () {
    it("should deploy the contract successfully", async function () {
      expect(blake2b).to.haveOwnProperty("address")
    })
  })

  describe("hash", function () {
    it.skip("should work", async function () {
      // test vectors from https://github.com/BLAKE2/BLAKE2/tree/master/testvectors

      // expect(
      //   await blake2b.hash(
      //     "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f"
      //   )
      // ).to.equal("0xc7cb5d1a1a214f1d833a21fe6c7b2420e417c2f220784cbe90072975131bc367")
      // expect(await blake2b.hash("0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")).to.equal(
      //   "0xcb2f5160fc1f7e05a55ef49d340b48da2e5a78099d53393351cd579dd42503d6"
      // )
      // expect(await blake2b.hash("0x000102030405060708090a0b0c0d0e0f")).to.equal(
      //   "0xc7cb5d1a1a214f1d833a21fe6c7b2420e417c2f220784cbe90072975131bc367"
      // )

      const input =
        "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f"
      // const expected = "0xc3582f71ebb2be66fa5dd750f80baae97554f3b015663c8be377cfcb2488c1d1"
      const expected =
        "2319e3789c47e2daa5fe807f61bec2a1a6537fa03f19ff32e87eecbfd64b7e0e8ccff439ac333b040f19b0c4ddd11a61e24ac1fe0f10a039806c5dcc0da3d115"

      let instance = await blake2b.init("0x", 64)
      // await blake2b.update(instance, input, 128)
      expect(await blake2b.finalize(instance, input, 128)).to.equal(expected)
    })
  })
})
