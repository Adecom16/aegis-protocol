/**
 * Oracle Manipulation Detection
 * Detects oracle price manipulation patterns in transaction traces.
 */

export interface OracleManipulationPattern {
    detected: boolean;
    confidence: number;
    priceDeviations: PriceDeviation[];
    affectedOracles: string[];
    manipulationType: 'PRICE_SPIKE' | 'PRICE_CRASH' | 'MULTI_ORACLE_DIVERGENCE' | 'NONE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PriceDeviation {
    oracle: string;
    token: string;
    priceBefore: string;
    priceAfter: string;
    deviationPercentage: number;
    timestamp: number;
}

/**
 * Detect oracle manipulation patterns
 */
export function detectOracleManipulation(
    priceUpdates: number[],
    threshold: number = 10
): boolean {
    const pattern = analyzeOracleManipulationPattern(priceUpdates, threshold);
    return pattern.detected && pattern.confidence > 0.6;
}

/**
 * Analyze oracle manipulation pattern details
 */
export function analyzeOracleManipulationPattern(
    priceUpdates: number[],
    threshold: number = 10
): OracleManipulationPattern {
    const pattern: OracleManipulationPattern = {
        detected: false,
        confidence: 0,
        priceDeviations: [],
        affectedOracles: [],
        manipulationType: 'NONE',
        severity: 'LOW'
    };

    if (!priceUpdates || priceUpdates.length < 2) {
        return pattern;
    }

    // Calculate price changes
    const priceChanges: number[] = [];
    for (let i = 1; i < priceUpdates.length; i++) {
        const change = ((priceUpdates[i] - priceUpdates[i - 1]) / priceUpdates[i - 1]) * 100;
        priceChanges.push(change);
    }

    // Detect price spikes or crashes
    const largeChanges = priceChanges.filter(change => Math.abs(change) > threshold);

    if (largeChanges.length > 0) {
        pattern.detected = true;
        pattern.confidence = Math.min(0.5 + (largeChanges.length * 0.1), 0.95);

        // Determine manipulation type
        const hasSpike = largeChanges.some(change => change > threshold);
        const hasCrash = largeChanges.some(change => change < -threshold);

        if (hasSpike && hasCrash) {
            pattern.manipulationType = 'PRICE_SPIKE';
            pattern.severity = 'HIGH';
        } else if (hasCrash) {
            pattern.manipulationType = 'PRICE_CRASH';
            pattern.severity = 'HIGH';
        } else {
            pattern.manipulationType = 'PRICE_SPIKE';
            pattern.severity = 'MEDIUM';
        }
    }

    return pattern;
}

/**
 * Detect multi-oracle divergence
 */
export function detectMultiOracleDivergence(
    oraclePrices: Map<string, number>,
    divergenceThreshold: number = 5
): OracleManipulationPattern {
    const pattern: OracleManipulationPattern = {
        detected: false,
        confidence: 0,
        priceDeviations: [],
        affectedOracles: [],
        manipulationType: 'NONE',
        severity: 'LOW'
    };

    if (oraclePrices.size < 2) {
        return pattern;
    }

    const prices = Array.from(oraclePrices.values());
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    let maxDeviation = 0;
    const deviations: Array<{ oracle: string; deviation: number }> = [];

    for (const [oracle, price] of oraclePrices) {
        const deviation = Math.abs((price - avgPrice) / avgPrice) * 100;
        deviations.push({ oracle, deviation });

        if (deviation > maxDeviation) {
            maxDeviation = deviation;
        }
    }

    if (maxDeviation > divergenceThreshold) {
        pattern.detected = true;
        pattern.confidence = Math.min(0.5 + (maxDeviation / 100), 0.95);
        pattern.manipulationType = 'MULTI_ORACLE_DIVERGENCE';
        pattern.affectedOracles = deviations
            .filter(d => d.deviation > divergenceThreshold)
            .map(d => d.oracle);

        if (maxDeviation > 20) {
            pattern.severity = 'CRITICAL';
        } else if (maxDeviation > 15) {
            pattern.severity = 'HIGH';
        } else if (maxDeviation > 10) {
            pattern.severity = 'MEDIUM';
        } else {
            pattern.severity = 'LOW';
        }
    }

    return pattern;
}

/**
 * Detect price feed manipulation
 */
export function detectPriceFeedManipulation(
    historicalPrices: number[],
    currentPrice: number,
    stdDevThreshold: number = 2
): boolean {
    if (historicalPrices.length < 2) {
        return false;
    }

    // Calculate mean and standard deviation
    const mean = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length;
    const variance = historicalPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / historicalPrices.length;
    const stdDev = Math.sqrt(variance);

    // Check if current price is an outlier
    const zScore = Math.abs((currentPrice - mean) / stdDev);
    return zScore > stdDevThreshold;
}

/**
 * Calculate oracle manipulation risk score
 */
export function calculateOracleManipulationRiskScore(pattern: OracleManipulationPattern): number {
    let score = 0;

    if (!pattern.detected) {
        return 0;
    }

    // Base score based on confidence
    score += pattern.confidence * 50;

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

    // Additional score for multiple affected oracles
    if (pattern.affectedOracles.length > 1) {
        score += 10;
    }

    // Manipulation type multiplier
    if (pattern.manipulationType === 'MULTI_ORACLE_DIVERGENCE') {
        score += 15;
    }

    return Math.min(score, 100);
}

/**
 * Get oracle manipulation risk description
 */
export function getOracleManipulationRiskDescription(pattern: OracleManipulationPattern): string {
    if (!pattern.detected) {
        return 'No oracle manipulation detected';
    }

    const parts: string[] = [];

    parts.push(`Type: ${pattern.manipulationType}`);
    parts.push(`Severity: ${pattern.severity}`);

    if (pattern.affectedOracles.length > 0) {
        parts.push(`Affected oracles: ${pattern.affectedOracles.length}`);
    }

    if (pattern.priceDeviations.length > 0) {
        const maxDeviation = Math.max(...pattern.priceDeviations.map(d => d.deviationPercentage));
        parts.push(`Max deviation: ${maxDeviation.toFixed(2)}%`);
    }

    return parts.join('; ');
}

/**
 * Detect flash loan + oracle manipulation combo
 */
export function detectFlashLoanOracleCombo(
    hasFlashLoan: boolean,
    hasOracleManipulation: boolean
): boolean {
    return hasFlashLoan && hasOracleManipulation;
}

/**
 * Validate oracle price consistency
 */
export function validateOraclePriceConsistency(
    oraclePrices: Map<string, number>,
    maxDeviation: number = 5
): { isConsistent: boolean; deviations: Map<string, number> } {
    const deviations = new Map<string, number>();

    if (oraclePrices.size < 2) {
        return { isConsistent: true, deviations };
    }

    const prices = Array.from(oraclePrices.values());
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    for (const [oracle, price] of oraclePrices) {
        const deviation = Math.abs((price - avgPrice) / avgPrice) * 100;
        deviations.set(oracle, deviation);
    }

    const isConsistent = Array.from(deviations.values()).every(d => d <= maxDeviation);
    return { isConsistent, deviations };
}
