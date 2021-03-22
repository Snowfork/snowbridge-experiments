import { BigNumber } from "ethers"

export function bigNumberArrayToBin(bns: BigNumber[]): string {
  return hexToBin(bigNumberArrayToHex(bns))
}

export function bigNumberArrayToHex(bns: BigNumber[]): string {
  let hex = ""

  for (let bn of bns) {
    hex = bn.toHexString().replace("0x", "").padStart(64, "0") + hex
  }

  return hex
}

export function hexToBin(hex: string): string {
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
