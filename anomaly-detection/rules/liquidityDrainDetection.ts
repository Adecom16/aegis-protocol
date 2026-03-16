/**
 * Liquidity Drain Detection
 * Detects abnormal liquidity drain patterns in transaction traces.
 */

export interface LiquidityDrainPattern {
    detected: boolean;
    confidence: number;
    drainPercentage: number;
    affectedTokens: string[];
    drainAmount: string;
    timeWindow: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Detect liquidity drain patterns
 */
export function detectLiquidityDrain(preBalance: number, postBalance: number): boolean {
    const pattern = analyzeLiquidityDrainPattern(preBalance, postBalance);
    return pattern.detected && pattern.confidence > 0.6;
}

/**
 * Analyze liquidity drain pattern details
 */
export function analyzeLiquidityDrainPattern(
    preBalance: number,
    postBalance: number,
    affectedTokens: string[] = [],
    timeWindow: number = 1
): LiquidityDrainPattern {
    const pattern: LiquidityDrainPattern = {
        detected: false,
        confidence: 0,
        drainPercentage: 0,
        affectedTokens,
        drainAmount: '0',
        timeWindow,
        severity: 'LOW'
    };

    if (preBalance <= 0) {
        return pattern;
    }

    // Calculate drain percentage
    const drain = preBalance - postBalance;
    const drainPercentage = (drain / preBalance) * 100;

    pattern.drainAmount = drain.toString();
    pattern.drainPercentage = drainPercentage;

    // Detect drain patterns
    if (drainPercentage > 50) {
        // Severe drain (>50%)
        pattern.detected = true;
        pattern.confidence = 0.95;
        pattern.severity = 'CRITICAL';
    } else if (drainPercentage > 30) {
        // High drain (30-50%)
        pattern.detected = true;
        pattern.confidence = 0.85;
        pattern.severity = 'HIGH';
    } else if (drainPercentage > 15) {
        // Medium drain (15-30%)
        pattern.detected = true;
        pattern.confidence = 0.7;
        pattern.severity = 'MEDIUM';
    } else if (drainPercentage > 5) {
        // Low drain (5-15%)
        pattern.detected = true;
        pattern.confidence = 0.5;
        pattern.severity = 'LOW';
    }

    return pattern;
}

/**
 * Detect multi-token drain
 */
export function detectMultiTokenDrain(
    tokenBalances: Map<string, { before: number; after: number }>
): LiquidityDrainPattern {
    const pattern: LiquidityDrainPattern = {
        detected: false,
        confidence: 0,
        drainPercentage: 0,
        affectedTokens: [],
        drainAmount: '0',
        timeWindow: 1,
        severity: 'LOW'
    };

    let totalDrain = 0;
    let totalBefore = 0;
    const drainedTokens: string[] = [];

    for (const [token, balances] of tokenBalances) {
        const drain = balances.before - balances.after;
        if (drain > 0) {
            totalDrain += drain;
            drainedTokens.push(token);
        }
        totalBefore += balances.before;
    }

    if (totalBefore === 0) {
        return pattern;
    }

    const drainPercentage = (totalDrain / totalBefore) * 100;

    pattern.affectedTokens = drainedTokens;
    pattern.drainAmount = totalDrain.toString();
    pattern.drainPercentage = drainPercentage;

    // Multi-token drain is more suspicious
    if (drainedTokens.length >= 2) {
        if (drainPercentage > 30) {
            pattern.detected = true;
            pattern.confidence = 0.9;
            pattern.severity = 'CRITICAL';
        } else if (drainPercentage > 15) {
            pattern.detected = true;
            pattern.confidence = 0.8;
            pattern.severity = 'HIGH';
        } else if (drainPercentage > 5) {
            pattern.detected = true;
            pattern.confidence = 0.6;
            pattern.severity = 'MEDIUM';
        }
    }

    return pattern;
}

/**
 * Calculate liquidity drain risk score
 */
export function calculateLiquidityDrainRiskScore(pattern: LiquidityDrainPattern): number {
    let score = 0;

    if (!pattern.detected) {
        return 0;
    }

    // Base score based on drain percentage
    score += (pattern.drainPercentage / 100) * 50;

    // Severity multiplier
    switch (pattern.severity) {
        case 'CRITICAL':
            score += 40;
            break;
        case 'HIGH':
            score += 30;
            break;
        case 'MEDIUM':
            score += 15;
            break;
        case 'LOW':
            score += 5;
            break;
    }

    // Additional score for multiple affected tokens
    if (pattern.affectedTokens.length > 1) {
        score += 10;
    }

    // Confidence multiplier
    score *= pattern.confidence;

    return Math.min(score, 100);
}

/**
 * Get liquidity drain risk description
 */
export function getLiquidityDrainRiskDescription(pattern: LiquidityDrainPattern): string {
    if (!pattern.detected) {
        return 'No liquidity drain detected';
    }

    const parts: string[] = [];

    parts.push(`Drain: ${pattern.drainPercentage.toFixed(2)}%`);
    parts.push(`Severity: ${pattern.severity}`);

    if (pattern.affectedTokens.length > 0) {
        parts.push(`Tokens: ${pattern.affectedTokens.length}`);
    }

    return parts.join('; ');
}

/**
 * Detect rapid drain (drain within short time window)
 */
export function detectRapidDrain(
    drainHistory: Array<{ timestamp: number; drain: number }>
): boolean {
    if (drainHistory.length < 2) {
        return false;
    }

    // Sort by timestamp
    drainHistory.sort((a, b) => a.timestamp - b.timestamp);

    // Check for rapid drains within 1 minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentDrains = drainHistory.filter(d => d.timestamp > oneMinuteAgo);

    if (recentDrains.length >= 3) {
        return true;
    }

    // Check for cumulative drain
    const totalDrain = recentDrains.reduce((sum, d) => sum + d.drain, 0);
    return totalDrain > 1000000; // Arbitrary threshold
}

/**
 * Detect drain to suspicious address
 */
export function detectDrainToSuspiciousAddress(
    drainAddress: string,
    knownSuspiciousAddresses: Set<string>
): boolean {
    return knownSuspiciousAddresses.has(drainAddress.toLowerCase());
}
