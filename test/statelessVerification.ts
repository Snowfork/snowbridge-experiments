import { expect } from "chai"
import { ethers } from "hardhat"
import { MMRStatelessVerification } from "../types"

async function testFixture() {
    const mmrStatelessVerificationFactory = await ethers.getContractFactory("MMRStatelessVerification")
    const mmrStatelessVerificationContract = (await mmrStatelessVerificationFactory.deploy()) as MMRStatelessVerification
    await mmrStatelessVerificationContract.deployed()

    return { mmrStatelessVerificationContract }
}

describe("MMRStatelessVerification Contract", function () {
    context("constructor", function () {
      it("Should deploy the contract successfully", async function () {
        const { mmrStatelessVerificationContract } = await testFixture()

        expect(mmrStatelessVerificationContract).to.haveOwnProperty("address")
      })
    })

    context("Random data", function () {
        let mmrStatelessVerification: MMRStatelessVerification;

        beforeEach(async function () {
            const { mmrStatelessVerificationContract } = await testFixture()
            mmrStatelessVerification = mmrStatelessVerificationContract;
        })

        it('should verify parachain headers in MMR leaves (head first)', async function () {
            const paraHeadHash = ethers.utils.solidityKeccak256(["string"], ["parahead1"])
            const siblingParaHeadHash = ethers.utils.solidityKeccak256(["string"], ["parahead2"])
            const leafParaHeadRootHash = ethers.utils.solidityKeccak256(["bytes", "bytes"], [paraHeadHash, siblingParaHeadHash])

            expect(await mmrStatelessVerification.callStatic.verifyParachainHeaderInLeaf(paraHeadHash, siblingParaHeadHash, false, leafParaHeadRootHash)).to.be.true;
        })

        it('should verify parachain headers in MMR leaves (sibling first)', async function () {
            const paraHeadHash = ethers.utils.solidityKeccak256(["string"], ["parahead1"])
            const siblingParaHeadHash = ethers.utils.solidityKeccak256(["string"], ["parahead2"])
            const leafParaHeadRootHash = ethers.utils.solidityKeccak256(["bytes", "bytes"], [siblingParaHeadHash, paraHeadHash])

            expect(await mmrStatelessVerification.callStatic.verifyParachainHeaderInLeaf(paraHeadHash, siblingParaHeadHash, true, leafParaHeadRootHash)).to.be.true;
        })

        it('should verify leaves in MMR', async function () {
            const leaf = ethers.utils.solidityKeccak256(["string"], ["leaf1"]);
            const orderedBranch = [
                ethers.utils.solidityKeccak256(["string"], ["parent1"]),
                ethers.utils.solidityKeccak256(["string"], ["parent2"]),
                ethers.utils.solidityKeccak256(["string"], ["parent3"])
            ];

            // Calculate expected peak hash using leaf and ordered branch
            let currHash = leaf;
            for(var i = 0; i < orderedBranch.length; i++) {
                currHash = ethers.utils.solidityKeccak256(["bytes", "bytes"], [currHash, orderedBranch[i]]);
            }

            expect(await mmrStatelessVerification.callStatic.verifyLeafInMMR(leaf, orderedBranch, currHash)).to.be.true;
        })

        it('should verify that peak is in MMR', async function () {
            const peak = ethers.utils.formatBytes32String("peak1")


            const orderedPeaks = [
                peak,
                ethers.utils.solidityKeccak256(["string"], ["peak2"]),
                ethers.utils.solidityKeccak256(["string"], ["peak3"]),
                ethers.utils.solidityKeccak256(["string"], ["peak4"]),
                ethers.utils.solidityKeccak256(["string"], ["peak5"]),
                ethers.utils.solidityKeccak256(["string"], ["peak6"])
            ];

            // Calculate expected MMR root using ordered peaks
            let currHash: string = "";
            for(var i = 0; i < orderedPeaks.length; i++) {
                if(i == 0) {
                    currHash = orderedPeaks[i];
                } else {
                    currHash = ethers.utils.solidityKeccak256(["bytes", "bytes"], [currHash, orderedPeaks[i]])
                }
            }

            expect(await mmrStatelessVerification.callStatic.verifyPeakInMMR(peak, orderedPeaks, currHash)).to.be.true;
        });
    })
})
