require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-solhint")

task("gasUsage", "Prints out the gas usage for each of the verification functions", async () => {
  const { MerkleTree } = require("merkletreejs")
  const { keccak, buf2hex, hex2buf, getMerkleRoot } = require("./src/utils")

  const Verification = await ethers.getContractFactory("Verification")
  const verificationContract = await Verification.deploy()

  const hexData = ["s", "n", "o", "w", "f", "o", "r", "k"].map(x => keccak(x)).map(buf2hex)

  const commitment = hexData.reduce((prev, curr) =>
    ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [prev, curr])
  )

  console.log("verifyMessageArray function:")
  console.log(
    "  ↪ Estimated gas usage: ",
    (await verificationContract.estimateGas.verifyMessageArray(hexData, commitment)).toString()
  )

  const tree = new MerkleTree(hexData, keccak, { sort: true })
  const hexRoot = tree.getHexRoot()
  const hexLeaf = hexData[0]
  const hexProof = tree.getHexProof(hex2buf(hexLeaf))

  console.log("verifyMerkleLeaf function:")
  console.log(
    "  ↪ Estimated gas usage: ",
    (await verificationContract.estimateGas.verifyMerkleLeaf(hexRoot, hexLeaf, hexProof)).toString()
  )

  const sortedLeaves = hexData
    .map(hex2buf)
    .sort(Buffer.compare)
    .map(buf2hex)
  const merkleRoot = getMerkleRoot(sortedLeaves)

  console.log("verifyMerkleAll function:")
  console.log(
    "  ↪ Estimated gas usage: ",
    (await verificationContract.estimateGas.verifyMerkleAll(sortedLeaves, merkleRoot)).toString()
  )
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
