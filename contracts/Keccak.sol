// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

contract Keccak {
    function hash(bytes calldata m) public pure returns (bytes32) {
        return keccak256(m);
    }
}
