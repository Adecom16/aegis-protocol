// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EmergencyPauseController
 * @dev Controls emergency pause functionality for protected contracts.
 */
contract EmergencyPauseController {
    address public owner;
    address public guardianDAO;

    struct PauseState {
        address targetContract;
        bool isPaused;
        uint256 pausedAt;
        uint256 unpausedAt;
        string reason;
        address pausedBy;
    }

    mapping(address => PauseState) public pauseStates;
    mapping(address => bool) public canPause;

    address[] public pausedContracts;

    event ContractPaused(
        address indexed targetContract,
        address indexed pausedBy,
        string reason,
        uint256 timestamp
    );
    event ContractUnpaused(
        address indexed targetContract,
        address indexed unpausedBy,
        uint256 timestamp
    );
    event PauserAuthorized(address indexed pauser, uint256 timestamp);
    event PauserRevoked(address indexed pauser, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GuardianDAOUpdated(address indexed newGuardianDAO);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == guardianDAO || canPause[msg.sender], "Unauthorized");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    modifier validTarget(address _target) {
        require(_target != address(0), "Invalid target");
        require(_target.code.length > 0, "Target is not a contract");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setGuardianDAO(address _guardianDAO) external onlyOwner validAddress(_guardianDAO) {
        guardianDAO = _guardianDAO;
        emit GuardianDAOUpdated(_guardianDAO);
    }

    function authorizePauser(address _pauser) external onlyOwner validAddress(_pauser) {
        require(!canPause[_pauser], "Pauser already authorized");
        canPause[_pauser] = true;
        emit PauserAuthorized(_pauser, block.timestamp);
    }

    function revokePauser(address _pauser) external onlyOwner validAddress(_pauser) {
        require(canPause[_pauser], "Pauser not authorized");
        canPause[_pauser] = false;
        emit PauserRevoked(_pauser, block.timestamp);
    }

    function pauseContract(
        address _target,
        string calldata _reason
    ) external onlyAuthorized validTarget(_target) {
        PauseState storage state = pauseStates[_target];
        require(!state.isPaused, "Contract already paused");

        state.targetContract = _target;
        state.isPaused = true;
        state.pausedAt = block.timestamp;
        state.reason = _reason;
        state.pausedBy = msg.sender;

        pausedContracts.push(_target);

        emit ContractPaused(_target, msg.sender, _reason, block.timestamp);
    }

    function unpauseContract(address _target) external onlyOwner validTarget(_target) {
        PauseState storage state = pauseStates[_target];
        require(state.isPaused, "Contract not paused");

        state.isPaused = false;
        state.unpausedAt = block.timestamp;

        emit ContractUnpaused(_target, msg.sender, block.timestamp);
    }

    function isPaused(address _target) external view returns (bool) {
        return pauseStates[_target].isPaused;
    }

    function getPauseState(address _target) external view returns (PauseState memory) {
        return pauseStates[_target];
    }

    function getPausedContractsCount() external view returns (uint256) {
        return pausedContracts.length;
    }

    function getPausedContractAt(uint256 _index) external view returns (address) {
        require(_index < pausedContracts.length, "Index out of bounds");
        return pausedContracts[_index];
    }

    function getPauseDuration(address _target) external view returns (uint256) {
        PauseState memory state = pauseStates[_target];
        if (!state.isPaused) {
            return 0;
        }
        if (state.unpausedAt > 0) {
            return state.unpausedAt - state.pausedAt;
        }
        return block.timestamp - state.pausedAt;
    }

    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }
}
