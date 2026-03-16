/**
 * Contract Protection
 * Provides contract protection utilities and proxy patterns.
 */

import { ethers } from 'ethers';
import { FirewallClient } from './firewallClient';

export interface ProtectionConfig {
    contractAddress: string;
    firewallExecutorAddress: string;
    protectedFunctions: string[];
}

export class ContractProtection {
    private config: ProtectionConfig;
    private firewallClient: FirewallClient;
    private protectedFunctionSignatures: Map<string, string> = new Map();

    constructor(config: ProtectionConfig, firewallClient: FirewallClient) {
        this.config = config;
        this.firewallClient = firewallClient;
        this.initializeFunctionSignatures();
    }

    /**
     * Initialize function signatures
     */
    private initializeFunctionSignatures(): void {
        // Common function signatures
        const signatures: Record<string, string> = {
            'transfer': 'transfer(address,uint256)',
            'transferFrom': 'transferFrom(address,address,uint256)',
            'approve': 'approve(address,uint256)',
            'mint': 'mint(address,uint256)',
            'burn': 'burn(uint256)',
            'swap': 'swap(uint256,uint256,address[],address)',
            'deposit': 'deposit()',
            'withdraw': 'withdraw(uint256)',
            'stake': 'stake(uint256)',
            'unstake': 'unstake(uint256)',
            'vote': 'vote(uint256,bool)',
            'delegate': 'delegate(address)'
        };

        for (const [name, sig] of Object.entries(signatures)) {
            const selector = this.getFunctionSelector(sig);
            this.protectedFunctionSignatures.set(selector, name);
        }
    }

    /**
     * Get function selector from signature
     */
    private getFunctionSelector(signature: string): string {
        const hash = ethers.id(signature);
        return hash.slice(0, 10);
    }

    /**
     * Wrap function call with firewall protection
     */
    async protectFunctionCall(
        functionName: string,
        args: any[],
        value: string = '0'
    ): Promise<{ protected: boolean; callData: string; reason?: string }> {
        try {
            // Validate function is protected
            if (!this.config.protectedFunctions.includes(functionName)) {
                return {
                    protected: false,
                    callData: '0x',
                    reason: `Function ${functionName} is not in protected list`
                };
            }

            // Validate contract is registered
            const registration = this.firewallClient.getContractRegistration(
                this.config.contractAddress
            );
            if (!registration) {
                return {
                    protected: false,
                    callData: '0x',
                    reason: 'Contract not registered with firewall'
                };
            }

            // Encode function call
            const callData = this.encodeFunctionCall(functionName, args);

            // Validate transaction
            const validation = await this.firewallClient.validateTransaction(
                this.config.contractAddress,
                callData,
                value
            );

            if (!validation.valid) {
                return {
                    protected: false,
                    callData: '0x',
                    reason: validation.reason
                };
            }

            return {
                protected: true,
                callData
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                protected: false,
                callData: '0x',
                reason: errorMessage
            };
        }
    }

    /**
     * Encode function call
     */
    private encodeFunctionCall(functionName: string, args: any[]): string {
        // This is a simplified implementation
        // In production, you would use ethers.js ABI encoding
        const selector = this.getFunctionSelector(`${functionName}(...)`);
        return selector + '0'.repeat(64); // Placeholder
    }

    /**
     * Get protected functions
     */
    getProtectedFunctions(): string[] {
        return this.config.protectedFunctions;
    }

    /**
     * Add protected function
     */
    addProtectedFunction(functionName: string): void {
        if (!this.config.protectedFunctions.includes(functionName)) {
            this.config.protectedFunctions.push(functionName);
        }
    }

    /**
     * Remove protected function
     */
    removeProtectedFunction(functionName: string): void {
        this.config.protectedFunctions = this.config.protectedFunctions.filter(
            f => f !== functionName
        );
    }

    /**
     * Get protection config
     */
    getConfig(): ProtectionConfig {
        return this.config;
    }

    /**
     * Create protection wrapper for contract
     */
    static createWrapper(
        contractAddress: string,
        firewallExecutorAddress: string,
        protectedFunctions: string[]
    ): ContractProtection {
        const config: ProtectionConfig = {
            contractAddress,
            firewallExecutorAddress,
            protectedFunctions
        };

        // This would be initialized with actual FirewallClient
        const dummyClient = {} as FirewallClient;
        return new ContractProtection(config, dummyClient);
    }

    /**
     * Validate protection setup
     */
    validateSetup(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!ethers.isAddress(this.config.contractAddress)) {
            errors.push('Invalid contract address');
        }

        if (!ethers.isAddress(this.config.firewallExecutorAddress)) {
            errors.push('Invalid firewall executor address');
        }

        if (this.config.protectedFunctions.length === 0) {
            errors.push('No protected functions specified');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
