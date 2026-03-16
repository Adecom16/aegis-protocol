/**
 * StateAnalyzer
 * Analyzes state changes from transaction traces to detect anomalies.
 */

import { TransactionTrace, StorageChange, BalanceChange } from './transactionTracer';

export interface StateAnalysis {
    transactionHash: string;
    totalBalanceChanges: number;
    totalStorageChanges: number;
    largestBalanceChange: BalanceChange | null;
    largestStorageChange: StorageChange | null;
    addressesAffected: Set<string>;
    contractsCreated: number;
    contractsDestroyed: number;
    suspiciousPatterns: string[];
    riskFactors: RiskFactors;
}

export interface RiskFactors {
    hasLargeValueTransfer: boolean;
    hasMultipleBalanceChanges: boolean;
    hasStorageModification: boolean;
    hasContractCreation: boolean;
    hasContractDestruction: boolean;
    hasUnexpectedStateChange: boolean;
    largeValueThreshold: string;
}

export class StateAnalyzer {
    private largeValueThreshold: string = '1000000000000000000'; // 1 ETH in wei

    /**
     * Analyze a transaction trace for state changes
     */
    analyzeTrace(trace: TransactionTrace): StateAnalysis {
        const analysis: StateAnalysis = {
            transactionHash: trace.transactionHash,
            totalBalanceChanges: trace.balanceChanges.length,
            totalStorageChanges: trace.storageChanges.length,
            largestBalanceChange: this.findLargestBalanceChange(trace.balanceChanges),
            largestStorageChange: this.findLargestStorageChange(trace.storageChanges),
            addressesAffected: this.getAffectedAddresses(trace),
            contractsCreated: trace.contractsCreated.length,
            contractsDestroyed: trace.contractsDestroyed.length,
            suspiciousPatterns: [],
            riskFactors: {
                hasLargeValueTransfer: false,
                hasMultipleBalanceChanges: false,
                hasStorageModification: false,
                hasContractCreation: false,
                hasContractDestruction: false,
                hasUnexpectedStateChange: false,
                largeValueThreshold: this.largeValueThreshold
            }
        };

        // Detect risk factors
        this.detectRiskFactors(trace, analysis);

        // Detect suspicious patterns
        this.detectSuspiciousPatterns(trace, analysis);

        return analysis;
    }

    /**
     * Find the largest balance change
     */
    private findLargestBalanceChange(changes: BalanceChange[]): BalanceChange | null {
        if (changes.length === 0) return null;

        let largest = changes[0];
        let largestDiff = this.calculateDifference(changes[0].before, changes[0].after);

        for (let i = 1; i < changes.length; i++) {
            const diff = this.calculateDifference(changes[i].before, changes[i].after);
            if (diff > largestDiff) {
                largest = changes[i];
                largestDiff = diff;
            }
        }

        return largest;
    }

    /**
     * Find the largest storage change
     */
    private findLargestStorageChange(changes: StorageChange[]): StorageChange | null {
        if (changes.length === 0) return null;

        let largest = changes[0];
        let largestDiff = this.calculateDifference(changes[0].before, changes[0].after);

        for (let i = 1; i < changes.length; i++) {
            const diff = this.calculateDifference(changes[i].before, changes[i].after);
            if (diff > largestDiff) {
                largest = changes[i];
                largestDiff = diff;
            }
        }

        return largest;
    }

    /**
     * Calculate the difference between two hex values
     */
    private calculateDifference(before: string, after: string): number {
        try {
            const beforeBig = BigInt(before);
            const afterBig = BigInt(after);
            const diff = afterBig > beforeBig ? afterBig - beforeBig : beforeBig - afterBig;
            return Number(diff);
        } catch {
            return 0;
        }
    }

    /**
     * Get all affected addresses
     */
    private getAffectedAddresses(trace: TransactionTrace): Set<string> {
        const addresses = new Set<string>();

        addresses.add(trace.from.toLowerCase());
        addresses.add(trace.to.toLowerCase());

        trace.balanceChanges.forEach(change => {
            addresses.add(change.address.toLowerCase());
        });

        trace.storageChanges.forEach(change => {
            addresses.add(change.address.toLowerCase());
        });

        trace.eventLogs.forEach(log => {
            addresses.add(log.address.toLowerCase());
        });

        trace.contractsCreated.forEach(addr => {
            addresses.add(addr.toLowerCase());
        });

        trace.contractsDestroyed.forEach(addr => {
            addresses.add(addr.toLowerCase());
        });

        return addresses;
    }

