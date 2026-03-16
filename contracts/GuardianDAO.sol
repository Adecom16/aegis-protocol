// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GuardianDAO
 * @dev Governance contract for guardian coordination, staking, and slashing.
 */
contract GuardianDAO {
    address public owner;

    struct Guardian {
        address guardianAddress;
        uint256 stakedAmount;
        bool isActive;
        uint256 joinedAt;
        uint256 totalSlashed;
        uint256 correctVotes;
        uint256 totalVotes;
    }

    struct Proposal {
        uint256 proposalId;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 createdAt;
        uint256 deadline;
        bool executed;
        bool approved;
    }

    uint256 public minimumStake = 1 ether;
    uint256 public slashingPercentage = 10; // 10%
    uint256 public proposalCount = 0;

    mapping(address => Guardian) public guardians;
    mapping(address => bool) public isGuardian;
    address[] public guardianList;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 public totalStaked = 0;

    event GuardianJoined(address indexed guardian, uint256 amount, uint256 timestamp);
    event GuardianLeft(address indexed guardian, uint256 amount, uint256 timestamp);
    event GuardianSlashed(
        address indexed guardian,
        uint256 amount,
        string reason,
        uint256 timestamp
    );
    event GuardianRewarded(address indexed guardian, uint256 amount, uint256 timestamp);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 deadline
    );
    event ProposalVoted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 timestamp
    );
    event ProposalExecuted(uint256 indexed proposalId, bool approved, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MinimumStakeUpdated(uint256 newMinimumStake);
    event SlashingPercentageUpdated(uint256 newPercentage);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyGuardian() {
        require(isGuardian[msg.sender], "Only guardians can call this");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function joinNetwork() external payable validAddress(msg.sender) {
        require(msg.value >= minimumStake, "Insufficient stake");
        require(!isGuardian[msg.sender], "Already a guardian");

        guardians[msg.sender] = Guardian({
            guardianAddress: msg.sender,
            stakedAmount: msg.value,
            isActive: true,
            joinedAt: block.timestamp,
            totalSlashed: 0,
            correctVotes: 0,
            totalVotes: 0
        });

        isGuardian[msg.sender] = true;
        guardianList.push(msg.sender);
        totalStaked += msg.value;

        emit GuardianJoined(msg.sender, msg.value, block.timestamp);
    }

    function leaveNetwork() external onlyGuardian {
        Guardian storage guardian = guardians[msg.sender];
        require(guardian.isActive, "Guardian already inactive");

        uint256 refundAmount = guardian.stakedAmount;
        guardian.isActive = false;
        isGuardian[msg.sender] = false;
        totalStaked -= refundAmount;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");

        emit GuardianLeft(msg.sender, refundAmount, block.timestamp);
    }

    function slashGuardian(
        address _guardian,
        uint256 _amount,
        string calldata _reason
    ) external onlyOwner validAddress(_guardian) {
        require(isGuardian[_guardian], "Not a guardian");

        Guardian storage guardian = guardians[_guardian];
        require(guardian.stakedAmount >= _amount, "Insufficient stake to slash");

        guardian.stakedAmount -= _amount;
        guardian.totalSlashed += _amount;
        totalStaked -= _amount;

        if (guardian.stakedAmount < minimumStake) {
            guardian.isActive = false;
            isGuardian[_guardian] = false;
        }

        emit GuardianSlashed(_guardian, _amount, _reason, block.timestamp);
    }

    function rewardGuardian(address _guardian, uint256 _amount)
        external
        onlyOwner
        validAddress(_guardian)
    {
        require(isGuardian[_guardian], "Not a guardian");

        Guardian storage guardian = guardians[_guardian];
        guardian.stakedAmount += _amount;
        totalStaked += _amount;

        emit GuardianRewarded(_guardian, _amount, block.timestamp);
    }

    function recordVote(
        address _guardian,
        bool _wasCorrect
    ) external onlyOwner onlyGuardian {
        Guardian storage guardian = guardians[_guardian];
        guardian.totalVotes += 1;
        if (_wasCorrect) {
            guardian.correctVotes += 1;
        }
    }

    function getGuardianInfo(address _guardian)
        external
        view
        returns (Guardian memory)
    {
        require(isGuardian[_guardian], "Not a guardian");
        return guardians[_guardian];
    }

    function getGuardianAccuracy(address _guardian) external view returns (uint256) {
        require(isGuardian[_guardian], "Not a guardian");
        Guardian memory guardian = guardians[_guardian];
        if (guardian.totalVotes == 0) return 0;
        return (guardian.correctVotes * 100) / guardian.totalVotes;
    }

    function getGuardianCount() external view returns (uint256) {
        return guardianList.length;
    }

    function getGuardianAt(uint256 _index) external view returns (address) {
        require(_index < guardianList.length, "Index out of bounds");
        return guardianList[_index];
    }

    function createProposal(
        string calldata _description,
        uint256 _votingPeriod
    ) external onlyGuardian returns (uint256) {
        require(_votingPeriod > 0, "Invalid voting period");

        uint256 proposalId = proposalCount++;

        proposals[proposalId] = Proposal({
            proposalId: proposalId,
            proposer: msg.sender,
            description: _description,
            forVotes: 0,
            againstVotes: 0,
            createdAt: block.timestamp,
            deadline: block.timestamp + _votingPeriod,
            executed: false,
            approved: false
        });

        emit ProposalCreated(proposalId, msg.sender, _description, block.timestamp + _votingPeriod);
        return proposalId;
    }

    function voteOnProposal(uint256 _proposalId, bool _support) external onlyGuardian {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp <= proposal.deadline, "Voting period ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        hasVoted[_proposalId][msg.sender] = true;

        if (_support) {
            proposal.forVotes += 1;
        } else {
            proposal.againstVotes += 1;
        }

        emit ProposalVoted(_proposalId, msg.sender, _support, block.timestamp);
    }

    function executeProposal(uint256 _proposalId) external onlyOwner {
        Proposal storage proposal = proposals[_proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp > proposal.deadline, "Voting period not ended");

        proposal.executed = true;
        proposal.approved = proposal.forVotes > proposal.againstVotes;

        emit ProposalExecuted(_proposalId, proposal.approved, block.timestamp);
    }

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function setMinimumStake(uint256 _newMinimumStake) external onlyOwner {
        require(_newMinimumStake > 0, "Invalid minimum stake");
        minimumStake = _newMinimumStake;
        emit MinimumStakeUpdated(_newMinimumStake);
    }

    function setSlashingPercentage(uint256 _newPercentage) external onlyOwner {
        require(_newPercentage > 0 && _newPercentage <= 100, "Invalid percentage");
        slashingPercentage = _newPercentage;
        emit SlashingPercentageUpdated(_newPercentage);
    }

    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        address previousOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    receive() external payable {}
}
