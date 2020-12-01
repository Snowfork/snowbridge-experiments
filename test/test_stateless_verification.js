const MMRStatelessVerification = artifacts.require("MMRStatelessVerification");

const BigNumber = web3.BigNumber;

require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

  contract("MMRStatelessVerification", function () {

    describe("Random data", function () {
        beforeEach(async function () {
            this.statelessVerification = await MMRStatelessVerification.new();
        });

        it("should verify parachain headers in MMR leaves (head first)", async function () {
            const paraHeadHash = web3.utils.soliditySha3("parahead1");
            const siblingParaHeadHash = web3.utils.soliditySha3("parahead2");
            const leafParaHeadRootHash = web3.utils.soliditySha3(paraHeadHash, siblingParaHeadHash);

            const verified = await this.statelessVerification.verifyParachainHeaderInLeaf.call(paraHeadHash, siblingParaHeadHash, false, leafParaHeadRootHash);
            verified.should.be.equal(true);
        });

        it("should verify parachain headers in MMR leaves (sibling first)", async function () {
            const paraHeadHash = web3.utils.soliditySha3("parahead1");
            const siblingParaHeadHash = web3.utils.soliditySha3("parahead2");
            const leafParaHeadRootHash = web3.utils.soliditySha3(siblingParaHeadHash, paraHeadHash);

            const verified = await this.statelessVerification.verifyParachainHeaderInLeaf.call(paraHeadHash, siblingParaHeadHash, true, leafParaHeadRootHash);
            verified.should.be.equal(true);
        });

        it("should verify leaves in MMR", async function () {
            const leaf = web3.utils.soliditySha3("leaf1");
            const orderedBranch = [
                web3.utils.soliditySha3("parent1"),
                web3.utils.soliditySha3("parent2"),
                web3.utils.soliditySha3("parent3")
            ];

            // Calculate expected peak hash using leaf and ordered branch
            let currHash = leaf;
            for(var i = 0; i < orderedBranch.length; i++) {
                currHash = web3.utils.soliditySha3(currHash, orderedBranch[i]);
            }

            const verified = await this.statelessVerification.verifyLeafInMMR.call(leaf, orderedBranch, currHash);
            verified.should.be.equal(true);
        });

        it("should verify that peak is in MMR", async function () {
            const peak = web3.utils.asciiToHex("peak1").padEnd(66, '0');
            const orderedPeaks = [
                peak,
                web3.utils.soliditySha3("peak2"),
                web3.utils.soliditySha3("peak3"),
                web3.utils.soliditySha3("peak4"),
                web3.utils.soliditySha3("peak5"),
                web3.utils.soliditySha3("peak6")
            ];

            // Calculate expected MMR root using ordered peaks
            let currHash;
            for(var i = 0; i < orderedPeaks.length; i++) {
                if(i == 0) {
                    currHash = orderedPeaks[i];
                } else {
                    currHash = web3.utils.soliditySha3(currHash, orderedPeaks[i]);
                }
            }

            const verified = await this.statelessVerification.verifyPeakInMMR.call(peak, orderedPeaks, currHash);
            verified.should.be.equal(true);
        });
    });

    // describe("Generated MMR data", function () {
    //     beforeEach(async function () {
    //         this.statelessVerification = await MMRStatelessVerification.new();

    //         // Data generated using https://github.com/Snowfork/polkadot-ethereum/pull/160
    //         this.leaf1 = web3.utils.fromAscii("303a496a0d323ffe231f4c39a9481b2b080f395746cda6bc4244ccc32c02d8b7");
    //         this.leaf2 = web3.utils.fromAscii("a0b07bc72f4d6f5526d6f80ded29c37a6d3b84dcf495614d08a510466298e0c2");
    //         this.leaf3 = web3.utils.fromAscii("07dfd09f370dab083c208346553303ab24f9edb78cbd2be2918698f29146a050");
    //         this.leaf4 = web3.utils.fromAscii("37ebb290735e083c57e30a869e9662b39f169f3ed144227e17f62a63143b4e52");
    //         this.mmrPeak = web3.utils.fromAscii("e7ac29893d79b03a15cf6e8544641b4f8eb1468be2a94d033d7257c9792837d0");
    //     });
    // });
});
