/**
 * LiquidityImpact
 * Analyzes the impact of transactions on liquidity pools and price impact.
 */

import { TransactionTrace } from './transactionTracer';

export interface PoolState {
    address: string;
    token0: string;
    token1: string;
    reserve0: string;
    reserve1: string;
    fee: number;
}

export interface LiquidityAnalysis {
    transactionHash: string;
    affectedPools: PoolState[];
    priceImpacts: PriceImpact[];
    slippageRisks: SlippageRisk[];
    liquidityDrainDetected: boolean;
    mevRiskDetected: boolean;
    totalLiquidityAffected: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PriceImpact {
    poolAddress: string;
    token: string;
    priceChangeBefore: string;
    priceChangeAfter: string;
    percentageChange: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SlippageRisk {
    poolAddress: string;
    expectedOutput: string;
    minimumOutput: string;
    slippagePercentage: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class LiquidityImpactAnalyzer {
    private knownPools: Map<string, PoolState> = new Map();
    private priceThresholds = {
        low: 1,      // 1% price change
        medium: 5,   // 5% price change
        high: 10     // 10% price change
    };

    /**
     * Register a known liquidity pool
     */
    registerPool(pool: PoolState): void {
        this.knownPools.set(pool.address.toLowerCase(), pool);
    }

    /**
     * Analyze liquidity impact of a transaction
     */
    analyzeLiquidityImpact(trace: TransactionTrace): LiquidityAnalysis {
        const analysis: LiquidityAnalysis = {
            transactionHash: trace.transactionHash,
            affectedPools: [],
            priceImpacts: [],
            slippageRisks: [],
            liquidityDrainDetected: false,
            mevRiskDetected: false,
            totalLiquidityAffected: '0',
            riskLevel: 'LOW'
        };

        // Detect affected pools
        this.detectAffectedPools(trace, analysis);

        // Analyze price impacts
        this.analyzePriceImpacts(trace, analysis);

        // Detect slippage risks
        this.detectSlippageRisks(trace, analysis);

        // Detect liquidity drain
        this.detectLiquidityDrain(trace, analysis);

        // Detect MEV risks
        this.detectMEVRisks(trace, analysis);

        // Determine overall risk level
        this.determineRiskLevel(analysis);

        return analysis;
    }

    /**
     * Detect pools affected by the transaction
     */
    private detectAffectedPools(trace: TransactionTrace, analysis: LiquidityAnalysis): void {
        const affectedAddresses = new Set<string>();

        // Collect all addresses involved in the transaction
        trace.balanceChanges.forEach(change => {
            affectedAddresses.add(change.address.toLowerCase());
        });

        trace.storageChanges.forEach(change => {
            affectedAddresses.add(change.address.toLowerCase());
        });

        // Check if any affected addresses are known pools
        for (const [poolAddr, pool] of this.knownPools) {
            if (affectedAddresses.has(poolAddr)) {
                analysis.affectedPools.push(pool);
            }
        }
    }

    /**
     * Analyze price impacts on affected pools
     */
    private analyzePriceImpacts(trace: TransactionTrace, analysis: LiquidityAnalysis): void {
        for (const pool of analysis.affectedPools) {
            // Simulate price impact based on balance changes
            const token0Changes = trace.balanceChanges.filter(
                change => change.address.toLowerCase() === pool.token0.toLowerCase()
            );

            const token1Changes = trace.balanceChanges.filter(
                change => change.address.toLowerCase() === pool.token1.toLowerCase()
            );

            if (token0Changes.length > 0) {
                const impact = this.calculatePriceImpact(
                    pool,
                    token0Changes[0],
                    'token0'
                );
                if (impact) {
                    analysis.priceImpacts.push(impact);
                }
            }

            if (token1Changes.length > 0) {
                const impact = this.calculatePriceImpact(
                    pool,
                    token1Changes[0],
                    'token1'
                );
                if (impact) {
                    analysis.priceImpacts.push(impact);
                }
            }
        }
    }

    /**
     * Calculate price impact for a token
     */
    private calculatePriceImpact(
        pool: PoolState,
        balanceChange: any,
        token: 'token0' | 'token1'
    ): PriceImpact | null {
        try {
            const before = BigInt(balanceChange.before);
            const after = BigInt(balanceChange.after);
            const change = after > before ? after - before : before - after;

            const reserve = token === 'token0' ? BigInt(pool.reserve0) : BigInt(pool.reserve1);
            const percentageChange = Number((change * BigInt(100)) / reserve);

            let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
            if (percentageChange > this.priceThresholds.high) {
                severity = 'HIGH';
            } else if (percentageChange > this.priceThresholds.medium) {
                severity = 'MEDIUM';
            }

            return {
                poolAddress: pool.address,
                token: token === 'token0' ? pool.token0 : pool.token1,
                priceChangeBefore: balanceChange.before,
                priceChangeAfter: balanceChange.after,
                percentageChange,
                severity
            };
        } catch {
            return null;
        }
    }

    /**
     * Detect slippage risks
     */
    private detectSlippageRisks(trace: TransactionTrace, analysis: LiquidityAnalysis): void {
        // Analyze balance changes for slippage patterns
        for (const pool of analysis.affectedPools) {
            const balanceChanges = trace.balanceChanges.filter(
                change => change.address.toLowerCase() === pool.address.toLowerCase()
            );

            for (const change of balanceChanges) {
                try {
                    const before = BigInt(change.before);
                    const after = BigInt(change.after);

                    if (before > after) {
                        const slippage = Number(((before - after) * BigInt(100)) / before);

                        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
                        if (slippage > 10) {
                            riskLevel = 'HIGH';
                        } else if (slippage > 5) {
                            riskLevel = 'MEDIUM';
                        }

                        analysis.slippageRisks.push({
                            poolAddress: pool.address,
                            expectedOutput: before.toString(),
                            minimumOutput: after.toString(),
                            slippagePercentage: slippage,
                            riskLevel
                        });
                    }
                } catch {
                    // Skip invalid values
                }
            }
        }
    }

    /**
     * Detect liquidity drain patterns
     */
    private detectLiquidityDrain(trace: TransactionTrace, analysis: LiquidityAnalysis): void {
        for (const pool of analysis.affectedPools) {
            const balanceChanges = trace.balanceChanges.filter(
                change => change.address.toLowerCase() === pool.address.toLowerCase()
            );

            for (const change of balanceChanges) {
                try {
                    const before = BigInt(change.before);
                    const after = BigInt(change.after);

                    if (before > after) {
                        const drainPercentage = Number(((before - after) * BigInt(100)) / before);

                        // Drain > 20% is considered suspicious
                        if (drainPercentage > 20) {
                            analysis.liquidityDrainDetected = true;
                            analysis.totalLiquidityAffected = (before - after).toString();
                        }
                    }
                } catch {
                    // Skip invalid values
                }
            }
        }
    }

    /**
     * Detect MEV risks (sandwich attacks, front-running)
     */
    private detectMEVRisks(trace: TransactionTrace, analysis: LiquidityAnalysis): void {
        // Check for patterns indicative of MEV attacks
        if (analysis.priceImpacts.length > 0) {
            const highImpactCount = analysis.priceImpacts.filter(
                impact => impact.severity === 'HIGH'
            ).length;

            if (highImpactCount > 0 && analysis.affectedPools.length > 1) {
                analysis.mevRiskDetected = true;
            }
        }

        // Check for rapid sequential swaps (sandwich attack pattern)
        const externalCalls = this.getExternalCalls(trace);
        if (externalCalls.length > 3) {
            analysis.mevRiskDetected = true;
        }
    }

    /**
     * Get external calls from trace
     */
    private getExternalCalls(trace: TransactionTrace): any[] {
        const calls: any[] = [];

        const collectCalls = (callTraces: any[]) => {
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
     * Determine overall risk level
     */
    private determineRiskLevel(analysis: LiquidityAnalysis): void {
        let riskScore = 0;

        if (analysis.liquidityDrainDetected) {
            riskScore += 40;
        }

        if (analysis.mevRiskDetected) {
            riskScore += 30;
        }

        const highImpactCount = analysis.priceImpacts.filter(
            impact => impact.severity === 'HIGH'
        ).length;
        riskScore += highImpactCount * 15;

        const highSlippageCount = analysis.slippageRisks.filter(
            risk => risk.riskLevel === 'HIGH'
        ).length;
        riskScore += highSlippageCount * 10;

        if (riskScore >= 70) {
            analysis.riskLevel = 'CRITICAL';
        } else if (riskScore >= 50) {
            analysis.riskLevel = 'HIGH';
        } else if (riskScore >= 25) {
            analysis.riskLevel = 'MEDIUM';
        } else {
            analysis.riskLevel = 'LOW';
        }
    }

    /**
     * Set price thresholds
     */
    setPriceThresholds(low: number, medium: number, high: number): void {
        this.priceThresholds = { low, medium, high };
    }

    /**
     * Get all registered pools
     */
    getRegisteredPools(): PoolState[] {
        return Array.from(this.knownPools.values());
    }

    /**
     * Clear all registered pools
     */
    clearPools(): void {
        this.knownPools.clear();
    }
}
