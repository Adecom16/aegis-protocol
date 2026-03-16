# Architecture & Transaction Lifecycle

## 2. Core Architecture

The Decentralized Smart Contract Firewall Protocol features a modular, composable design consisting of six core components. Together, they create a real-time security middleware layer positioned between users and protected smart contracts.

*   **Transaction Monitor:** Constantly watches the mempool of supported chains for pending transactions directed at protected smart contracts. It extracts transaction data and passes it to the Simulation Engine.
*   **Simulation Engine:** Creates an ephemeral, isolated fork of the current blockchain state to simulate the pending transaction's execution without affecting the main network. This helps identify the expected state changes.
*   **Anomaly Detection Engine:** Analyzes the simulation output against a suite of rules and AI models. It detects malicious patterns such as flash loan exploits, abnormal token draining, oracle manipulation, reentrancy attacks, and suspicious contract interactions.
*   **Policy Engine:** Enforces customizable security policies defined by developers when they register their smart contracts. These policies dictate acceptable behaviors (e.g., maximum allowable token transfer per block).
*   **Firewall Executor:** Responsible for executing validated transactions on-chain. It acts as an intermediary, submitting the transaction to the target contract only if it passes all security checks.
*   **Guardian Network:** A decentralized network of node operators responsible for running the aforementioned off-chain and on-chain components. They coordinate, vote on transaction safety, and slash malicious participants.

### Data Flow

1.  A user submits a transaction to a protected contract.
2.  The Guardian Network's Transaction Monitor detects the pending transaction in the mempool.
3.  The Simulation Engine executes the transaction locally and records state changes.
4.  The Anomaly Detection Engine and Policy Engine analyze the state changes.
5.  Guardians reach consensus on a Risk Score.
6.  The Firewall Executor forwards the transaction for execution on-chain if approved, or it is blocked/delayed.

## 3. Transaction Lifecycle

The full transaction workflow through the firewall protocol involves several critical stages, from interception to final execution or rejection.

### Workflow Stages

1.  **User Transaction Interception:**
    *   The user initiates a transaction targeting a smart contract protected by the firewall.
    *   The Transaction Monitor (run by Guardians) intercepts the pending transaction from the mempool before it is mined.

2.  **Simulation & Analysis:**
    *   The Simulation Engine processes the transaction locally against the latest block state.
    *   It extracts critical data, including token balance changes, state variable modifications, and cross-contract calls.

3.  **Risk Analysis & Policy Evaluation:**
    *   The Anomaly Detection Engine scans the simulation data for known exploit signatures (e.g., flash loan patterns, reentrancy).
    *   The Policy Engine checks if the transaction violates any developer-defined rules (e.g., "transaction must not drain more than 10% of liquidity").
    *   A numerical Risk Score is generated.

4.  **Consensus & Execution/Blocking:**
    *   Guardians share their computed Risk Scores. If consensus is reached that the transaction is safe (low risk), the Firewall Executor is authorized to submit the transaction to the destination contract.
    *   If the transaction is deemed suspicious but not explicitly malicious (medium risk), it is delayed, entering a queue for further analysis or manual review by the developer.
    *   If the transaction is malicious (high risk) or violates policies, it is rejected entirely, and an alert is generated.
