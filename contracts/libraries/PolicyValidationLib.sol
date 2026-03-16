// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PolicyValidationLib
 * @dev Library for validating security policies.
 */
library PolicyValidationLib {
    struct Policy {
        bool blockFlashLoans;
        bool preventReentrancy;
        uint256 maxTransactionValue;
        uint256 maxTokenTransferPerBlock;
        address[] blacklistedAddresses;
        address[] whitelistedAddresses;
        bool requireWhitelist;
        uint256 version;
        uint256 createdAt;
        bool isActive;
    }

    error InvalidPolicy(string reason);
    error InvalidAddress();
    error InvalidAmount();

    function validatePolicy(Policy calldata _policy) internal pure {
        if (_policy.maxTransactionValue == 0) {
            revert InvalidAmount();
        }

        if (_policy.maxTokenTransferPerBlock == 0) {
            revert InvalidAmount();
        }

        if (_policy.maxTokenTransferPerBlock > _policy.maxTransactionValue) {
            revert InvalidPolicy("Max transfer per block cannot exceed max transaction value");
        }

        // Validate no duplicate addresses in blacklist
        for (uint256 i = 0; i < _policy.blacklistedAddresses.length; i++) {
            if (_policy.blacklistedAddresses[i] == address(0)) {
                revert InvalidAddress();
            }
            for (uint256 j = i + 1; j < _policy.blacklistedAddresses.length; j++) {
                if (_policy.blacklistedAddresses[i] == _policy.blacklistedAddresses[j]) {
                    revert InvalidPolicy("Duplicate blacklisted address");
                }
            }
        }

        // Validate no duplicate addresses in whitelist
        for (uint256 i = 0; i < _policy.whitelistedAddresses.length; i++) {
            if (_policy.whitelistedAddresses[i] == address(0)) {
                revert InvalidAddress();
            }
            for (uint256 j = i + 1; j < _policy.whitelistedAddresses.length; j++) {
                if (_policy.whitelistedAddresses[i] == _policy.whitelistedAddresses[j]) {
                    revert InvalidPolicy("Duplicate whitelisted address");
                }
            }
        }
    }

    function validateTransactionValue(
        Policy calldata _policy,
        uint256 _value
    ) internal pure returns (bool) {
        return _value <= _policy.maxTransactionValue;
    }

    function validateTokenTransfer(
        Policy calldata _policy,
        uint256 _amount
    ) internal pure returns (bool) {
        return _amount <= _policy.maxTokenTransferPerBlock;
    }

    function isAddressBlacklisted(
        Policy calldata _policy,
        address _addr
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < _policy.blacklistedAddresses.length; i++) {
            if (_policy.blacklistedAddresses[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    function isAddressWhitelisted(
        Policy calldata _policy,
        address _addr
    ) internal pure returns (bool) {
        if (!_policy.requireWhitelist) {
            return true;
        }
        for (uint256 i = 0; i < _policy.whitelistedAddresses.length; i++) {
            if (_policy.whitelistedAddresses[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    function detectReentrancy(
        uint256 _callDepth
    ) internal pure returns (bool) {
        // Reentrancy is detected if call depth exceeds expected threshold
        return _callDepth > 2;
    }
}
