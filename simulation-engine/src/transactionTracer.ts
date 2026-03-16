/**
 * TransactionTracer
 * Traces transaction execution and captures all state changes, calls, and events.
 */

export interface CallTrace {
    type: 'call' | 'delegatecall' | 'staticcall' | 'create' | 'create2';
    from: string;
    to: string;
    input: string;
    output: string;
    value: string;
    gas: number;
    gasUsed: number;
    error?: string;
    depth: number;
    calls?: CallTrace[];
}

export interface StorageChange {
    address: string;
    slot: string;
    before: string;
    after: string;
}

export interface BalanceChange {
    address: string;
    before: string;
    after: string;
}

export interface EventLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber: number;
    transactionHash: string;
    logIndex: number;
}

export interface TransactionTrace {
    transactionHash: string;
    from: string;
    to: string;
    input: string;
    output: string;
    value: string;
    gas: number;
    gasUsed: number;
    status: 'success' | 'failed' | 'reverted';
    error?: string;
    callTraces: CallTrace[];
    storageChanges: StorageChange[];
    balanceChanges: BalanceChange[];
    eventLogs: EventLog[];
    contractsCreated: string[];
    contractsDestroyed: string[];
    depth: number;
}

export class TransactionTracer {
    private traces: Map<string, TransactionTrace> = new Map();

    /**
     * Create a trace for a transaction
     */
    createTrace(
        txHash: string,
        from: string,
        to: string,
        input: string,
        value: string = '0',
        gas: number = 21000
    ): TransactionTrace {
        const trace: TransactionTrace = {
            transactionHash: txHash,
            from,
            to,
            input,
            output: '0x',
            value,
            gas,
            gasUsed: 0,
            status: 'success',
            callTraces: [],
            storageChanges: [],
            balanceChanges: [],
            eventLogs: [],
            contractsCreated: [],
            contractsDestroyed: [],
            depth: 0
        };

        this.traces.set(txHash, trace);
        return trace;
    }

    /**
     * Add a call trace to a transaction
     */
    addCallTrace(
        txHash: string,
        callTrace: CallTrace
    ): void {
        const trace = this.traces.get(txHash);
        if (!trace) {
            throw new Error(`Transaction trace not found: ${txHash}`);
        }

        if (callTrace.depth === 0) {
            trace.callTraces.push(callTrace);
        } else {
            this.insertCallTraceAtDepth(trace.callTraces, callTrace, 0);
        }
    }

    /**
     * Recursively insert call trace at correct depth
     */
    private insertCallTraceAtDepth(
        traces: CallTrace[],
        newTrace: CallTrace,
        currentDepth: number
    ): boolean {
        for (const trace of traces) {
            if (currentDepth === newTrace.depth - 1) {
                if (!trace.calls) {
                    trace.calls = [];
                }
                trace.calls.push(newTrace);
                return true;
            }
            if (trace.calls && this.insertCallTraceAtDepth(trace.calls, newTrace, currentDepth + 1)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Record a storage change
     */
    recordStorageChange(
        txHash: string,
        address: string,
        slot: string,
        before: string,
        after: string
    ): void {
        const trace = this.traces.get(txHash);
        if (!trace) {
            throw new Error(`Transaction trace not found: ${txHash}`);
        }

        trace.storageChanges.push({
            address,
            slot,
            before,
            after
        });
    }

    /**
     * Record a balance change
     */
    recordBalanceChange(
        txHash: string,
        address: string,
        before: string,
        after: string
    ): void {
        const trace = this.traces.get(txHash);
        if (!trace) {
            throw new Error(`Transaction trace not found: ${txHash}`);
        }

        trace.balanceChanges.push({
            address,
            before,
            after
        });
    }

    /**
     * Record an event log
     */
    recordEventLog(
        txHash: string,
        eventLog: EventLog
    ): void {
        const trace = this.traces.get(txHash);
        if (!trace) {
            throw new Error(`Transaction trace not found: ${txHash}`);
        }

        trace.eventLogs.push(eventLog);
    }

    /**
     * Record contract creation
     */
    recordContractCreation(txHash: string, address: string): void {
        const trace = this.traces.get(txHash);
        if (!trace) {
            throw new Error(`Transaction trace not found: ${txHash}`);
        }

        trace.contractsCreated.push(address);
    }

    /**
     * Record contract destruction
     */
    recordContractDestruction(txHash: string, address: string): void {
        const trace = this.traces.get(txHash);
        if (!trace) {
            throw new Error(`Transaction trace not found: ${txHash}`);
        }

        trace.contractsDestroyed.push(address);
    }

    /**
     * Update transaction status and output
     */
    updateTransactionStatus(
        txHash: string,
        status: 'success' | 'failed' | 'reverted',
        output: string = '0x',
        gasUsed: number = 0,
        error?: string
    ): void {
        const trace = this.traces.get(txHash);
        if (!trace) {
            throw new Error(`Transaction trace not found: ${txHash}`);
        }

        trace.status = status;
        trace.output = output;
        trace.gasUsed = gasUsed;
        if (error) {
            trace.error = error;
        }
    }

    /**
     * Get a transaction trace
     */
    getTrace(txHash: string): TransactionTrace | undefined {
        return this.traces.get(txHash);
    }

    /**
     * Get all traces
     */
    getAllTraces(): TransactionTrace[] {
        return Array.from(this.traces.values());
    }

    /**
     * Clear all traces
     */
    clearTraces(): void {
        this.traces.clear();
    }

    /**
     * Get call depth for a transaction
     */
    getMaxCallDepth(txHash: string): number {
        const trace = this.traces.get(txHash);
        if (!trace) {
            return 0;
        }

        const getDepth = (calls: CallTrace[]): number => {
            let maxDepth = 0;
            for (const call of calls) {
                const depth = 1 + (call.calls ? getDepth(call.calls) : 0);
                maxDepth = Math.max(maxDepth, depth);
            }
            return maxDepth;
        };

        return getDepth(trace.callTraces);
    }

    /**
     * Get all external calls in a transaction
     */
    getExternalCalls(txHash: string): CallTrace[] {
        const trace = this.traces.get(txHash);
        if (!trace) {
            return [];
        }

        const calls: CallTrace[] = [];
        const collectCalls = (callTraces: CallTrace[]) => {
            for (const call of callTraces) {
                if (call.type === 'call' || call.type === 'delegatecall') {
                    calls.push(call);
                }
                if (call.calls) {
                    collectCalls(call.calls);
                }
            }
        };

        collectCalls(trace.callTraces);
        return calls;
    }

    /**
     * Get all storage accesses for an address
     */
    getStorageAccessesForAddress(txHash: string, address: string): StorageChange[] {
        const trace = this.traces.get(txHash);
        if (!trace) {
            return [];
        }

        return trace.storageChanges.filter(change => change.address.toLowerCase() === address.toLowerCase());
    }
}
