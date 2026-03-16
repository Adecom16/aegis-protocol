/**
 * Flash Loan Detection
 * Detects flash loan exploit patterns in transaction traces.
 */

import { CallTrace } from '../../simulation-engine/src/transactionTracer';

export interface FlashLoanPattern {
    detected: boolean;
    confidence: number;
    borrowAmount: string;
    repayAmount: string;
    profitAmount: string;
    pools: string[];
    callSequence: string[];
}

/**
 * Detect flash loan patterns in transaction traces
 */
export function detectFlashLoan(traces: CallTrace[]): boolean {
    const pattern = analyzeFlashLoanPattern(traces);
    return pattern.detected && pattern.confidence > 0.7;
}

/**
 * Analyze flash loan pattern details
 */
export function analyzeFlashLoanPattern(traces: CallTrace[]): FlashLoanPattern {
    const pattern: FlashLoanPattern = {
        detected: false,
        confidence: 0,
        borrowAmount: '0',
        repayAmount: '0',
        profitAmount: '0',
        pools: [],
        callSequence: []
    };

    if (!traces || traces.length === 0) {
        return pattern;
    }

    // Collect all calls in sequence
    const callSequence: CallTrace[] = [];
    const collectCalls = (calls: CallTrace[]) => {
        for (const call of calls) {
            callSequence.push(call);
            if (call.calls) {
                collectCalls(call.calls);
            }
        }
    };

    collectCalls(traces);

    // Look for flash loan patterns
    // Pattern 1: Borrow -> Execute -> Repay
    for (let i = 0; i < callSequence.length - 2; i++) {
        const call1 = callSequence[i];
        const call2 = callSequence[i + 1];
        const call3 = callSequence[i + 2];

        // Check for flashLoan function call
        if (isFlashLoanBorrow(call1)) {
            pattern.pools.push(call1.to);
            pattern.borrowAmount = call1.value;
            pattern.callSequence.push('BORROW');

            // Check for execution calls
            if (isComplexExecution(call2)) {
                pattern.callSequence.push('EXECUTE');

                // Check for repayment
                if (isFlashLoanRepay(call3)) {
                    pattern.repayAmount = call3.value;
                    pattern.callSequence.push('REPAY');

                    // Calculate profit
                    try {
                        const borrow = BigInt(pattern.borrowAmount);
                        const repay = BigInt(pattern.repayAmount);
                        if (repay > borrow) {
                            pattern.profitAmount = (repay - borrow).toString();
                            pattern.detected = true;
                            pattern.confidence = 0.95;
                        }
                    } catch {
                        // Continue analysis
                    }
                }
            }
        }
    }

    // Pattern 2: Multiple pool interactions (flash loan aggregation)
    if (!pattern.detected) {
        const borrowCalls = callSequence.filter(call => isFlashLoanBorrow(call));
        if (borrowCalls.length >= 2) {
            pattern.detected = true;
            pattern.confidence = 0.8;
            pattern.pools = borrowCalls.map(call => call.to);
            pattern.callSequence.push('MULTI_POOL_BORROW');
        }
    }

    // Pattern 3: Unusual call depth with token transfers
    if (!pattern.detected && callSequence.length > 10) {
        const tokenTransfers = callSequence.filter(call =>
            call.input.startsWith('0xa9059cbb') || // transfer
            call.input.startsWith('0x23b872dd')    // transferFrom
        );

        if (tokenTransfers.length >= 3) {
            pattern.detected = true;
            pattern.confidence = 0.6;
            pattern.callSequence.push('MULTI_TOKEN_TRANSFER');
        }
    }

    return pattern;
}

/**
 * Check if a call is a flash loan borrow
 */
function isFlashLoanBorrow(call: CallTrace): boolean {
    if (!call.input) return false;

    // Common flash loan function signatures
    const flashLoanSignatures = [
        '0xab9c4b5d', // flashLoan (Aave)
        '0x0efe6a8b', // flashLoan (dYdX)
        '0x5cfe8d3c', // flashLoan (Uniswap V3)
        '0xbce3b715', // flashLoan (Balancer)
    ];

    const functionSelector = call.input.slice(0, 10);
    return flashLoanSignatures.includes(functionSelector);
}

/**
 * Check if a call is a flash loan repayment
 */
function isFlashLoanRepay(call: CallTrace): boolean {
    if (!call.input) return false;

    // Common repayment patterns
    const repaymentSignatures = [
        '0xa9059cbb', // transfer
        '0x23b872dd', // transferFrom
        '0x3d18b912', // executeOperation (Aave)
    ];

    const functionSelector = call.input.slice(0, 10);
    return repaymentSignatures.includes(functionSelector);
}

/**
 * Check if a call represents complex execution
 */
function isComplexExecution(call: CallTrace): boolean {
    // Complex execution typically involves multiple nested calls
    if (!call.calls || call.calls.length === 0) {
        return false;
    }

    // Check for multiple levels of nesting
    const hasDeepNesting = call.calls.some(c => c.calls && c.calls.length > 0);
    return hasDeepNesting || call.calls.length >= 2;
}

/**
 * Calculate flash loan risk score
 */
export function calculateFlashLoanRiskScore(pattern: FlashLoanPattern): number {
    let score = 0;

    if (!pattern.detected) {
        return 0;
    }

    // Base score for detection
    score += pattern.confidence * 50;

    // Additional score for multiple pools
    if (pattern.pools.length > 1) {
        score += 20;
    }

    // Additional score for profit
    try {
        const profit = BigInt(pattern.profitAmount);
        if (profit > BigInt(0)) {
            score += 20;
        }
    } catch {
        // Continue
    }

    // Additional score for complex call sequence
    if (pattern.callSequence.length > 3) {
        score += 10;
    }

    return Math.min(score, 100);
}

/**
 * Get flash loan risk description
 */
export function getFlashLoanRiskDescription(pattern: FlashLoanPattern): string {
    if (!pattern.detected) {
        return 'No flash loan pattern detected';
    }

    const parts: string[] = [];

    if (pattern.pools.length > 0) {
        parts.push(`Pools involved: ${pattern.pools.length}`);
    }

    if (pattern.profitAmount !== '0') {
        parts.push(`Potential profit: ${pattern.profitAmount}`);
    }

    if (pattern.callSequence.length > 0) {
        parts.push(`Call sequence: ${pattern.callSequence.join(' -> ')}`);
    }

    return parts.join('; ') || 'Flash loan pattern detected';
}
