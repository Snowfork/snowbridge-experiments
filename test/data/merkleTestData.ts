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
  beefyValidatorAddresses: VerifierAddresses,
  beefyMerkleTree: MerkleTree
}

const HASH_ALGORITHM = keccak
const MERKLE_OPTIONS_SORT = { sort: true }
const MERKLE_OPTIONS_NO_SORT = { sort: false }

const testFileName = "merkle-test-data.json"
const testFilePath = path.join(__dirname, testFileName)

const readTestData = (): Promise<TestFile> => fs.readJSON(testFilePath) as Promise<TestFile>

const beefyValidatorAddresses = [
  "0x04f60ddb75f85d93a92648b4acbc8ebc5354b3c2f56e1925af876c00ce286197",
  "0xac5c0df31a2e62d18259b755ec1ac54ad715811f2d717fbed1b20bc797cad88a"
];

export default async (): Promise<MerkleTestData> => {
  const { verifierPrivateKeys, verifierAddresses } = await readTestData();
  const hashedLeaves = verifierAddresses.map(address => keccakFromHexString(address));
  const merkleTree = new MerkleTree(hashedLeaves, HASH_ALGORITHM, MERKLE_OPTIONS_NO_SORT);
  const beefyHashedLeaves = beefyValidatorAddresses.map(address => keccakFromHexString(address));
  const beefyMerkleTree = new MerkleTree(beefyHashedLeaves, HASH_ALGORITHM, MERKLE_OPTIONS_NO_SORT);

  return {
    beefyValidatorAddresses,
    beefyMerkleTree
  }
}
