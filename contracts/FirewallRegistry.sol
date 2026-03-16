// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FirewallRegistry
 * @dev Registry of protected smart contracts with access control and verification.
 */
contract FirewallRegistry {
    address public owner;
    address public guardianDAO;

    struct ProtectedContract {
        address contractAddress;
        address policyAddress;
        uint256 registrationTime;
        bool isActive;
        string metadata;
    }

    mapping(address => ProtectedContract) public protectedContracts;
    mapping(address => bool) public isProtected;
    address[] public registeredContracts;

    event ContractRegistered(
        address indexed contractAddress,
        address indexed policyAddress,
        uint256 timestamp
    );
    event ContractUnregistered(address indexed contractAddress, uint256 timestamp);
    event ContractUpdated(address indexed contractAddress, address indexed newPolicy);
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

    function registerContract(
        address _contract,
        address _policy,
        string calldata _metadata
    ) external onlyOwnerOrGuardian validAddress(_contract) validAddress(_policy) {
        require(!isProtected[_contract], "Contract already registered");
        require(_contract.code.length > 0, "Address is not a contract");

        protectedContracts[_contract] = ProtectedContract({
            contractAddress: _contract,
            policyAddress: _policy,
            registrationTime: block.timestamp,
            isActive: true,
            metadata: _metadata
        });

        isProtected[_contract] = true;
        registeredContracts.push(_contract);

        emit ContractRegistered(_contract, _policy, block.timestamp);
    }

    function unregisterContract(address _contract) external onlyOwnerOrGuardian {
        require(isProtected[_contract], "Contract not registered");

        protectedContracts[_contract].isActive = false;
        isProtected[_contract] = false;

        emit ContractUnregistered(_contract, block.timestamp);
    }

    function updatePolicy(address _contract, address _newPolicy)
        external
        onlyOwnerOrGuardian
        validAddress(_newPolicy)
    {
        require(isProtected[_contract], "Contract not registered");

        protectedContracts[_contract].policyAddress = _newPolicy;
        emit ContractUpdated(_contract, _newPolicy);
    }

    function getContractPolicy(address _contract) external view returns (address) {
        require(isProtected[_contract], "Contract not registered");
        return protectedContracts[_contract].policyAddress;
    }

    function getContractInfo(address _contract)
        external
        view
        returns (ProtectedContract memory)
    {
        require(isProtected[_contract], "Contract not registered");
        return protectedContracts[_contract];
    }

    function getRegisteredContractsCount() external view returns (uint256) {
        return registeredContracts.length;
    }

    function getRegisteredContractAt(uint256 _index) external view returns (address) {
        require(_index < registeredContracts.length, "Index out of bounds");
        return registeredContracts[_index];
    }

    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }
}
