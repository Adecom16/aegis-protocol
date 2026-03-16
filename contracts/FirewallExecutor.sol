// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./libraries/RiskScoreLib.sol";

/**
 * @title FirewallExecutor
 * @dev Executes validated transactions on-chain after security checks.
 */
contract FirewallExecutor {
    address public owner;
    address public guardianDAO;
    address public firewallRegistry;

    struct ExecutionRecord {
        address targetContract;
        address executor;
        bytes data;
        uint256 value;
        uint8 riskScore;
        bool success;
        bytes returnData;
        uint256 executedAt;
    }

    uint256 public executionCount = 0;
    mapping(uint256 => ExecutionRecord) public executionRecords;
    mapping(address => uint256[]) public contractExecutions;

    uint256 public totalExecuted = 0;
    uint256 public totalFailed = 0;

    event TransactionExecuted(
        uint256 indexed executionId,
        address indexed targetContract,
        address indexed executor,
        uint8 riskScore,
        bool success,
        uint256 timestamp
    );
    event ExecutionFailed(
        uint256 indexed executionId,
        address indexed targetContract,
        string reason,
        uint256 timestamp
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GuardianDAOUpdated(address indexed newGuardianDAO);
    event FirewallRegistryUpdated(address indexed newRegistry);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardianDAO, "Only guardians can call this");
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

    function setFirewallRegistry(address _registry) external onlyOwner validAddress(_registry) {
        firewallRegistry = _registry;
        emit FirewallRegistryUpdated(_registry);
    }

    function executeTransaction(
        address _target,
        bytes calldata _data,
        uint256 _value,
        uint8 _riskScore
    ) external payable onlyGuardian validTarget(_target) returns (bool success, bytes memory returnData) {
        require(msg.value >= _value, "Insufficient value sent");
        require(_riskScore <= 100, "Invalid risk score");

        // Verify risk score allows execution
        RiskScoreLib.Action action = RiskScoreLib.determineAction(_riskScore);
        require(
            action == RiskScoreLib.Action.ALLOW,
            "Transaction risk score does not allow execution"
        );

        uint256 executionId = executionCount++;

        // Execute the transaction
        (success, returnData) = _target.call{value: _value}(_data);

        // Record execution
        ExecutionRecord memory record = ExecutionRecord({
            targetContract: _target,
            executor: msg.sender,
            data: _data,
            value: _value,
            riskScore: _riskScore,
            success: success,
            returnData: returnData,
            executedAt: block.timestamp
        });

        executionRecords[executionId] = record;
        contractExecutions[_target].push(executionId);

        if (success) {
            totalExecuted += 1;
        } else {
            totalFailed += 1;
            emit ExecutionFailed(
                executionId,
                _target,
                "Transaction execution failed",
                block.timestamp
            );
        }

        emit TransactionExecuted(
            executionId,
            _target,
            msg.sender,
            _riskScore,
            success,
            block.timestamp
        );

        return (success, returnData);
    }

    function executeTransactionWithPrecheck(
        address _target,
        bytes calldata _data,
        uint256 _value,
        uint8 _riskScore,
        bytes calldata _precondition
    ) external payable onlyGuardian validTarget(_target) returns (bool success, bytes memory returnData) {
        // Verify precondition if provided
        if (_precondition.length > 0) {
            (bool preconditionSuccess, ) = _target.staticcall(_precondition);
            require(preconditionSuccess, "Precondition check failed");
        }

        return executeTransaction(_target, _data, _value, _riskScore);
    }

    function getExecutionRecord(uint256 _executionId)
        external
        view
        returns (ExecutionRecord memory)
    {
        require(_executionId < executionCount, "Invalid execution ID");
        return executionRecords[_executionId];
    }

    function getContractExecutionCount(address _contract) external view returns (uint256) {
        return contractExecutions[_contract].length;
    }

    function getContractExecutionAt(address _contract, uint256 _index)
        external
        view
        returns (uint256)
    {
        require(_index < contractExecutions[_contract].length, "Index out of bounds");
        return contractExecutions[_contract][_index];
    }

    function getExecutionStats()
        external
        view
        returns (
            uint256 total,
            uint256 successful,
            uint256 failed,
            uint256 successRate
        )
    {
        total = executionCount;
        successful = totalExecuted;
        failed = totalFailed;
        successRate = total > 0 ? (successful * 100) / total : 0;
    }

    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    receive() external payable {}
}