    /**
     * Detect risk factors in the trace
     */
    private detectRiskFactors(trace: TransactionTrace, analysis: StateAnalysis): void {
        // Check for large value transfers
        if (trace.balanceChanges.length > 0) {
            const largestChange = analysis.largestBalanceChange;
            if (largestChange) {
                const diff = this.calculateDifference(largestChange.before, largestChange.after);
                if (diff > parseInt(this.largeValueThreshold)) {
                    analysis.riskFactors.hasLargeValueTransfer = true;
                }
            }
        }

        // Check for multiple balance changes
        if (trace.balanceChanges.length > 3) {
            analysis.riskFactors.hasMultipleBalanceChanges = true;
        }

        // Check for storage modifications
        if (trace.storageChanges.length > 0) {
            analysis.riskFactors.hasStorageModification = true;
        }

        // Check for contract creation
        if (trace.contractsCreated.length > 0) {
            analysis.riskFactors.hasContractCreation = true;
        }

        // Check for contract destruction
        if (trace.contractsDestroyed.length > 0) {
            analysis.riskFactors.hasContractDestruction = true;
        }

        // Check for unexpected state changes
        if (trace.status === 'reverted' || trace.status === 'failed') {
            analysis.riskFactors.hasUnexpectedStateChange = true;
        }
    }

    /**
     * Detect suspicious patterns
     */
    private detectSuspiciousPatterns(trace: TransactionTrace, analysis: StateAnalysis): void {
        // Pattern 1: Rapid balance changes to multiple addresses
        if (trace.balanceChanges.length > 5) {
            analysis.suspiciousPatterns.push('RAPID_MULTI_ADDRESS_TRANSFERS');
        }

        // Pattern 2: Contract creation followed by immediate destruction
        if (trace.contractsCreated.length > 0 && trace.contractsDestroyed.length > 0) {
            analysis.suspiciousPatterns.push('CONTRACT_CREATION_DESTRUCTION_CYCLE');
        }

        // Pattern 3: Large value transfer to unknown address
        if (analysis.largestBalanceChange) {
            const diff = this.calculateDifference(
                analysis.largestBalanceChange.before,
                analysis.largestBalanceChange.after
            );
            if (diff > parseInt(this.largeValueThreshold)) {
                analysis.suspiciousPatterns.push('LARGE_VALUE_TRANSFER');
            }
        }

        // Pattern 4: Deep call stack (potential reentrancy)
        const callDepth = this.getMaxCallDepth(trace);
        if (callDepth > 5) {
            analysis.suspiciousPatterns.push('DEEP_CALL_STACK');
        }

        // Pattern 5: Storage modification to critical slots
        const criticalSlots = this.detectCriticalStorageModification(trace);
        if (criticalSlots.length > 0) {
            analysis.suspiciousPatterns.push('CRITICAL_STORAGE_MODIFICATION');
        }

        // Pattern 6: Failed transaction with state changes
        if (trace.status !== 'success' && trace.balanceChanges.length > 0) {
            analysis.suspiciousPatterns.push('FAILED_TX_WITH_STATE_CHANGES');
        }
    }

    /**
     * Get maximum call depth
     */
    private getMaxCallDepth(trace: TransactionTrace): number {
        let maxDepth = 0;

        const getDepth = (calls: any[]): number => {
            let depth = 0;
            for (const call of calls) {
                depth = Math.max(depth, 1 + (call.calls ? getDepth(call.calls) : 0));
            }
            return depth;
        };

        return getDepth(trace.callTraces);
    }

    /**
     * Detect modifications to critical storage slots
     */
    private detectCriticalStorageModification(trace: TransactionTrace): StorageChange[] {
        const criticalSlots = [
            '0x0', // Owner slot
            '0x1', // Balance slot
            '0x2', // Allowance slot
        ];

        return trace.storageChanges.filter(change =>
            criticalSlots.includes(change.slot.toLowerCase())
        );
    }

    /**
     * Set the large value threshold
     */
    setLargeValueThreshold(threshold: string): void {
        this.largeValueThreshold = threshold;
    }

    /**
     * Get the large value threshold
     */
    getLargeValueThreshold(): string {
        return this.largeValueThreshold;
    }

    /**
     * Analyze balance changes for a specific address
     */
    analyzeAddressBalanceChanges(trace: TransactionTrace, address: string): BalanceChange[] {
        return trace.balanceChanges.filter(change =>
            change.address.toLowerCase() === address.toLowerCase()
        );
    }

    /**
     * Analyze storage changes for a specific address
     */
    analyzeAddressStorageChanges(trace: TransactionTrace, address: string): StorageChange[] {
        return trace.storageChanges.filter(change =>
            change.address.toLowerCase() === address.toLowerCase()
        );
    }

    /**
     * Calculate total value transferred
     */
    calculateTotalValueTransferred(trace: TransactionTrace): string {
        let total = BigInt(0);

        for (const change of trace.balanceChanges) {
            try {
                const before = BigInt(change.before);
                const after = BigInt(change.after);
                if (after > before) {
                    total += after - before;
                }
            } catch {
                // Skip invalid values
            }
        }

        return total.toString();
    }
}
