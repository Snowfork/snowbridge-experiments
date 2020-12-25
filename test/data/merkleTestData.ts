import fs from "fs-extra"
import path from "path"
import MerkleTree from "merkletreejs"
import { keccakFromHexString, keccak } from "ethereumjs-util"

type VerifierAddresses = string[]
type VerifierPrivateKeys = string[]

interface TestFile {
  verifierPrivateKeys: VerifierPrivateKeys
  verifierAddresses: VerifierAddresses
}

interface MerkleTestData {
  verifierPrivateKeys: VerifierPrivateKeys
  verifierAddresses: VerifierAddresses
  merkleTree: MerkleTree
}

const HASH_ALGORITHM = keccak
const MERKLE_OPTIONS = { sort: true }

const testFileName = "merkle-test-data.json"
const testFilePath = path.join(__dirname, testFileName)

const readTestData = (): Promise<TestFile> => fs.readJSON(testFilePath) as Promise<TestFile>

export default async (): Promise<MerkleTestData> => {
  const { verifierPrivateKeys, verifierAddresses } = await readTestData()
  const hashedLeaves = verifierAddresses.map(address => keccakFromHexString(address))
  const merkleTree = new MerkleTree(hashedLeaves, HASH_ALGORITHM, MERKLE_OPTIONS)

  return {
    verifierPrivateKeys,
    verifierAddresses,
    merkleTree,
  }
}
