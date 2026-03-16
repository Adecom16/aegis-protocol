/**
 * Policy Builder
 * Fluent API for building security policies.
 */

export interface SecurityPolicy {
    blockFlashLoans: boolean;
    preventReentrancy: boolean;
    maxTransactionValue: string;
    maxTokenTransferPerBlock: string;
    blacklistedAddresses: string[];
    whitelistedAddresses: string[];
    requireWhitelist: boolean;
    address?: string;
}

export class PolicyBuilder {
    private policy: SecurityPolicy = {
        blockFlashLoans: false,
        preventReentrancy: false,
        maxTransactionValue: '1000000000000000000', // 1 ETH
        maxTokenTransferPerBlock: '100000000000000000', // 0.1 ETH
        blacklistedAddresses: [],
        whitelistedAddresses: [],
        requireWhitelist: false
    };

    /**
     * Block flash loans
     */
    blockFlashLoans(block: boolean = true): PolicyBuilder {
        this.policy.blockFlashLoans = block;
        return this;
    }

    /**
     * Prevent reentrancy
     */
    preventReentrancy(prevent: boolean = true): PolicyBuilder {
        this.policy.preventReentrancy = prevent;
        return this;
    }

    /**
     * Set maximum transaction value
     */
    setMaxTransactionValue(value: string): PolicyBuilder {
        this.policy.maxTransactionValue = value;
        return this;
    }

    /**
     * Set maximum token transfer per block
     */
    setMaxTokenTransferPerBlock(value: string): PolicyBuilder {
        this.policy.maxTokenTransferPerBlock = value;
        return this;
    }

    /**
     * Add blacklisted address
     */
    addBlacklistedAddress(address: string): PolicyBuilder {
        if (!this.policy.blacklistedAddresses.includes(address.toLowerCase())) {
            this.policy.blacklistedAddresses.push(address.toLowerCase());
        }
        return this;
    }

    /**
     * Remove blacklisted address
     */
    removeBlacklistedAddress(address: string): PolicyBuilder {
        this.policy.blacklistedAddresses = this.policy.blacklistedAddresses.filter(
            a => a.toLowerCase() !== address.toLowerCase()
        );
        return this;
    }

    /**
     * Add whitelisted address
     */
    addWhitelistedAddress(address: string): PolicyBuilder {
        if (!this.policy.whitelistedAddresses.includes(address.toLowerCase())) {
            this.policy.whitelistedAddresses.push(address.toLowerCase());
        }
        return this;
    }

    /**
     * Remove whitelisted address
     */
    removeWhitelistedAddress(address: string): PolicyBuilder {
        this.policy.whitelistedAddresses = this.policy.whitelistedAddresses.filter(
            a => a.toLowerCase() !== address.toLowerCase()
        );
        return this;
    }

    /**
     * Require whitelist
     */
    requireWhitelist(require: boolean = true): PolicyBuilder {
        this.policy.requireWhitelist = require;
        return this;
    }

    /**
     * Set policy address
     */
    setAddress(address: string): PolicyBuilder {
        this.policy.address = address;
        return this;
    }

    /**
     * Build the policy
     */
    build(): SecurityPolicy {
        return { ...this.policy };
    }

    /**
     * Build and validate
     */
    buildAndValidate(): { valid: boolean; policy?: SecurityPolicy; errors: string[] } {
        const errors: string[] = [];

        // Validate transaction value
        try {
            BigInt(this.policy.maxTransactionValue);
        } catch {
            errors.push('Invalid maxTransactionValue');
        }

        // Validate transfer limit
        try {
            BigInt(this.policy.maxTokenTransferPerBlock);
        } catch {
            errors.push('Invalid maxTokenTransferPerBlock');
        }

        // Validate transfer limit <= transaction value
        try {
            const transferLimit = BigInt(this.policy.maxTokenTransferPerBlock);
            const txValue = BigInt(this.policy.maxTransactionValue);
            if (transferLimit > txValue) {
                errors.push('maxTokenTransferPerBlock cannot exceed maxTransactionValue');
            }
        } catch {
            // Skip if values are invalid
        }

        // Validate addresses
        for (const addr of this.policy.blacklistedAddresses) {
            if (!this.isValidAddress(addr)) {
                errors.push(`Invalid blacklisted address: ${addr}`);
            }
        }

        for (const addr of this.policy.whitelistedAddresses) {
            if (!this.isValidAddress(addr)) {
                errors.push(`Invalid whitelisted address: ${addr}`);
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        return { valid: true, policy: this.build(), errors: [] };
    }

    /**
     * Validate address format
     */
    private isValidAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Create a default policy
     */
    static createDefault(): PolicyBuilder {
        return new PolicyBuilder()
            .blockFlashLoans(true)
            .preventReentrancy(true)
            .setMaxTransactionValue('1000000000000000000')
            .setMaxTokenTransferPerBlock('100000000000000000');
    }

    /**
     * Create a strict policy
     */
    static createStrict(): PolicyBuilder {
        return new PolicyBuilder()
            .blockFlashLoans(true)
            .preventReentrancy(true)
            .setMaxTransactionValue('100000000000000000') // 0.1 ETH
            .setMaxTokenTransferPerBlock('10000000000000000') // 0.01 ETH
            .requireWhitelist(true);
    }

    /**
     * Create a permissive policy
     */
    static createPermissive(): PolicyBuilder {
        return new PolicyBuilder()
            .blockFlashLoans(false)
            .preventReentrancy(false)
            .setMaxTransactionValue('10000000000000000000') // 10 ETH
            .setMaxTokenTransferPerBlock('1000000000000000000'); // 1 ETH
    }
}
