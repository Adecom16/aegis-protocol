// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./libraries/PolicyValidationLib.sol";

/**
 * @title PolicyManager
 * @dev Defines and manages contract-specific security policies.
 */
contract PolicyManager {
    address public owner;
    address public guardianDAO;

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

    mapping(address => Policy) public policies;
    mapping(address => uint256) public policyVersions;

    event PolicyCreated(address indexed targetContract, uint256 version, uint256 timestamp);
    event PolicyUpdated(address indexed targetContract, uint256 newVersion, uint256 timestamp);
    event PolicyDeactivated(address indexed targetContract, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GuardianDAOUpdated(address indexed newGuardianDAO);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyOwnerOrGuardian() {
        require(msg.sender == owner || msg.sender == guardianDAO, "Unauthorized");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setGuardianDAO(address _guardianDAO) external onlyOwner validAddress(_guardianDAO) {
        guardianDAO = _guardianDAO;
        emit GuardianDAOUpdated(_guardianDAO);
    }

    function setPolicy(
        address _contract,
        Policy calldata _policy
    ) external onlyOwnerOrGuardian validAddress(_contract) {
        require(_policy.maxTransactionValue > 0, "Invalid max transaction value");
        require(_policy.maxTokenTransferPerBlock > 0, "Invalid max transfer per block");

        // Validate policy using library
        PolicyValidationLib.validatePolicy(_policy);

        uint256 newVersion = policyVersions[_contract] + 1;

        policies[_contract] = Policy({
            blockFlashLoans: _policy.blockFlashLoans,
            preventReentrancy: _policy.preventReentrancy,
            maxTransactionValue: _policy.maxTransactionValue,
            maxTokenTransferPerBlock: _policy.maxTokenTransferPerBlock,
            blacklistedAddresses: _policy.blacklistedAddresses,
            whitelistedAddresses: _policy.whitelistedAddresses,
            requireWhitelist: _policy.requireWhitelist,
            version: newVersion,
            createdAt: block.timestamp,
            isActive: true
        });

        policyVersions[_contract] = newVersion;

        if (newVersion == 1) {
            emit PolicyCreated(_contract, newVersion, block.timestamp);
        } else {
            emit PolicyUpdated(_contract, newVersion, block.timestamp);
        }
    }

    function getPolicy(address _contract) external view returns (Policy memory) {
        require(policies[_contract].isActive, "Policy not found or inactive");
        return policies[_contract];
    }

    function getPolicyVersion(address _contract) external view returns (uint256) {
        return policyVersions[_contract];
    }

    function deactivatePolicy(address _contract) external onlyOwnerOrGuardian {
        require(policies[_contract].isActive, "Policy already inactive");
        policies[_contract].isActive = false;
        emit PolicyDeactivated(_contract, block.timestamp);
    }

    function isAddressBlacklisted(address _contract, address _addr)
        external
        view
        returns (bool)
    {
        Policy memory policy = policies[_contract];
        for (uint256 i = 0; i < policy.blacklistedAddresses.length; i++) {
            if (policy.blacklistedAddresses[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    function isAddressWhitelisted(address _contract, address _addr)
        external
        view
        returns (bool)
    {
        Policy memory policy = policies[_contract];
        if (!policy.requireWhitelist) {
            return true;
        }
        for (uint256 i = 0; i < policy.whitelistedAddresses.length; i++) {
            if (policy.whitelistedAddresses[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }
}
