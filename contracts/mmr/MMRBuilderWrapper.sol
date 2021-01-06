// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

import "./MMRBuilder.sol";

contract MMRBuilderWrapper {
    using MMRBuilder for MMRBuilder.Tree;

    MMRBuilder.Tree mTree;
    constructor() public {

    }

    function append(bytes32 data) public {
        return mTree.append(data);
    }

    function getSize() public view returns (uint256) {
        return mTree.getSize();
    }

    function getWidth() public view returns (uint256) {
        return mTree.getWidth();
    }

    function getHashes() public view returns (bytes32[] memory) {
        return mTree.getHashes();
    }

    function getMerkleProof(uint256 index) public returns (
        bytes32 root,
        uint256 width,
        bytes32[] memory peakBagging,
        bytes32[] memory siblings
    )
    {
        return mTree.getMerkleProof(index);
    }
}
