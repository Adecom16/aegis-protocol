// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RiskScoreLib
 * @dev Library for calculating and handling risk scores.
 */
library RiskScoreLib {
    uint8 constant THRESHOLD_ALLOW = 20;
    uint8 constant THRESHOLD_DELAY = 60;
    uint8 constant THRESHOLD_REJECT = 90;

    enum Action { ALLOW, DELAY, REJECT, PAUSE }

    function determineAction(uint8 score) internal pure returns (Action) {
        if (score <= THRESHOLD_ALLOW) return Action.ALLOW;
        if (score <= THRESHOLD_DELAY) return Action.DELAY;
        if (score <= THRESHOLD_REJECT) return Action.REJECT;
        return Action.PAUSE;
    }
}
