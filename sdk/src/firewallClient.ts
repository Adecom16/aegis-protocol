/**
 * Firewall Client
 * Main SDK client for integrating the firewall protocol.
 */

import { ethers } from 'ethers';
import { PolicyBuilder } from './policyBuilder';

export interface FirewallConfig {
    providerUrl: string;
    firewallRegistryAddress: string;
    policyManagerAddress: string;
    firewallExecutorAddress: string;
    apiKey?: string;
}

export interface ContractRegistration {
    contractAddress: string;
    policyAddress: string;
    metadata: string;
    timestamp: number;
}

export class FirewallClient {
    private provider: ethers.Provider;
    private config: FirewallConfig;
    private registeredContracts: Map<string, ContractRegistration> = new Map();

    constructor(config: FirewallConfig) {
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.providerUrl);
    }

    /**
     * Register a contract with the firewall
     */
    async registerContract(
        contractAddress: string,
        policy: any,
        metadata: string = ''
    ): Promise<boolean> {
        try {
            if (!ethers.isAddress(contractAddress)) {
                throw new Error('Invalid contract address');
            }

            console.log(`Registering contract ${contractAddress} with firewall...`);

            // Validate contract exists
            const code = await this.provider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error('Address is not a contract');
            }

            // Store registration
            const registration: ContractRegistration = {
                contractAddress,
                policyAddress: policy.address || ethers.ZeroAddress,
                metadata,
                timestamp: Date.now()
            };

            this.registeredContracts.set(contractAddress.toLowerCase(), registration);

            console.log(`Contract ${contractAddress} registered successfully`);
            return true;
        } catch (error) {
            console.error(`Error registering contract:`, error);
            return false;
        }
    }

    /**
     * Update policy for a contract
     */
    async updatePolicy(contractAddress: string, newPolicy: any): Promise<boolean> {
        try {
            if (!ethers.isAddress(contractAddress)) {
                throw new Error('Invalid contract address');
            }

            console.log(`Updating policy for contract ${contractAddress}...`);

            const registration = this.registeredContracts.get(contractAddress.toLowerCase());
            if (!registration) {
                throw new Error('Contract not registered');
            }

            registration.policyAddress = newPolicy.address || ethers.ZeroAddress;
            registration.timestamp = Date.now();

            console.log(`Policy updated for contract ${contractAddress}`);
            return true;
        } catch (error) {
            console.error(`Error updating policy:`, error);
            return false;
        }
    }

    /**
     * Get contract registration
     */
    getContractRegistration(contractAddress: string): ContractRegistration | undefined {
        return this.registeredContracts.get(contractAddress.toLowerCase());
    }

    /**
     * Get all registered contracts
     */
    getRegisteredContracts(): ContractRegistration[] {
        return Array.from(this.registeredContracts.values());
    }

    /**
     * Create a policy builder
     */
    createPolicyBuilder(): PolicyBuilder {
        return new PolicyBuilder();
    }

    /**
     * Check if contract is registered
     */
    isContractRegistered(contractAddress: string): boolean {
        return this.registeredContracts.has(contractAddress.toLowerCase());
    }

    /**
     * Get provider
     */
    getProvider(): ethers.Provider {
        return this.provider;
    }

    /**
     * Get config
     */
    getConfig(): FirewallConfig {
        return this.config;
    }

    /**
     * Validate transaction before execution
     */
    async validateTransaction(
        contractAddress: string,
        data: string,
        value: string = '0'
    ): Promise<{ valid: boolean; reason?: string }> {
        try {
            const registration = this.registeredContracts.get(contractAddress.toLowerCase());
            if (!registration) {
                return { valid: false, reason: 'Contract not registered with firewall' };
            }

            // Validate data format
            if (!data.startsWith('0x')) {
                return { valid: false, reason: 'Invalid transaction data format' };
            }

            // Validate value
            try {
                BigInt(value);
            } catch {
                return { valid: false, reason: 'Invalid value format' };
            }

            return { valid: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { valid: false, reason: errorMessage };
        }
    }

    /**
     * Get firewall status
     */
    async getFirewallStatus(): Promise<{
        isActive: boolean;
        registeredContracts: number;
        lastUpdate: number;
    }> {
        return {
            isActive: true,
            registeredContracts: this.registeredContracts.size,
            lastUpdate: Date.now()
        };
    }
}
