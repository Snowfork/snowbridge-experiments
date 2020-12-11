import { ethers } from "hardhat"
import type { ValidatorRegistry } from "../typechain"

describe("ValidatorRegistry Contract", function () {
  let validatorRegistry: ValidatorRegistry

  beforeEach("Deploy the contract", async function () {
    const ValidatorRegistry = await ethers.getContractFactory("ValidatorRegistry")
    validatorRegistry = (await ValidatorRegistry.deploy()) as ValidatorRegistry
    await validatorRegistry.deployed()
  })

  context("registerValidator function", function () {
    it("Should not be payable")
  })

  context("unregisterValidator function", function () {
    it("Should not be payable")
  })

  context("checkValidatorInSet function", function () {
    it("Should not be payable")
  })
})
