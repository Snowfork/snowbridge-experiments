import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers, waffle, artifacts } from "hardhat"
import { Bitfield } from "../types"

/**
 * Note: We can use Waffle's chai matchers here without explicitly
 * stating `chai.use(solidity)`
 */
describe.only("Bitfield Contract", function () {
  let bitfield: Bitfield

  beforeEach(async function () {
    const bitfieldFactory = await ethers.getContractFactory("Bitfield")
    bitfield = (await bitfieldFactory.deploy()) as Bitfield
    await bitfield.deployed()
  })

  describe("constructor", function () {
    it("Should deploy the contract successfully", async function () {
      expect(bitfield).to.haveOwnProperty("address")
    })
  })

  describe("newSignatureCommitment function", function () {
    it("Should work for different seeds and lengths", async function () {
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

  describe("bigNumberArrayToHex util", function () {
    it("works", function () {
      expect(bigNumberArrayToBin([BigNumber.from(1)])).to.equal(
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
          "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
          "0000000000000000000000000000000000000000000000000000000000000001"
      )
      expect(bigNumberArrayToBin([BigNumber.from(17)])).to.equal(
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
          "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
          "0000000000000000000000000000000000000000000000000000000000010001"
      )
    })
  })
})

function bigNumberArrayToBin(bns: BigNumber[]): string {
  return hexToBin(bigNumberArrayToHex(bns))
}

function bigNumberArrayToHex(bns: BigNumber[]): string {
  let hex = ""

  for (let bn of bns) {
    hex = bn.toHexString().replace("0x", "").padStart(64, "0") + hex
  }

  return hex
}

function hexToBin(hex: string): string {
  let bin = ""
  for (var c of hex) {
    switch (c) {
      case "0":
        bin += "0000"
        break
      case "1":
        bin += "0001"
        break
      case "2":
        bin += "0010"
        break
      case "3":
        bin += "0011"
        break
      case "4":
        bin += "0100"
        break
      case "5":
        bin += "0101"
        break
      case "6":
        bin += "0110"
        break
      case "7":
        bin += "0111"
        break
      case "8":
        bin += "1000"
        break
      case "9":
        bin += "1001"
        break
      case "a":
        bin += "1010"
        break
      case "b":
        bin += "1011"
        break
      case "c":
        bin += "1100"
        break
      case "d":
        bin += "1101"
        break
      case "e":
        bin += "1110"
        break
      case "f":
        bin += "1111"
        break
      default:
        return ""
    }
  }

  return bin
}
