// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

import "hardhat/console.sol";


// EIP: https://eips.ethereum.org/EIPS/eip-152

// blake2b on substrate uses no key, and length of 32 bytes, see https://github.com/paritytech/substrate/blob/master/primitives/core/src/hashing.rs#L42
// the underlying implementation uses the following data: https://docs.rs/blake2-rfc/0.2.18/src/blake2_rfc/blake2.rs.html#107

contract Blake2b {
    // length of the hash in bytes
    uint nn = 64;

    // length of each data block in bytes
    uint bb = 128;

    // 12 rounds for blake2b, see https://datatracker.ietf.org/doc/html/rfc7693#section-3.2
    uint32 rounds = 12;

    function f(
        uint32 r,
        bytes32[2] memory h,
        bytes32[4] memory m,
        bytes8[2] memory t,
        bool last
    ) public view returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(r, h[0], h[1], m[0], m[1], m[2], m[3], t[0], t[1], last);

        assembly {
            if iszero(staticcall(not(0), 0x09, add(args, 32), 0xd5, output, 0x40)) {
                revert(0, 0)
            }
        }

        return output;
    }

    // from https://datatracker.ietf.org/doc/html/rfc7693#section-3.3
    // Does not support a key
    function hash(bytes calldata m) public view returns (bytes32) {
        // length of the message in bytes
        uint ll = m.length;

        // number of data blocks
        // ceil to message length / 16, but use 1 in the case that message length is 0
        uint dd = 1 + ((ll - 1) / bb);

        // initialization vector/IV
        bytes32[2] memory h;

        // offset
        bytes8[2] memory t;

        // create a new hashing context
        h[0] = hex"6a09e667f3bcc908bb67ae8584caa73b3c6ef372fe94f82ba54ff53a5f1d36f1";
        h[1] = hex"510e527fade682d19b05688c2b3e6c1f1f83d9abfb41bd6b5be0cd19137e2179";

        // from blakejs
        // h[0] = hex"f3bcc9086a09e66784caa73bbb67ae85fe94f82b3c6ef3725f1d36f1a54ff53a";
        // h[1] = hex"ade682d1510e527f2b3e6c1f9b05688cfb41bd6b1f83d9ab137e21795be0cd19";

        // The above might be wrong? According to https://github.com/axic/blake2-solidity/blob/master/contracts/Blake2b.sol#L58, it should be:
        // instance.state = hex"0000000c08c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        // h[0] = hex"08c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5";
        // h[1] = hex"d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b";
        // 0x0101000000000020000000000000000000000000000000000000000000000000


        // console.logBytes32(h[0]);

        h[0] = h[0] ^ bytes32(hex"01010000") ^ (bytes32(nn) << (8*28));

        // from https://eips.ethereum.org/EIPS/eip-152
        h[0] = hex"48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5";
        h[1] = hex"d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b";

        // console.logBytes32(bytes32(hex"01010000") ^ (bytes32(nn) << (8*28)));
        // console.logBytes32(h[0]);

        // TODO transform above into static constants

        // chunks of data, having a total length of bb bytes (4 * 32 / 8 )
        bytes32[4] memory chunk;

        // console.logBytes(m);

        uint i = 0;

        for (; i < dd - 1; i++) {
            uint j = i*128;
            chunk[0] = bytesToBytes32(bytes(m[j:]));
            // console.logBytes32(chunk[0]);
            chunk[1] = bytesToBytes32(bytes(m[j+32:]));
            // console.logBytes32(chunk[1]);
            chunk[2] = bytesToBytes32(bytes(m[j+64:]));
            // console.logBytes32(chunk[2]);
            chunk[3] = bytesToBytes32(bytes(m[j+96:]));
            // console.logBytes32(chunk[3]);
            t = uintTo2Bytes8((i + 1) * bb);
            h = f(rounds, h, chunk, t, false);
        }

        uint j = i*128;

        if (ll - j > 96) {
            chunk[0] = bytesToBytes32(bytes(m[j:]));
            chunk[1] = bytesToBytes32(bytes(m[j+32:]));
            chunk[2] = bytesToBytes32(bytes(m[j+64:]));
            chunk[3] = bytesToBytes32(bytes(m[j+96:]));
        } else if (ll- j > 64) {
            chunk[0] = hex"00";
            chunk[1] = bytesToBytes32(bytes(m[j:]));
            chunk[2] = bytesToBytes32(bytes(m[j+32:]));
            chunk[3] = bytesToBytes32(bytes(m[j+64:]));
        } else if (ll-j > 32) {
            chunk[0] = hex"00";
            chunk[1] = hex"00";
            chunk[2] = bytesToBytes32(bytes(m[j:]));
            chunk[3] = bytesToBytes32(bytes(m[j+32:]));
        } else {
            chunk[0] = hex"00";
            chunk[1] = hex"00";
            chunk[2] = hex"00";
            chunk[3] = bytesToBytes32(bytes(m[j:]));
        }

        // console.logBytes32(chunk[0]);
        // console.logBytes32(chunk[1]);
        // console.logBytes32(chunk[2]);
        // console.logBytes32(chunk[3]);

        // t = uintTo2Bytes8(ll);
        t[0] = bytes8(uint64(ll));
        t[1] = bytes8(uint64(0));
        // TODO
        console.log("before");
        console.logBytes8(t[0]);
        console.logBytes8(t[1]);
        console.logBytes32(h[0]);
        console.logBytes32(h[1]);
        h = f(rounds, h, chunk, t, true);

        console.log("after");
        console.logBytes32(h[0]);
        console.logBytes32(h[1]);

        return h[0];
    }

    function bytesToBytes32(bytes memory b) public pure returns (bytes32) {
        bytes32 out;
        // start from the right, effectively left-padding if less than 32 bytes in b
        uint last = b.length;
        if (b.length > 32) {
            last = 32;
        }

        for (uint i = 0; i < last; i++) {
            out |= bytes32(b[last - 1 - i] & 0xFF) >> ((32-1-i) * 8);
        }
        return out;
    }

    // function bytesToBytes128(bytes memory b) private pure returns (bytes128) {
    //     bytes128 out;
    //     for (uint i = 0; i < 128; i++) {
    //         out |= bytes128(b[i] & 0xFF) >> (i * 8);
    //     }
    //     return out;
    // }

    // returns the 16 last bytes of i as a fixed length array of 2 byte8 elements
    function uintTo2Bytes8(uint256 i) public pure returns (bytes8[2] memory) {
        bytes32 b = bytes32(i);
        // todo require other bytes to be zero?
        bytes8[2] memory out;
        out[0] = bytes8(b << 16 * 8);
        out[1] = bytes8(b << 24 * 8);
        return out;
    }
}
