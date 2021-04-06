/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "ethers"
import fs from "fs-extra"

const NUM_ADDRESSES = 167

type VerifierAddresses = string[]
type VerifierPrivateKeys = string[]

interface TestFile {
  verifierPrivateKeys: VerifierPrivateKeys
  verifierAddresses: VerifierAddresses
}

// String (hex) addresses
const privateKeys = []
const addresses = []

for (let i = 0; i < NUM_ADDRESSES; i++) {
  const randomWallet = ethers.Wallet.createRandom()
  privateKeys.push(randomWallet.privateKey)
  addresses.push(randomWallet.address)
}

const testData: TestFile = {
  verifierPrivateKeys: privateKeys,
  verifierAddresses: addresses,
}

export function createTestFile(_filename?: string) {
  if (!_filename) {
    const relative_dir = `${__dirname}/../../test/data`
    _filename = `${relative_dir}/merkle-test-data.json`
  }
  fs.outputJSONSync(_filename, testData)
}
