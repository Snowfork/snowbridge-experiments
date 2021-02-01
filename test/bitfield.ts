import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { Bitfield } from "../types"
import { bigNumberArrayToBin } from "./utils/binary"

describe.only("Bitfield contract", function () {
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

  describe("countSetBits", function () {
    it("should work", async function () {
      const data = [
        "107407916326275966301416378095022386746999676775490005593752458613659389917687",
        "56987781681525869283429827462903514011401242466396942482516802756059453173596",
        "9687566318488655556051684796669440507284418336359471895292002641619912980943",
        "3336869326598304521714326002746641428383893517220838406340128998778157",
      ]
      const result = await bitfield.countSetBits(data)
      expect(result).to.equal(667)
    })
  })

  describe("indexOfNthSetBit", function () {
    describe("cases", async function () {
      const cases = [
        { field: [BigNumber.from("2")], n: 1, index: 1 },
        { field: [BigNumber.from("10")], n: 2, index: 3 },
        { field: [BigNumber.from("1"), BigNumber.from("0")], n: 1, index: 0 },
        { field: [BigNumber.from("0"), BigNumber.from("1")], n: 1, index: 256 },
        {
          field: [BigNumber.from("0"), BigNumber.from("0"), BigNumber.from("0"), BigNumber.from("1")],
          n: 1,
          index: 768,
        },
        {
          field: [
            BigNumber.from("107407916326275966301416378095022386746999676775490005593752458613659389917687"),
            BigNumber.from("56987781681525869283429827462903514011401242466396942482516802756059453173596"),
            BigNumber.from("9687566318488655556051684796669440507284418336359471895292002641619912980943"),
            BigNumber.from("3336869326598304521714326002746641428383893517220838406340128998778157"),
          ],
          n: 10,
          index: 12,
        },
      ]

      for (let i = 0; i < cases.length; i++) {
        const c = cases[i]
        const bin = bigNumberArrayToBin(c.field)
        const field = c.field.map(f => f.toString())
        const n = c.n
        const index = c.index

        it(`case ${i}: n ${n}, index ${index}`, async function () {
          console.log({ field, bin, n, index })

          const result = await bitfield.indexOfNthSetBit(c.field, c.n)
          expect(result).to.equal(c.index)
        })
      }
    })
  })

  describe("randomNBits function", function () {
    it("should work for our expected numbers", async function () {
      const seed = "0xcafebabeb"
      const length = 1000
      const n = 667

      const gas = await bitfield.estimateGas.randomNBits(seed, length, n)

      const result = await bitfield.randomNBits(seed, length, n)

      const bin = bigNumberArrayToBin(result as any)
      const sliced = bin.slice(bin.length - length)

      console.log({ gas: gas.toString(), result: sliced })

      expect(sliced.length).to.equal(length)
      expect(sliced.split("1").length - 1).to.equal(n)
    })

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

  describe("randomNBitsFromPriorRejectionSampling function", function () {
    it("should work for our expected numbers", async function () {
      const prior = [
        "107407916326275966301416378095022386746999676775490005593752458613659389917687",
        "56987781681525869283429827462903514011401242466396942482516802756059453173596",
        "9687566318488655556051684796669440507284418336359471895292002641619912980943",
        "3336869326598304521714326002746641428383893517220838406340128998778157",
      ]

      const seed = "0xcafebabe"
      const n = 22

      const gas = await bitfield.estimateGas.randomNBitsFromPriorRejectionSampling(seed, prior, n)
      const result = await bitfield.randomNBitsFromPriorRejectionSampling(seed, prior, n)

      const bin = bigNumberArrayToBin(result as any)
      console.log({ gas: gas.toString(), result: bin })

      expect(bin.length).to.equal(1024)
      expect(bin.split("1").length - 1).to.equal(n)
    })
  })

  describe("randomNBitsFromPriorCounting function", function () {
    it("should work for our expected numbers", async function () {
      const prior = [
        "107407916326275966301416378095022386746999676775490005593752458613659389917687",
        "56987781681525869283429827462903514011401242466396942482516802756059453173596",
        "9687566318488655556051684796669440507284418336359471895292002641619912980943",
        "3336869326598304521714326002746641428383893517220838406340128998778157",
      ]

      const seed = "0xcafebabe"
      const n = 22

      const gas = await bitfield.estimateGas.randomNBitsFromPriorCounting(seed, prior, n)
      const result = await bitfield.randomNBitsFromPriorCounting(seed, prior, n)

      const bin = bigNumberArrayToBin(result as any)
      console.log({ gas: gas.toString(), result: bin })

      expect(bin.length).to.equal(1024)
      expect(bin.split("1").length - 1).to.equal(n)
    })
  })
})
