import type { HardhatUserConfig } from "hardhat/config"

/**
 * Import Hardhat Plugins
 */
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-solhint"
import "hardhat-typechain"
import "hardhat-watcher"

/**
 * Import Custom Tasks
 */
import "./src/tasks/gasUsageHashing"
import "./src/tasks/gasUsageMerkleProof"

/**
 * Import private keys from file (for test purposes)
 */
import path from "path"
import fs from "fs-extra"

const testFileName = "test/data/merkle-test-data.json"
const testFilePath = path.join(__dirname, testFileName)
const privateKeys = fs.readJSONSync(testFilePath).verifierPrivateKeys

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.7.5",
    settings: {
      optimizer: {
        enabled: false,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {
      blockGasLimit: 9500000,
      gas: 9500000,
      accounts: [{ balance: "999999999999999999999999999999999999999999999999999999999", privateKey: privateKeys[0] }],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
  watcher: {
    compile: {
      tasks: ["clean", "compile"],
      files: ["./contracts"],
      verbose: false,
    },
  },
}

export default config
