# Technical Protocol Specification

## 4. Smart Contract Architecture

The smart contract layer of the firewall protocol comprises a decentralized suite of smart contracts designed for flexibility, scalability, and robust security.

*   **FirewallRegistry:** A central registry that maintains a list of protected smart contracts. Developers register their dApps, specify security policies, and manage integration details.
*   **PolicyManager:** Defines and enforces customizable security policies for individual contracts. It allows developers to configure rules, limits, and access controls tailored to their specific needs.
*   **FirewallExecutor:** Acts as the decentralized execution layer. It receives validated transactions from the Guardian Network and submits them to the protected contracts, ensuring that only safe operations are executed.
*   **GuardianDAO:** A governance contract that coordinates the decentralized network of guardian nodes. It manages staking, slashing, voting on protocol upgrades, and adjusting global risk parameters.
*   **EmergencyPauseController:** A critical contract capable of pausing operations on vulnerable systems if a severe exploit is detected or if an emergency threshold is reached. It serves as a rapid response mechanism to minimize damage.

## 5. Anomaly Detection Framework

A robust detection framework is vital for identifying malicious patterns before execution. It combines rule-based logic with optional AI/ML capabilities.

### Supported Detections

*   **Abnormal Liquidity Drains:** Identifying sudden, large-scale token withdrawals that significantly alter a protocol's liquidity profile.
*   **Flash Loan Manipulation:** Detecting complex transactions involving flash loans that aim to exploit price discrepancies, oracle vulnerabilities, or governance mechanisms.
*   **Oracle Price Manipulation:** Monitoring for significant, unexplained price deviations across multiple oracles, often a precursor to attacks.
*   **Repeated Reentrancy Attempts:** Identifying patterns of nested contract calls that suggest an attacker is attempting to exploit reentrancy vulnerabilities.
*   **Governance Voting Manipulation:** Detecting rapid accumulation of voting power or suspicious voting patterns that could indicate an attempt to capture governance control.
*   **Suspicious Token Transfers:** Flagging unusual token movements, such as large transfers to unknown addresses or sudden spikes in transaction volume.

## 6. Transaction Simulation Engine

The protocol relies on a sophisticated simulation engine to analyze pending transactions before they are executed on the main network.

### Simulation Analysis Focus

*   **Token Balance Changes:** Tracking exact token transfers and final balances to detect unexpected drains or unauthorized movements.
*   **Smart Contract State Changes:** Monitoring modifications to critical state variables, such as ownership, permissions, or configuration settings.
*   **Liquidity Pool Impact:** Evaluating the potential effect of a transaction on the depth and balance of liquidity pools, preventing severe price slippage or manipulation.
*   **Collateralization Health:** Assessing the impact of transactions on collateral ratios, ensuring that protocols remain solvent and resistant to under-collateralization risks.
*   **Governance Vote Influence:** Analyzing how a transaction might alter voting power distribution or influence the outcome of governance proposals.

### Architecture

Simulation nodes are lightweight, stateless environments that run an isolated instance of the EVM (or other supported VMs). They fetch the necessary state data from the blockchain, execute the transaction locally, and generate a comprehensive trace of all state changes, internal calls, and events.

## 7. Risk Scoring System

A quantitative risk scoring model assigns a numerical safety score to each transaction, ranging from 0 (safe) to 100 (critical risk).

### Risk Thresholds

*   **0-20: Allow Transaction:** Transaction is deemed safe and proceeds to immediate execution.
*   **21-60: Delay Transaction:** Transaction exhibits minor anomalies or violates less strict policies. It is delayed for further analysis or manual review.
*   **61-90: Reject Transaction:** Transaction is highly suspicious, violates critical policies, or matches known exploit signatures. It is blocked outright.
*   **91-100: Trigger Emergency Pause:** Transaction indicates a severe, immediate threat or a successful exploit pattern. It triggers an automatic emergency pause on the affected contract.

### Scoring Methodology

The scoring model aggregates risk factors by evaluating simulation data against predefined rules and AI models. Each rule violation or anomalous pattern contributes to the total score, weighted by its severity.

## 9. Emergency Response Mechanism

An automated emergency response system is crucial for protecting protocols in real-time when exploits occur or are highly probable.

### Key Features

*   **Automatic Contract Pause:** Automatically pauses vulnerable contracts if the risk score exceeds the critical threshold (91-100), halting all operations to prevent further damage.
*   **Guardian-Triggered Emergency Shutdown:** Allows the Guardian Network, through a rapid consensus mechanism, to trigger an emergency shutdown if a novel exploit is detected that bypasses automated rules.
*   **Security Alerts for Developers:** Generates real-time alerts for developers via multiple channels (e.g., email, Discord, Telegram) when high-risk transactions or emergency events occur.
*   **Staged Recovery Procedures:** Defines clear, automated procedures for safely unpausing contracts and resuming normal operations after an incident has been resolved.

### Balancing Rapid Response and Decentralization

The system balances the need for immediate action with the principles of decentralization by requiring multi-signature approval or rapid consensus among a subset of trusted guardians for critical actions, while allowing automated rules to handle clear-cut threats autonomously.
