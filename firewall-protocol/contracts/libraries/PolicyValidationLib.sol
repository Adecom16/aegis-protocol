// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PolicyValidationLib
 * @dev Library containing standard policy validation logic.
 */
library PolicyValidationLib {

    function checkTransferLimit(uint256 amount, uint256 limit) internal pure returns (bool) {
        return amount <= limit;
    }

    function isAddressBlacklisted(address target, mapping(address => bool) storage blacklist) internal view returns (bool) {
        return blacklist[target];
    }
}
