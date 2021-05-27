import { subtask, task } from "hardhat/config"
import type { HardhatRuntimeEnvironment } from "hardhat/types"
import { Blake2b, Blake2bAxic, Blake2bConsenSys, Keccak } from "../../types"

const data =
  "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f"

task("gasUsageHashing")
  .setDescription("Prints out the gas usage for each of hashing functions")
  .setAction(async (_, { run }) => {
    await run("keccak")
    await run("blake2b smart contract (consensys)")
    await run("blake2b precompile (axic)")
    await run("blake2b precompile (simplied)")
  })

subtask("keccak").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const factory = await hre.ethers.getContractFactory("Keccak")
  const contract = (await factory.deploy()) as Keccak
  await contract.deployed()

  console.log("keccak precompile:                    ", (await contract.estimateGas.hash(data)).toString())
})

subtask("blake2b smart contract (consensys)").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const factory = await hre.ethers.getContractFactory("Blake2bConsenSys")
  const contract = (await factory.deploy()) as Blake2bConsenSys
  await contract.deployed()

  console.log(
    "blake2b smart contract (consensys):  ",
    (await contract.estimateGas["blake2b(bytes,bytes,uint64)"](data, "0x", 64)).toString()
  )
})

subtask("blake2b precompile (axic)").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const factory = await hre.ethers.getContractFactory("Blake2bAxic")
  const contract = (await factory.deploy()) as Blake2bAxic
  await contract.deployed()

  const instance = await contract.init("0x", 64)
  const gasInit = await contract.estimateGas.init("0x", 64)
  const gasFinalize = await contract.estimateGas.finalize(instance, data, 128)

  console.log("blake2b precompile (axic):            ", gasInit.add(gasFinalize).toString())
})

subtask("blake2b precompile (simplied)").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  const factory = await hre.ethers.getContractFactory("Blake2b")
  const contract = (await factory.deploy()) as Blake2b
  await contract.deployed()

  console.log("blake2b precompile (simplied):        ", (await contract.estimateGas.hash(data)).toString())
})
