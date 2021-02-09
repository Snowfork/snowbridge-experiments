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
  "0xd5E04779689068c916B04cB365ec3153755684d9",
  "0x4F13F0CCd982cB755A661969143c37CBc49Ef5B9"
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
