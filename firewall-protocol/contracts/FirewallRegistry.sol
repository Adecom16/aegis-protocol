// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FirewallRegistry
 * @dev Registry of protected smart contracts.
 */
contract FirewallRegistry {
    mapping(address => bool) public isProtected;
    mapping(address => address) public contractToPolicy;

    event ContractRegistered(address indexed contractAddress, address policyAddress);
    event ContractUnregistered(address indexed contractAddress);

    function registerContract(address _contract, address _policy) external {
        // Access control and logic here
        isProtected[_contract] = true;
        contractToPolicy[_contract] = _policy;
        emit ContractRegistered(_contract, _policy);
    }

    function unregisterContract(address _contract) external {
        // Access control and logic here
        isProtected[_contract] = false;
        contractToPolicy[_contract] = address(0);
        emit ContractUnregistered(_contract);
    }
}
