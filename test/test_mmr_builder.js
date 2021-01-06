const MMRBuilderWrapper = artifacts.require('MMRBuilderWrapper');
const MMRBuilder = artifacts.require('MMRBuilder');

const chai = require('chai');
chai.use(require('chai-bn')(web3.utils.BN));
chai.use(require('chai-as-promised'));
chai.should();

contract('MMRBuilder', async () => {
  let mmrLib;
  let res;

  before(async () => {
    mmrLib = await MMRBuilder.new();
    await MMRBuilderWrapper.link('MMRBuilder', mmrLib.address);
    console.log('MMR Tree : 5 |                             31');
    console.log('           4 |             15                                 30                                    46');
    console.log('           3 |      7             14                 22                 29                 38                 45');
    console.log('           2 |   3      6     10       13       18       21        25       28        34        37       41        44       49');
    console.log('           1 | 1  2   4  5   8  9    11  12   16  17    19  20   23  24    26  27   32  33    35  36   39  40    42  43   47  48    50');
  });

  context('Test pure functions', async () => {

    describe('getChildren()', async () => {
      it('should return 1,2 as children for 3', async () => {
        res = await mmrLib.getChildren(3);
        res.left.should.be.a.bignumber.that.equals('1');
        res.right.should.be.a.bignumber.that.equals('2');
      });
      it('should return 3,6 as children for 7', async () => {
        res = await mmrLib.getChildren(7);
        res.left.should.be.a.bignumber.that.equals('3');
        res.right.should.be.a.bignumber.that.equals('6');
      });
      it('should return 22,29 as children for 30', async () => {
        res = await mmrLib.getChildren(30);
        res.left.should.be.a.bignumber.that.equals('22');
        res.right.should.be.a.bignumber.that.equals('29');
      });
      it('should be reverted for leaves like 1,2,4', async () => {
        await mmrLib.getChildren(1).should.be.rejected;
        await mmrLib.getChildren(2).should.be.rejected;
        await mmrLib.getChildren(4).should.be.rejected;
      });
    });

    describe('getPeakIndexes()', async () => {
      it('should return [15, 22, 25] for a mmr which width is 14', async () => {
        res = await mmrLib.getPeakIndexes(14);
        res[0].should.be.a.bignumber.that.equals('15');
        res[1].should.be.a.bignumber.that.equals('22');
        res[2].should.be.a.bignumber.that.equals('25');
      });
      it('should return [3] for a mmr which width is 2', async () => {
        res = await mmrLib.getPeakIndexes(2);
        res[0].should.be.a.bignumber.that.equals('3');
      });
      it('should return [31, 46, 49, 50] for a mmr which width is 27', async () => {
        res = await mmrLib.getPeakIndexes(27);
        res[0].should.be.a.bignumber.that.equals('31');
        res[1].should.be.a.bignumber.that.equals('46');
        res[2].should.be.a.bignumber.that.equals('49');
        res[3].should.be.a.bignumber.that.equals('50');
      });
    });

    describe('hashBranch()', async () => {
      it('should return sha3(left,right)', async () => {
        let left = web3.utils.soliditySha3(1, '0x00'); // At 1
        let right = web3.utils.soliditySha3(2, '0x00'); // At 2
        res = await mmrLib.hashParent(left, right);
        res.should.equal(web3.utils.soliditySha3(left, right));
      });
    });

    describe('mountainHeight()', async () => {
      it('should return 3 for its highest peak when the size is less than 12 and greater than 4', async () => {
        for (let i = 5; i < 12; i++) {
          (await mmrLib.mountainHeight(i)).should.be.a.bignumber.that.equals('3');
        }
      });
      it('should return 4 for its highest peak when the size is less than 27 and greater than 11', async () => {
        for (let i = 12; i < 27; i++) {
          (await mmrLib.mountainHeight(i)).should.be.a.bignumber.that.equals('4');
        }
      });
    });

    describe('heightAt()', async () => {
      let firstFloor = [1, 2, 4, 5, 8, 9, 11, 12, 16, 17, 19, 20, 23, 24, 26, 27, 32, 33, 35, 36, 39, 40, 42, 43, 47, 48];
      let secondFloor = [3, 6, 10, 13, 18, 21, 25, 28, 34, 37, 41, 44, 49];
      let thirdFloor = [7, 14, 22, 29, 38, 45];
      let fourthFloor = [15, 30, 46];
      let fifthFloor = [31];
      it('should return 1 as the height of the index which belongs to the first floor', async () => {
        for (let index of firstFloor) {
          (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('1');
        }
      });
      it('should return 2 as the height of the index which belongs to the second floor', async () => {
        for (let index of secondFloor) {
          (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('2');
        }
      });
      it('should return 3 as the height of the index which belongs to the third floor', async () => {
        for (let index of thirdFloor) {
          (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('3');
        }
      });
      it('should return 4 as the height of the index which belongs to the fourth floor', async () => {
        for (let index of fourthFloor) {
          (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('4');
        }
      });
      it('should return 5 as the height of the index which belongs to the fifth floor', async () => {
        for (let index of fifthFloor) {
          (await mmrLib.heightAt(index)).should.be.a.bignumber.that.equals('5');
        }
      });
    });
  });

  describe('Merkle Proof Generation', async () => {
    describe('getMerkleProof()', async () => {
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

      it('should correctly generate merkle proofs', async () => {
        // Generate proof for the 5th element in the flat list; Solidity MMR starts at 1.
        let index = 5; // Leaf hash is "0xa4a7208a40e95acaf2fe1a3c675b1b5d8c341060e4f179b76ba79493582a95a6".

        let expectedRoot = "0x3db772cb24eebfdf945630499544625b79c152d820e3b6996714ac0a8cbeb2e9";
        let expectedWidth = '7';
        let expectedSiblings = [
          '0x2b97a4b75a93aa1ac8581fac0f7d4ab42406569409a737bdf9de584903b372c5',
          '0xfc5b56233029d71e7e9aff8e230ff491475dee2d8074b27d5fecf8f5154d7c8d'
        ]
        let expectedPeaks = [
          '0x1d37b1ee4db7470d98e135bd33fb23ce297ab6535043628dbccb9ecb64af4907',
          '0xe1c308ce661d3e6f5f8424ab903f77b257b3de11e34f9e99154c171bd9a0eb79',
          '0x291bd553ea938a33785762f076cbad142bde4a0caf55fbf122ac07d7489414ed'
        ]

        res = await mmr.getMerkleProof.call(index);

        res.root.should.be.equal(expectedRoot);
        res.width.should.be.a.bignumber.that.equals(expectedWidth);
        for(var i = 0; i < expectedSiblings.length; i++) {
          res.siblings[i].should.be.equal(expectedSiblings[i]);
        }
        for(var i = 0; i < expectedPeaks.length; i++) {
          res.peakBagging[i].should.be.equal(expectedPeaks[i]);
        }
      });
    });
  });
});
