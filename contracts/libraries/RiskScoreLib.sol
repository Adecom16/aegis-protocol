// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RiskScoreLib
 * @dev Library for calculating and handling risk scores with weighted factors.
 */
library RiskScoreLib {
    // Risk thresholds (0-100 scale)
    uint8 constant THRESHOLD_ALLOW = 20;
    uint8 constant THRESHOLD_DELAY = 60;
    uint8 constant THRESHOLD_REJECT = 90;
    uint8 constant THRESHOLD_PAUSE = 100;

    // Risk factor weights
    uint8 constant WEIGHT_FLASH_LOAN = 40;
    uint8 constant WEIGHT_LIQUIDITY_DRAIN = 35;
    uint8 constant WEIGHT_ORACLE_MANIPULATION = 30;
    uint8 constant WEIGHT_REENTRANCY = 25;
    uint8 constant WEIGHT_GOVERNANCE_ATTACK = 20;
    uint8 constant WEIGHT_SUSPICIOUS_TRANSFER = 15;
    uint8 constant WEIGHT_POLICY_VIOLATION = 50;

    enum Action {
        ALLOW,
        DELAY,
        REJECT,
        PAUSE
    }

    struct RiskFactors {
        bool hasFlashLoan;
        bool hasLiquidityDrain;
        bool hasOracleManipulation;
        bool hasReentrancy;
        bool hasGovernanceAttack;
        bool hasSuspiciousTransfer;
        bool violatesPolicy;
        uint8 customRiskScore;
    }

    error InvalidRiskScore();

    function determineAction(uint8 score) internal pure returns (Action) {
        if (score <= THRESHOLD_ALLOW) return Action.ALLOW;
        if (score <= THRESHOLD_DELAY) return Action.DELAY;
        if (score <= THRESHOLD_REJECT) return Action.REJECT;
        return Action.PAUSE;
    }

    function calculateRiskScore(RiskFactors calldata factors) internal pure returns (uint8) {
        uint16 totalScore = 0;

        if (factors.hasFlashLoan) {
            totalScore += WEIGHT_FLASH_LOAN;
        }
        if (factors.hasLiquidityDrain) {
            totalScore += WEIGHT_LIQUIDITY_DRAIN;
        }
        if (factors.hasOracleManipulation) {
            totalScore += WEIGHT_ORACLE_MANIPULATION;
        }
        if (factors.hasReentrancy) {
            totalScore += WEIGHT_REENTRANCY;
        }
        if (factors.hasGovernanceAttack) {
            totalScore += WEIGHT_GOVERNANCE_ATTACK;
        }
        if (factors.hasSuspiciousTransfer) {
            totalScore += WEIGHT_SUSPICIOUS_TRANSFER;
        }
        if (factors.violatesPolicy) {
            totalScore += WEIGHT_POLICY_VIOLATION;
        }

        // Add custom risk score if provided
        if (factors.customRiskScore > 0) {
            totalScore += factors.customRiskScore;
        }

        // Cap at 100
        if (totalScore > 100) {
            totalScore = 100;
        }

        return uint8(totalScore);
    }

    function isHighRisk(uint8 score) internal pure returns (bool) {
        return score > THRESHOLD_DELAY;
    }

    function isCriticalRisk(uint8 score) internal pure returns (bool) {
        return score >= THRESHOLD_PAUSE;
    }

    function getActionDescription(Action action) internal pure returns (string memory) {
        if (action == Action.ALLOW) return "ALLOW";
        if (action == Action.DELAY) return "DELAY";
        if (action == Action.REJECT) return "REJECT";
        return "PAUSE";
    }
}
