require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-solhint")

task("gasUsage", "Prints out the gas usage for each of the verification functions", async () => {
  const { MerkleTree } = require("merkletreejs")
  const { keccak, buf2hex, hex2buf, getMerkleRoot } = require("./src/utils")
  const generateSampleData = require("./src/sampleData")

  const dataLengths = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]
  const dataObjs = dataLengths.map(d => {
    return { length: d, data: [...generateSampleData(d)].map(b => keccak(b)).map(buf2hex) }
  })

  const Verification = await ethers.getContractFactory("Verification")
  const verificationContract = await Verification.deploy()

  console.log("verifyMessageArray function:")
  for (let i = 0; i < dataObjs.length; i++) {
    const element = dataObjs[i]
    const commitment = element.data.reduce((prev, curr) =>
      ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
    )
    console.log(
      `  ↪ Data length ${element.length}: `,
      (await verificationContract.estimateGas.verifyMessageArray(element.data, commitment)).toString()
    )
  }

  console.log("verifyMerkleLeaf function:")
  for (let i = 0; i < dataObjs.length; i++) {
    const element = dataObjs[i]
    const tree = new MerkleTree(element.data, keccak, { sort: true })
    const hexRoot = tree.getHexRoot()
    const hexLeaf = element.data[0]
    const hexProof = tree.getHexProof(hex2buf(hexLeaf))
    console.log(
      `  ↪ Data length ${element.length}: `,
      (await verificationContract.estimateGas.verifyMerkleLeaf(hexRoot, hexLeaf, hexProof)).toString()
    )
  }

  console.log("verifyMerkleAll function:")
  for (let i = 0; i < dataObjs.length; i++) {
    const element = dataObjs[i]
    const sortedLeaves = element.data
      .map(hex2buf)
      .sort(Buffer.compare)
      .map(buf2hex)
    const merkleRoot = getMerkleRoot(sortedLeaves)

    console.log(
      `  ↪ Data length ${element.length}: `,
      (await verificationContract.estimateGas.verifyMerkleAll(sortedLeaves, merkleRoot)).toString()
    )
  }
})

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.4",
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },
}
