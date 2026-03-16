/**
 * Mempool Watcher
 * Monitors the mempool for pending transactions targeting protected contracts.
 */

import { ethers } from 'ethers';

export interface PendingTransaction {
    hash: string;
    from: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gasLimit: string;
    nonce: number;
    timestamp: number;
}

export interface MempoolStats {
    totalTransactions: number;
    transactionsPerSecond: number;
    averageGasPrice: string;
    highValueTransactions: number;
}

export class MempoolWatcher {
    private provider: ethers.Provider;
    private protectedContracts: Set<string> = new Set();
    private pendingTransactions: Map<string, PendingTransaction> = new Map();
    private listeners: Array<(tx: PendingTransaction) => void> = [];
    private isWatching = false;
    private lastUpdateTime = Date.now();
    private transactionCount = 0;

    constructor(rpcUrl: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    /**
     * Register a protected contract
     */
    registerProtectedContract(address: string): void {
        this.protectedContracts.add(address.toLowerCase());
    }

    /**
     * Unregister a protected contract
     */
    unregisterProtectedContract(address: string): void {
        this.protectedContracts.delete(address.toLowerCase());
    }

    /**
     * Get all protected contracts
     */
    getProtectedContracts(): string[] {
        return Array.from(this.protectedContracts);
    }

    /**
     * Start watching the mempool
     */
    async startWatching(): Promise<void> {
        if (this.isWatching) {
            return;
        }

        this.isWatching = true;

        try {
            // Subscribe to pending transactions
            this.provider.on('pending', async (txHash: string) => {
                try {
                    const tx = await this.provider.getTransaction(txHash);
                    if (tx) {
                        await this.processPendingTransaction(tx);
                    }
                } catch (error) {
                    console.error(`Error processing transaction ${txHash}:`, error);
                }
            });
        } catch (error) {
            console.error('Error starting mempool watcher:', error);
            this.isWatching = false;
        }
    }

    /**
     * Stop watching the mempool
     */
    stopWatching(): void {
        if (!this.isWatching) {
            return;
        }

        this.isWatching = false;
        this.provider.removeAllListeners('pending');
    }

    /**
     * Process a pending transaction
     */
    private async processPendingTransaction(tx: ethers.TransactionResponse): Promise<void> {
        // Check if transaction targets a protected contract
        if (!tx.to || !this.protectedContracts.has(tx.to.toLowerCase())) {
            return;
        }

        const pendingTx: PendingTransaction = {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            data: tx.data,
            value: tx.value.toString(),
            gasPrice: tx.gasPrice?.toString() || '0',
            gasLimit: tx.gasLimit.toString(),
            nonce: tx.nonce,
            timestamp: Date.now()
        };

        // Store the transaction
        this.pendingTransactions.set(tx.hash, pendingTx);
        this.transactionCount++;

        // Notify listeners
        this.notifyListeners(pendingTx);
    }

    /**
     * Register a listener for pending transactions
     */
    onPendingTransaction(callback: (tx: PendingTransaction) => void): void {
        this.listeners.push(callback);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(tx: PendingTransaction): void {
        for (const listener of this.listeners) {
            try {
                listener(tx);
            } catch (error) {
                console.error('Error in listener:', error);
            }
        }
    }

    /**
     * Get pending transaction
     */
    getPendingTransaction(hash: string): PendingTransaction | undefined {
        return this.pendingTransactions.get(hash);
    }

    /**
     * Get all pending transactions
     */
    getAllPendingTransactions(): PendingTransaction[] {
        return Array.from(this.pendingTransactions.values());
    }

    /**
     * Get pending transactions for a specific contract
     */
    getPendingTransactionsForContract(contractAddress: string): PendingTransaction[] {
        return Array.from(this.pendingTransactions.values()).filter(
            tx => tx.to.toLowerCase() === contractAddress.toLowerCase()
        );
    }

    /**
     * Remove a pending transaction
     */
    removePendingTransaction(hash: string): void {
        this.pendingTransactions.delete(hash);
    }

    /**
     * Clear all pending transactions
     */
    clearPendingTransactions(): void {
        this.pendingTransactions.clear();
    }

    /**
     * Get mempool statistics
     */
    getMempoolStats(): MempoolStats {
        const transactions = Array.from(this.pendingTransactions.values());
        const now = Date.now();
        const timeDiff = (now - this.lastUpdateTime) / 1000; // seconds

        let totalGasPrice = BigInt(0);
        let highValueCount = 0;

        for (const tx of transactions) {
            try {
                totalGasPrice += BigInt(tx.gasPrice);
                if (BigInt(tx.value) > BigInt('1000000000000000000')) {
                    // > 1 ETH
                    highValueCount++;
                }
            } catch {
                // Skip invalid values
            }
        }

        const avgGasPrice = transactions.length > 0
            ? (totalGasPrice / BigInt(transactions.length)).toString()
            : '0';

        return {
            totalTransactions: transactions.length,
            transactionsPerSecond: timeDiff > 0 ? this.transactionCount / timeDiff : 0,
            averageGasPrice: avgGasPrice,
            highValueTransactions: highValueCount
        };
    }

    /**
     * Filter transactions by criteria
     */
    filterTransactions(criteria: {
        minValue?: string;
        maxValue?: string;
        from?: string;
        to?: string;
    }): PendingTransaction[] {
        return Array.from(this.pendingTransactions.values()).filter(tx => {
            if (criteria.minValue && BigInt(tx.value) < BigInt(criteria.minValue)) {
                return false;
            }
            if (criteria.maxValue && BigInt(tx.value) > BigInt(criteria.maxValue)) {
                return false;
            }
            if (criteria.from && tx.from.toLowerCase() !== criteria.from.toLowerCase()) {
                return false;
            }
            if (criteria.to && tx.to.toLowerCase() !== criteria.to.toLowerCase()) {
                return false;
            }
            return true;
        });
    }

    /**
     * Check if watcher is active
     */
    isActive(): boolean {
        return this.isWatching;
    }

    /**
     * Get transaction count
     */
    getTransactionCount(): number {
        return this.transactionCount;
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.transactionCount = 0;
        this.lastUpdateTime = Date.now();
    }
}
