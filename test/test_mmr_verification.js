const MMRVerification = artifacts.require('MMRVerification');
const MMRBuilderWrapper = artifacts.require('MMRBuilderWrapper');
const MMRBuilder = artifacts.require('MMRBuilder');

const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN));
chai.use(require('chai-as-promised'));
chai.should();

contract('MMRVerification', async () => {
  let mmrLib;
  let mmrVerification;

  before(async () => {
    mmrLib = await MMRBuilder.new();
    await MMRBuilderWrapper.link('MMRBuilder', mmrLib.address);

    mmrVerification = await MMRVerification.new();
  });

  context('inclusion proofs', async () => {
    describe('7-leaf, 11-node MMR', async () => {

      console.log('                 7-leaf MMR:           ');
      console.log('                                       ');
      console.log('    Height 3 |      7');
      console.log('    Height 2 |   3      6     10');
      console.log('    Height 1 | 1  2   4  5   8  9    11');
      console.log('             | |--|---|--|---|--|-----|-');
      console.log('Leaf indexes | 0  1   2  3   4  5     6');

      // Test cases are based on a 7-leaf MMR tree node:
      //  - For leaf nodes, node hash is the SCALE-encoding of the leaf data.
      //  - For parent nodes, node hash is the hash of it's children (left, right).
      //
      // 0xda5e6d0616e05c6a6348605a37ca33493fc1a15ad1e6a405ee05c17843fdafed // 1  LEAF NODE
      // 0xff5d891b28463a3440e1b650984685efdf260e482cb3807d53c49090841e755f // 2  LEAF NODE
      // 0xbc54778fab79f586f007bd408dca2c4aa07959b27d1f2c8f4f2549d1fcfac8f8 // 3  PARENT[1, 2] NODE
      // 0x7a84d84807ce4bbff8fb84667edf82aff5f2c5eb62e835f32093ee19a43c2de7 // 4  LEAF NODE
      // 0x27d8f4221cd6f7fc141ea20844c92aa8f647ac520853fbded619a46b1146ab8a // 5  LEAF NODE
      // 0x00b0046bd2d63fcb760cf50a262448bb2bbf9a264b0b0950d8744044edf00dc3 // 6  PARENT[4, 5] NODE
      // 0xe53ee36ba6c068b1a6cfef7862fed5005df55615e1c9fa6eeefe08329ac4b94b // 7  PARENT[3, 6] NODE
      // 0x99af07747700389aba6e6cb0ee5d553fa1241688d9f96e48987bca1d7f275cbe // 8  LEAF NODE
      // 0xc09d4a008a0f1ef37860bef33ec3088ccd94268c0bfba7ff1b3c2a1075b0eb92 // 9  LEAF NODE
      // 0xdad09f50b41822fc5ecadc25b08c3a61531d4d60e962a5aa0b6998fad5c37c5e // 10 PARENT[8, 9] NODE
      // 0xaf3327deed0515c8d1902c9b5cd375942d42f388f3bfe3d1cd6e1b86f9cc456c // 11 LEAF NODE

      it('should verify valid proof for leaf index 0 (node 1)', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0xda5e6d0616e05c6a6348605a37ca33493fc1a15ad1e6a405ee05c17843fdafed"
        let proof = {
          leaf_index: 0,
          leaf_count: 7,
          items: [
            "0xff5d891b28463a3440e1b650984685efdf260e482cb3807d53c49090841e755f",
            "0x00b0046bd2d63fcb760cf50a262448bb2bbf9a264b0b0950d8744044edf00dc3",
            "0x16de0900b57bf359a0733674ebfbba0f494e95a8391b4bfeae850019399f3ec0"
          ]
        }

        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(true);;
      });

      it('should verify valid proof for leaf index 1 (node 2)', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0xff5d891b28463a3440e1b650984685efdf260e482cb3807d53c49090841e755f"
        let proof = {
          leaf_index: 1,
          leaf_count: 7,
          items: [
            "0xda5e6d0616e05c6a6348605a37ca33493fc1a15ad1e6a405ee05c17843fdafed", // node 1
            "0x00b0046bd2d63fcb760cf50a262448bb2bbf9a264b0b0950d8744044edf00dc3", // node 6
            "0x16de0900b57bf359a0733674ebfbba0f494e95a8391b4bfeae850019399f3ec0"  // hash(node 11, node 10)
          ]
        }

        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(true);;
      });

      it('should verify valid proof for leaf index 2 (node 4)', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0x7a84d84807ce4bbff8fb84667edf82aff5f2c5eb62e835f32093ee19a43c2de7"
        let proof = {
          leaf_index: 2,
          leaf_count: 7,
          items: [
            "0x27d8f4221cd6f7fc141ea20844c92aa8f647ac520853fbded619a46b1146ab8a",
            "0xbc54778fab79f586f007bd408dca2c4aa07959b27d1f2c8f4f2549d1fcfac8f8",
            "0x16de0900b57bf359a0733674ebfbba0f494e95a8391b4bfeae850019399f3ec0"
          ]
        }

        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(true);;
      });

      it('should verify valid proof for leaf index 3 (node 5)', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0x27d8f4221cd6f7fc141ea20844c92aa8f647ac520853fbded619a46b1146ab8a"
        let proof = {
          leaf_index: 3,
          leaf_count: 7,
          items: [
            "0x7a84d84807ce4bbff8fb84667edf82aff5f2c5eb62e835f32093ee19a43c2de7",
            "0xbc54778fab79f586f007bd408dca2c4aa07959b27d1f2c8f4f2549d1fcfac8f8",
            "0x16de0900b57bf359a0733674ebfbba0f494e95a8391b4bfeae850019399f3ec0"
          ]
        }

        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(true);;
      });

      it('should verify valid proof for leaf index 4 (node 8)', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0x99af07747700389aba6e6cb0ee5d553fa1241688d9f96e48987bca1d7f275cbe"
        let proof = {
          leaf_index: 4,
          leaf_count: 7,
          items: [
            "0xe53ee36ba6c068b1a6cfef7862fed5005df55615e1c9fa6eeefe08329ac4b94b",
            "0xc09d4a008a0f1ef37860bef33ec3088ccd94268c0bfba7ff1b3c2a1075b0eb92",
            "0xaf3327deed0515c8d1902c9b5cd375942d42f388f3bfe3d1cd6e1b86f9cc456c"
          ]
        }

        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(true);;
      });

      it('should verify valid proof for leaf index 5 (node 9)', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0xc09d4a008a0f1ef37860bef33ec3088ccd94268c0bfba7ff1b3c2a1075b0eb92"
        let proof = {
          leaf_index: 5,
          leaf_count: 7,
          items: [
            "0xe53ee36ba6c068b1a6cfef7862fed5005df55615e1c9fa6eeefe08329ac4b94b",
            "0x99af07747700389aba6e6cb0ee5d553fa1241688d9f96e48987bca1d7f275cbe",
            "0xaf3327deed0515c8d1902c9b5cd375942d42f388f3bfe3d1cd6e1b86f9cc456c"
          ]
        }

        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(true);;
      });

      it('should verify valid proof for leaf index 6 (node 11)', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0xaf3327deed0515c8d1902c9b5cd375942d42f388f3bfe3d1cd6e1b86f9cc456c"
        let proof = {
          leaf_index: 6,
          leaf_count: 7,
          items: [
            "0xe53ee36ba6c068b1a6cfef7862fed5005df55615e1c9fa6eeefe08329ac4b94b",
            "0xdad09f50b41822fc5ecadc25b08c3a61531d4d60e962a5aa0b6998fad5c37c5e"
          ]
        }

        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(true);;
      });

      it('should not verify invalid proofs', async () => {
        let root = "0xfc4f9042bd2f73feb26f3fc42db834c5f1943fa20070ddf106c486a478a0d561";
        let leafNodeHash = "0x0000000000000000000000000000000000000000000000000000000000123456"
        let proof = {
          leaf_index: 5,
          leaf_count: 7,
          items: [
            "0xe53ee36ba6c068b1a6cfef7862fed5005df55615e1c9fa6eeefe08329ac4b94b",
            "0x99af07747700389aba6e6cb0ee5d553fa1241688d9f96e48987bca1d7f275cbe",
            "0xaf3327deed0515c8d1902c9b5cd375942d42f388f3bfe3d1cd6e1b86f9cc456c"
          ]
        }

        // Stored value is not 0x000123
        await mmrVerification.verifyInclusionProof.call(root, leafNodeHash, proof.leaf_index, proof.leaf_count, proof.items).should.eventually.equal(false);;
      });
    });
  });

});
