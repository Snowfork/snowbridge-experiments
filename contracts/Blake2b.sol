// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

// EIP: https://eips.ethereum.org/EIPS/eip-152

// blake2b on substrate uses no key, and length of 32 bytes, see https://github.com/paritytech/substrate/blob/master/primitives/core/src/hashing.rs#L42
// the underlying implementation uses the following data: https://docs.rs/blake2-rfc/0.2.18/src/blake2_rfc/blake2.rs.html#107

contract Blake2b {
    function f(
        uint32 rounds,
        bytes32[2] memory h,
        bytes32[4] memory m,
        bytes8[2] memory t,
        bool last
    ) public view returns (bytes32[2] memory) {
        bytes32[2] memory output;

        bytes memory args = abi.encodePacked(rounds, h[0], h[1], m[0], m[1], m[2], m[3], t[0], t[1], last);

        assembly {
            if iszero(staticcall(not(0), 0x09, add(args, 32), 0xd5, output, 0x40)) {
                revert(0, 0)
            }
        }

        return output;
    }

    // from https://datatracker.ietf.org/doc/html/rfc7693#section-3.3
    function hash(bytes memory m) public view returns (bytes32) {
        // uint128 cbMessageLen = length(M);

        // initial state/IV
        bytes32[2] memory h;
        h[0] = hex"6a09e667f3bcc908bb67ae8584caa73b3c6ef372fe94f82ba54ff53a5f1d36f1";
        h[1] = hex"510e527fade682d19b05688c2b3e6c1f1f83d9abfb41bd6b5be0cd19137e2179";

        // no key, 32 bytes hash length
        h[0] = h[0] ^ hex"01010020";
        // TODO transform above into static constants

        // ceil to message length / 128, but use 1 in the case that message length is 0
        uint blocks = 1 + ((m.length - 1) / 128);

        // 12 rounds for blake2b, see https://datatracker.ietf.org/doc/html/rfc7693#section-3.2
        uint32 rounds = 12;

        uint i = 0;
        bytes32[4] memory chunk;

        for (; i < blocks - 1; i++) {
            uint j = i*16;
            chunk[0] = bytesToBytes32(concat(m[j], m[j+1], m[j+2], m[j+3]));
            // chunk[1] = m[i*16+4:(i*16)+8];
            // chunk[2] = m[i*16+8:(i*16)+12];
            // chunk[3] = m[i*16+12:(i*16)+16];
            bytes8[2] memory t = uintTo2Bytes8((i + 1) * 128);
            h = f(rounds, h, chunk, t, false);
        }

        // chunk[0] = m[i*16:(i*16)+4];
        // chunk[1] = m[i*16+4:(i*16)+8];
        // chunk[2] = m[i*16+8:(i*16)+12];
        // chunk[3] = m[i*16+12:(i*16)+16];
        // TODO pad remainder, the above only works if we have a message that is divisible by 128
        h = f(rounds, h, chunk, uintTo2Bytes8((i + 1) * 128), true);

        return h[0];
    }

    function concat(byte a, byte b, byte c, byte d) public pure returns (bytes memory) {
        return abi.encodePacked(a, b, c, d);
    }

    function bytesToBytes32(bytes memory b) private pure returns (bytes32) {
        bytes32 out;
        for (uint i = 0; i < 32; i++) {
            out |= bytes32(b[i] & 0xFF) >> (i * 8);
        }
        return out;
    }
    function uintTo2Bytes8(uint256 i) private pure returns (bytes8[2] memory) {
        bytes32 b = bytes32(i);
        // todo require b[0] and b[1] to be empty
        bytes8[2] memory out;
        out[0] = b[2];
        out[0] = b[3];
        return out;
    }

}
