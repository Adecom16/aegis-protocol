# Developer Integration Guide

## 10. Developer Integration SDK

The Firewall Protocol provides a comprehensive Software Development Kit (SDK) to simplify integration for developers building decentralized applications. This SDK allows developers to leverage the firewall's security features with minimal configuration.

### Key Features and Flows

*   **Register Contracts with the Firewall:** Developers can programmatically register their newly deployed or existing smart contracts with the FirewallRegistry, specifying the initial security policies and configurations.
*   **Define Security Policies:** The SDK offers a user-friendly `PolicyBuilder` interface to define complex security rules, such as maximum token transfer amounts, authorized addresses, and acceptable slippage limits.
*   **Configure Monitoring Rules:** Developers can easily select and configure built-in anomaly detection rules (e.g., flash loan protection, reentrancy guards) or implement custom rules tailored to their protocol's logic.
*   **Integrate Firewall Execution:** The SDK guides developers through updating their contract's interface to ensure that critical functions (e.g., transfers, state changes) are routed through the `FirewallExecutor` instead of direct external calls.

### Example Integration Flow

1.  **Initialize the Client:** Import and initialize the `FirewallClient` with the desired network provider and authentication credentials.
2.  **Define a Policy:** Create a new security policy using the `PolicyBuilder`. For example: `PolicyBuilder.new().requireOrigin("0x...").limitTokenTransfer("USDC", 1000).build()`.
3.  **Register the Contract:** Call the `firewallClient.registerContract(contractAddress, policy)` method to register the contract and apply the initial policy.
4.  **Update Contract Interface:** Ensure that functions requiring protection are configured to use the `FirewallExecutor` (e.g., `FirewallExecutor.execute(contractAddress, functionData)`).
