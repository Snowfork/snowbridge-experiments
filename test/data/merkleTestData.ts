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
  beefyValidatorAddresses: VerifierAddresses
  beefyMerkleTree: MerkleTree
}

const HASH_ALGORITHM = keccak
const MERKLE_OPTIONS_SORT = { sort: true }
const MERKLE_OPTIONS_NO_SORT = { sort: false }

const testFileName = "merkle-test-data.json"
const testFilePath = path.join(__dirname, testFileName)

const readTestData = (): Promise<TestFile> => fs.readJSON(testFilePath) as Promise<TestFile>

const beefyValidatorAddresses = [
  "0xE04CC55ebEE1cBCE552f250e85c57B70B2E2625b",
  "0x25451A4de12dcCc2D166922fA938E900fCc4ED24",
]

export default async (): Promise<MerkleTestData> => {
  // const { verifierPrivateKeys, verifierAddresses } = await readTestData();
  // const hashedLeaves = verifierAddresses.map(address => keccakFromHexString(address));
  // const merkleTree = new MerkleTree(hashedLeaves, HASH_ALGORITHM, MERKLE_OPTIONS_NO_SORT);
  const beefyHashedLeaves = beefyValidatorAddresses.map(address => keccakFromHexString(address))
  const beefyMerkleTree = new MerkleTree(beefyHashedLeaves, HASH_ALGORITHM, MERKLE_OPTIONS_NO_SORT)

  return {
    beefyValidatorAddresses,
    beefyMerkleTree,
  }
}

export function createMerkleTree(leavesHex: string[]): MerkleTree {
  const leavesHashed = leavesHex.map(leaf => keccakFromHexString(leaf))
  const merkleTree = new MerkleTree(leavesHashed, HASH_ALGORITHM, MERKLE_OPTIONS_NO_SORT)
  return merkleTree
}
