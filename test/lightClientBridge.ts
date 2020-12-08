import { expect } from "chai"
import { ethers } from "hardhat"
import type { LightClientBridge } from "../typechain"
import { keccak } from "ethereumjs-util"
import { buf2hex } from "../src/utils/utils"

/**
 * Note: We can use Waffle's chai matchers here without explicitly
 * stating `chai.use(solidity)`
 */
describe("LightClientBridge Contract", function () {
  let lightClientBridge: LightClientBridge

  beforeEach("Deploy the contract", async function () {
    const LightClientBridge = await ethers.getContractFactory("LightClientBridge")
    lightClientBridge = (await LightClientBridge.deploy()) as LightClientBridge
    await lightClientBridge.deployed()
  })

  context("newSignatureCommitment function", function () {
    it("Should not throw when submitting a valid newSignatureCommitment", async function () {
      const statement = buf2hex(keccak("test"))
      const validatorClaimsBitfield = 123
      const senderSignatureCommitment = "0x123123123123"
      const senderPublicKeyMerkleProof = ["s", "n", "o", "w", "f", "u", "n", "k"].map(x => keccak(x)).map(buf2hex)

      const result = await lightClientBridge.newSignatureCommitment(
        statement,
        validatorClaimsBitfield,
        senderSignatureCommitment,
        senderPublicKeyMerkleProof
      )

      expect(result).to.not.throw
    })
  })
  context("completeSignatureCommitment function", function () {
    it("Should not throw when calling completeSignatureCommitment after newSignatureCommitment", async function () {
      const statement = buf2hex(keccak("test"))
      const validatorClaimsBitfield = 123
      const senderSignatureCommitment = "0x123123123123"
      const senderPublicKeyMerkleProof = ["s", "n", "o", "w", "f", "u", "n", "k"].map(x => keccak(x)).map(buf2hex)

      expect(
        await lightClientBridge.newSignatureCommitment(
          statement,
          validatorClaimsBitfield,
          senderSignatureCommitment,
          senderPublicKeyMerkleProof
        )
      ).to.not.throw
    })
    it("Should throw when calling completeSignatureCommitment without newSignatureCommitment")
  })
})
