const Verification = artifacts.require("Verification");

const BigNumber = web3.BigNumber;

require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

  contract("Verification", function (accounts) {

    describe("list", function () {
        beforeEach(async function () {
            this.verification = await Verification.new();

            this.data1 = web3.utils.asciiToHex("random1").padEnd(66, '0');
            this.data2 = web3.utils.asciiToHex("random2").padEnd(66, '0');
            this.data3 = web3.utils.asciiToHex("random3").padEnd(66, '0');
            this.data4 = web3.utils.asciiToHex("random4").padEnd(66, '0');
            this.data5 = web3.utils.asciiToHex("random5").padEnd(66, '0');
            this.data = [this.data1, this.data2, this.data3, this.data4, this.data5];
        });

        it("should verify commitments against data set", async function () {
            let commitment = "";
            for(var i = 0; i < this.data.length; i++) {
                commitment = web3.utils.soliditySha3(commitment, this.data[i]);
            }

            const verified = await this.verification.verifyDataA.call(this.data, commitment);
            verified.should.be.equal(true);
        });


        it("should get expected verification gas expenditures", async function () {
            // justUpdate is a function call which just updates a storage variable.
            // It is used as a control group to establish transaction gas costs
            // unrelated to verification.
            const result1 = await this.verification.justUpdate();
            const gasCost1 = Number(result1.receipt.gasUsed);

            let commitment = ""; web3.utils.soliditySha3(this.data1, this.data2);
            for(var i = 0; i < this.data.length; i++) {
                commitment = web3.utils.soliditySha3(commitment, this.data[i]);
            }

            const result2 = await this.verification.verifyDataA(this.data, commitment);
            const gasCost2 = Number(result2.receipt.gasUsed);
            console.log("Verification cost:", gasCost2 - gasCost1);
        });
    });

    describe("merkle tree", function () {
        beforeEach(async function () {
            this.verification = await Verification.new();

            this.data1 = web3.utils.asciiToHex("random1").padEnd(66, '0');
            this.data2 = web3.utils.asciiToHex("random2").padEnd(66, '0');
            this.data3 = web3.utils.asciiToHex("random3").padEnd(66, '0');
            this.data4 = web3.utils.asciiToHex("random4").padEnd(66, '0');
            this.data5 = web3.utils.asciiToHex("random5").padEnd(66, '0');
            this.data = [this.data1, this.data2, this.data3, this.data4, this.data5];
        });

        it("should verify commitments against data set", async function () {
            let commitment = "";
            for(var i = 0; i < this.data.length; i++) {
                commitment = web3.utils.soliditySha3(commitment, this.data[i]);
            }

            const verified = await this.verification.verifyDataB.call(this.data, commitment);
            verified.should.be.equal(true);
        });

        it("should get expected verification gas expenditures", async function () {
            let commitment = "";
            for(var i = 0; i < this.data.length; i++) {
                commitment = web3.utils.soliditySha3(commitment, this.data[i]);
            }

            const result = await this.verification.verifyDataB(this.data, commitment);
            const gasCost = Number(result.receipt.gasUsed);
            console.log("Verification cost:", gasCost);
        });
    });
});
