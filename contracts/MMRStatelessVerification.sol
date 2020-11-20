// "SPDX-License-Identifier: UNLICENSED"
pragma solidity ^0.7.0;

contract MMRStatelessVerification {

    // Verifies is a parachain header is contained in an MMR leaf
    function verifyParachainHeaderInLeaf(
        bytes32 paraHead,
        bytes32 paraHeadSibling,
        bytes32 leafParaHeadRoot
    ) public pure returns (bool) {
        return leafParaHeadRoot == keccak256(abi.encodePacked(paraHead, paraHeadSibling));
    }

    // Verifies if an MMR leaf is contained in an MMR
    function verifyLeafInMMR(
        bytes32 leaf,
        bytes32[] memory orderedBranch,
        bytes32 peakParaHeadsRoot
    ) public pure returns(bool) {
        bytes32 currHash = leaf;
        for(uint i = 0; i < orderedBranch.length; i++) {
            currHash = keccak256(abi.encodePacked(currHash, orderedBranch[i]));
        }
        return currHash == peakParaHeadsRoot;
    }

    // Verifies if an MMR peak is contained in an MMR
    function verifyPeakInMMR(
        bytes32 peak,
        bytes32[] memory peaks, // peaks contains peak
        bytes32 mmrRoot
    ) public pure returns(bool) {
        require(peaks.length > 0, "peaks array cannot be empty");

        bool seenPeak;
        bytes32 currHash;
        for(uint i = 0; i < peaks.length; i++) {
            if (peaks[i] == peak) { seenPeak = true; }

            if (i == 0) {
                currHash = peaks[i];
            } else {
                currHash = keccak256(abi.encodePacked(currHash, peaks[i]));
            }
        }

        return seenPeak && currHash == mmrRoot;
    }
}
