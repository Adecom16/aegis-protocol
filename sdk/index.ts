/**
 * Firewall Protocol SDK
 * Main entry point for the developer SDK
 */

// Export main client
export { FirewallClient, type FirewallConfig, type ContractRegistration } from './src/firewallClient';

// Export policy builder
export { PolicyBuilder, type SecurityPolicy } from './src/policyBuilder';

// Export contract protection
export { ContractProtection, type ProtectionConfig } from './src/contractProtection';

// Export risk monitor
export { RiskMonitor, type RiskMetrics, type RiskHistory } from './src/riskMonitor';

// Export types
export type { FirewallConfig, ContractRegistration } from './src/firewallClient';
export type { SecurityPolicy } from './src/policyBuilder';
export type { ProtectionConfig } from './src/contractProtection';
export type { RiskMetrics, RiskHistory } from './src/riskMonitor';

/**
 * Quick start example:
 * 
 * import { FirewallClient, PolicyBuilder } from '@firewall-protocol/sdk';
 * 
 * const client = new FirewallClient({
 *   providerUrl: 'http://localhost:8545',
 *   firewallRegistryAddress: '0x...',
 *   policyManagerAddress: '0x...',
 *   firewallExecutorAddress: '0x...'
 * });
 * 
 * const policy = PolicyBuilder.createDefault()
 *   .blockFlashLoans(true)
 *   .preventReentrancy(true)
 *   .build();
 * 
 * await client.registerContract('0x...', policy);
 * 
 * const monitor = new RiskMonitor(client, '0x...');
 * monitor.startMonitoring();
 * 
 * monitor.onRiskUpdate((metrics) => {
 *   console.log(`Risk Score: ${metrics.currentRiskScore}`);
 * });
 */
