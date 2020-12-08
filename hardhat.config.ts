import type { HardhatUserConfig } from "hardhat/config"

/**
 * Import Hardhat Plugins
 */
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-solhint"
import "hardhat-typechain"

/**
 * Import Custom Tasks
 */
import "./src/tasks/gasUsage.ts"

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
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
}

export default config
