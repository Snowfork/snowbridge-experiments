import { ethers, waffle, artifacts, network } from "hardhat"

export async function mineNBlocks(n: number) {
  // console.log(`currently on block ${await ethers.provider.getBlockNumber()}`)

  // mine 50 blocks
  for (let i = 0; i < n; i++) {
    // console.log(`going to block ${ethers.provider.blockNumber + i + 1}`)
    await network.provider.send("evm_mine")
  }

  // console.log(`currently on block ${await ethers.provider.getBlockNumber()}`)
}
