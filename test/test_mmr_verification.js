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
  let res;

  before(async () => {
    mmrLib = await MMRBuilder.new();
    await MMRBuilderWrapper.link('MMRBuilder', mmrLib.address);

    mmrVerification = await MMRVerification.new();

    console.log('MMR Tree:');
    console.log('           3 |      7');
    console.log('           2 |   3      6     10');
    console.log('           1 | 1  2   4  5   8  9    11');
  });

  context('MMR verification', async () => {
    describe('inclusionProof()', async () => {
      let leafHashes = [
        '0xe8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c',
        '0xe37890bf230cf36ea140a5dbb9a561aa7ef84f8f995873db8386eba4a95c7bbe',
        '0x2b97a4b75a93aa1ac8581fac0f7d4ab42406569409a737bdf9de584903b372c5',
        '0xa4a7208a40e95acaf2fe1a3c675b1b5d8c341060e4f179b76ba79493582a95a6',
        '0x989a7025bda9312b19569d9e84e33a624e7fc007e54db23b6758d5f819647071',
        '0xd279eb4bf22b2aeded31e65a126516215a9d93f83e3e425fdcd1a05ab347e535',
        '0x291bd553ea938a33785762f076cbad142bde4a0caf55fbf122ac07d7489414ed'
      ];

      // MMR constructed from the above leaf hashes:
      // '0xe8e77626586f73b955364c7b4bbf0bb7f7685ebd40e852b164633a4acbd3244c', // 1  LEAF
      // '0xe37890bf230cf36ea140a5dbb9a561aa7ef84f8f995873db8386eba4a95c7bbe', // 2  LEAF
      // '0xfc5b56233029d71e7e9aff8e230ff491475dee2d8074b27d5fecf8f5154d7c8d', // 3  PARENT[1, 2]
      // '0x2b97a4b75a93aa1ac8581fac0f7d4ab42406569409a737bdf9de584903b372c5', // 4  LEAF
      // '0xa4a7208a40e95acaf2fe1a3c675b1b5d8c341060e4f179b76ba79493582a95a6', // 5  LEAF
      // '0x29cf7cb380e7c6b97f1b7c53689bffc5781d232b2f5cdf66a612fea5fae3c424', // 6  PARENT[4, 5]
      // '0x1d37b1ee4db7470d98e135bd33fb23ce297ab6535043628dbccb9ecb64af4907', // 7  PARENT[3, 6]
      // '0x989a7025bda9312b19569d9e84e33a624e7fc007e54db23b6758d5f819647071', // 8  LEAF
      // '0xd279eb4bf22b2aeded31e65a126516215a9d93f83e3e425fdcd1a05ab347e535', // 9  LEAF
      // '0xe1c308ce661d3e6f5f8424ab903f77b257b3de11e34f9e99154c171bd9a0eb79', // 10 PARENT[8, 9]
      // '0x291bd553ea938a33785762f076cbad142bde4a0caf55fbf122ac07d7489414ed'  // 11 LEAF

      before(async () => {
        mmr = await MMRBuilderWrapper.new();
        for (let i = 0; i < leafHashes.length; i++) {
          await mmr.append(leafHashes[i]);
        }
      });

      it('should return pass true when it receives a valid merkle proof', async () => {
        let index = 5;
        res = await mmr.getMerkleProof.call(index);

        // Prove item 5 from MMR flat list is a valid leaf in MMR
        let leafHashValue = "0xa4a7208a40e95acaf2fe1a3c675b1b5d8c341060e4f179b76ba79493582a95a6";

        await mmrVerification.inclusionProof(res.root, Number(res.width), index, leafHashValue, res.peakBagging, res.siblings).should.eventually.equal(true);
      });


      it('should revert when it receives an invalid merkle proof', async () => {
        let index = 5;
        res = await mmr.getMerkleProof(index);

        // Stored value is not 0x0123
        await mmrVerification.inclusionProof(res.root, res.width, index, '0x0123', res.peakBagging, res.siblings).should.be.rejected;
      });
    });
  });
});
