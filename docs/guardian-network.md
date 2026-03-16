# Guardian Network Design

## 8. Guardian Network Architecture

The Guardian Network is a decentralized, robust, and highly available infrastructure composed of independent node operators. They are responsible for monitoring the protocol, analyzing transactions, and coordinating emergency responses.

### Node Operator Lifecycle

1.  **Registration and Staking:** Prospective guardians must register their nodes and stake a minimum amount of the protocol's native token (FIRE). This stake serves as collateral against malicious behavior or negligence.
2.  **Monitoring Responsibilities:** Guardians run the Transaction Monitor and Simulation Engine locally. They continuously track pending transactions in the mempool of supported chains, simulate their execution, and calculate risk scores.
3.  **Consensus and Voting:** Guardians share their computed risk scores and analysis with the network. They participate in a fast, Byzantine Fault Tolerant (BFT) consensus mechanism to reach agreement on the safety of a transaction.
4.  **Dispute Resolution Mechanism:** If guardians disagree significantly on a transaction's risk score, a dispute resolution process is triggered. This may involve a more thorough analysis by a larger subset of guardians or escalation to a higher-tier committee.
5.  **Slashing Conditions:** Guardians are slashed (lose a portion of their staked tokens) for malicious actions, such as consistently voting for malicious transactions (false negatives), voting against safe transactions (false positives), or prolonged downtime.

### Collaboration and Threat Detection

Guardians collaborate by sharing threat intelligence, exploit signatures, and anomaly detection models. This collective knowledge base allows the network to adapt to novel attack vectors rapidly and improve its overall security posture continuously.
