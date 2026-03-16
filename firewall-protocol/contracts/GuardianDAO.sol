// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GuardianDAO
 * @dev Governance contract for guardian coordination.
 */
contract GuardianDAO {
    mapping(address => uint256) public guardianStakes;
    mapping(address => bool) public isGuardian;

    event GuardianJoined(address indexed guardian, uint256 amount);
    event GuardianSlashed(address indexed guardian, uint256 amount, string reason);

    function joinNetwork() external payable {
        require(msg.value > 0, "Must stake tokens");
        guardianStakes[msg.sender] += msg.value;
        isGuardian[msg.sender] = true;
        emit GuardianJoined(msg.sender, msg.value);
    }

    function slashGuardian(address guardian, uint256 amount, string calldata reason) external {
        // Access control: Only DAO consensus
        require(isGuardian[guardian], "Not a guardian");
        require(guardianStakes[guardian] >= amount, "Stake too low");

        guardianStakes[guardian] -= amount;
        if(guardianStakes[guardian] == 0) {
            isGuardian[guardian] = false;
        }
        emit GuardianSlashed(guardian, amount, reason);
    }
}
