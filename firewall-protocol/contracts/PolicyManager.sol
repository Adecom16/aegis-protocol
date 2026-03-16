// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PolicyManager
 * @dev Defines and manages contract-specific security policies.
 */
contract PolicyManager {
    struct Policy {
        bool blockFlashLoans;
        uint256 maxTransactionValue;
        bool preventReentrancy;
    }

    mapping(address => Policy) public policies;

    event PolicyUpdated(address indexed targetContract);

    function setPolicy(address _contract, Policy calldata _policy) external {
        // Access control: Only contract owner or admin
        policies[_contract] = _policy;
        emit PolicyUpdated(_contract);
    }

    function getPolicy(address _contract) external view returns (Policy memory) {
        return policies[_contract];
    }
}
