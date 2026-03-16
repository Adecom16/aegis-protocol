# Decentralized Smart Contract Firewall Protocol

Welcome to the **Decentralized Smart Contract Firewall Protocol**. This repository contains the reference architecture, smart contracts, simulation engine, and guardian node software for a blockchain infrastructure protocol designed to protect smart contracts from exploits in real time.

## Overview

The Firewall Protocol acts as a security middleware layer positioned between users and smart contracts. Every transaction is analyzed via a rigorous simulation and anomaly detection process before execution on-chain, effectively neutralizing threats such as:
- Flash loan exploits
- Oracle manipulation
- Abnormal token draining
- Governance attacks
- Reentrancy-based attacks

## Repository Structure

- `docs/`: Comprehensive technical protocol specification, whitepaper, architecture, and threat models.
- `contracts/`: Smart contract components including the `FirewallRegistry`, `PolicyManager`, `FirewallExecutor`, and `GuardianDAO`.
- `simulation-engine/`: TypeScript-based engine for local transaction simulation and state analysis.
- `anomaly-detection/`: Detection rules and AI models for analyzing simulation output for exploit signatures.
- `guardian-node/`: Node software for operators participating in the decentralized guardian network.
- `sdk/`: Developer integration SDK to easily protect existing dApps.
- `scripts/`: Utilities for deploying contracts and running nodes.

## Documentation

For a full understanding of the protocol's design, start with the `docs/whitepaper.md` and `docs/architecture.md`. Detailed technical specifications for smart contracts and the risk scoring system are available in `docs/protocol-spec.md`.

## Integration

Developers looking to integrate the firewall into their decentralized applications should refer to `docs/integration-guide.md` and explore the `sdk/` directory.

## License

MIT License. See `LICENSE` for details.
