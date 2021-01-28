import { expect } from "chai"
import { ethers } from "hardhat"
import { Bitfield } from "../types"
import { bigNumberArrayToBin } from "./utils/binary"

describe("Bitfield contract", function () {
  let bitfield: Bitfield

  beforeEach(async function () {
    const bitfieldFactory = await ethers.getContractFactory("Bitfield")
    bitfield = (await bitfieldFactory.deploy()) as Bitfield
    await bitfield.deployed()
  })

  describe("constructor", function () {
    it("should deploy the contract successfully", async function () {
      expect(bitfield).to.haveOwnProperty("address")
    })
  })

  describe("randomNBits function", function () {
    it("should work for different seeds, lengths and bits to be set", async function () {
      const cases = [
        { seed: "0x00", length: 0, n: 0, result: "" },
        { seed: "0x00", length: 4, n: 2, result: "1100" },
        { seed: "0x00", length: 5, n: 2, result: "01100" },
        { seed: "0x00", length: 6, n: 2, result: "001001" },
        { seed: "0x00", length: 7, n: 2, result: "0001010" },
        { seed: "0x01", length: 7, n: 2, result: "0001100" },
        { seed: "0x02", length: 7, n: 2, result: "0010100" },
        { seed: "0x03", length: 7, n: 2, result: "0010100" },
        { seed: "0x04", length: 7, n: 2, result: "0010100" },
        { seed: "0x05", length: 7, n: 2, result: "0010100" },
        { seed: "0x06", length: 7, n: 2, result: "0010001" },
        { seed: "0x07", length: 7, n: 2, result: "0001001" },
        { seed: "0x08", length: 7, n: 2, result: "1001000" },
        { seed: "0x09", length: 7, n: 2, result: "1010000" },
        { seed: "0x0a", length: 7, n: 2, result: "0010001" },
        { seed: "0xcafebabe00", length: 31, n: 20, result: "1111011101001100001101101101111" },
        { seed: "0x00", length: 32, n: 4, result: "00001000010000000100000000001000" },
        { seed: "0x01", length: 32, n: 4, result: "00001000010000010100000000000000" },
        { seed: "0xcafebabe00", length: 33, n: 20, result: "011101111010100010110010110111101" },
        {
          seed: "0xcafebabe",
          length: 266,
          n: 20,
          result:
            "010000000000000000000000000000001000000100000000100000010000100000000000000000000000000000000000" +
            "000000000001000000000000000000000000000000010100010000001000001000000100010000000001000000000000" +
            "00010000000010000000000000000000001000010000000000000000000100000000000000",
        },
        {
          seed: "0xcafebabe",
          length: 1000,
          n: 100,
          result:
            "000000000000000100000000010000000010001000000000000000000000000000001010100001000001000000000100" +
            "001000010000001000000000000000001000000000000001000010000000010001000000000000100000010000000000" +
            "110000000001000000000000000001010000000000000000000000000000001000010000000000000000100110010000" +
            "000000000100100000100000000000000001000000000000001010000000000100000000000100000000000000000100" +
            "000000000001010001010000010101010000000000001000000000000000000001011000000000000100001101010000" +
            "110010000000000000000000000000000000000000000001000000000000010010000000000000000101000000000000" +
            "000001000000000000000000000000000010000000100000001000010000001000000000010000000000000000000000" +
            "000001000000100001000000000000100000000000000000100010001000010000000000110000000000000000000000" +
            "000000000000000000001000000000000000000000000100000000000000000000000000010100000000000000000000" +
            "100000000000000011000000100000000000010000000000010000000100000000100010000000000100000000000100" +
            "0000000000000100000000000100000000000001",
        },
      ]

      for (let c of cases) {
        const result = await bitfield.randomNBits(c.seed, c.length, c.n)
        const bin = bigNumberArrayToBin(result as any)
        const sliced = bin.slice(bin.length - c.length)
        expect(sliced).to.equal(c.result)
        expect(sliced.length).to.equal(c.length)
        expect(sliced.split("1").length - 1).to.equal(c.n)
      }
    })
  })
})
