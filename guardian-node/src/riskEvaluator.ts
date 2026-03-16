/**
 * Risk Evaluator
 * Evaluates transaction risk using simulation and anomaly detection.
 */

import { Simulator, SimulationResult } from '../../simulation-engine/src/simulator';
import { AnomalyEngine, AnomalyDetectionResult } from '../../anomaly-detection/engine';
import { PendingTransaction } from './mempoolWatcher';

export interface RiskEvaluation {
    transactionHash: string;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    simulationResult: SimulationResult | null;
    anomalyDetection: AnomalyDetectionResult | null;
    recommendation: 'ALLOW' | 'DELAY' | 'REJECT' | 'PAUSE';
    timestamp: number;
    evaluationTime: number; // milliseconds
}

export class RiskEvaluator {
    private simulator: Simulator;
    private anomalyEngine: AnomalyEngine;
    private evaluationCache: Map<string, RiskEvaluation> = new Map();
    private cacheTimeout = 60000; // 1 minute

    constructor(rpcUrl: string = 'http://localhost:8545') {
        this.simulator = new Simulator(rpcUrl);
        this.anomalyEngine = new AnomalyEngine();
    }

    /**
     * Evaluate transaction risk
     */
    async evaluate(tx: PendingTransaction): Promise<RiskEvaluation> {
        const startTime = Date.now();

        // Check cache
        const cached = this.evaluationCache.get(tx.hash);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached;
        }

        try {
            // Simulate the transaction
            const simulationResult = await this.simulator.simulateTransaction({
                from: tx.from,
                to: tx.to,
                data: tx.data,
                value: tx.value,
                gas: parseInt(tx.gasLimit)
            });

            // Detect anomalies
            const anomalyDetection = this.anomalyEngine.analyzeTransaction(simulationResult);

            // Combine scores
            const riskScore = this.combineRiskScores(simulationResult, anomalyDetection);

            // Determine recommendation
            const recommendation = this.getRecommendation(riskScore);

            const evaluation: RiskEvaluation = {
                transactionHash: tx.hash,
                riskScore,
                riskLevel: this.getRiskLevel(riskScore),
                simulationResult,
                anomalyDetection,
                recommendation,
                timestamp: Date.now(),
                evaluationTime: Date.now() - startTime
            };

            // Cache the evaluation
            this.evaluationCache.set(tx.hash, evaluation);

            return evaluation;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            const evaluation: RiskEvaluation = {
                transactionHash: tx.hash,
                riskScore: 50,
                riskLevel: 'MEDIUM',
                simulationResult: null,
                anomalyDetection: null,
                recommendation: 'DELAY',
                timestamp: Date.now(),
                evaluationTime: Date.now() - startTime
            };

            console.error(`Error evaluating transaction ${tx.hash}:`, errorMessage);
            return evaluation;
        }
    }

    /**
     * Batch evaluate transactions
     */
    async evaluateBatch(transactions: PendingTransaction[]): Promise<RiskEvaluation[]> {
        const evaluations: RiskEvaluation[] = [];

        for (const tx of transactions) {
            const evaluation = await this.evaluate(tx);
            evaluations.push(evaluation);
        }

        return evaluations;
    }

    /**
     * Combine risk scores from simulation and anomaly detection
     */
    private combineRiskScores(
        simulationResult: SimulationResult,
        anomalyDetection: AnomalyDetectionResult
    ): number {
        // Weight the scores
        const simulationWeight = 0.4;
        const anomalyWeight = 0.6;

        // Calculate simulation risk score
        let simulationRiskScore = 0;
        if (!simulationResult.success) {
            simulationRiskScore = 50;
        } else {
            // Analyze state changes
            const stateAnalysis = simulationResult.stateAnalysis;
            if (stateAnalysis.riskFactors.hasLargeValueTransfer) {
                simulationRiskScore += 30;
            }
            if (stateAnalysis.riskFactors.hasStorageModification) {
                simulationRiskScore += 20;
            }
            if (stateAnalysis.riskFactors.hasContractCreation) {
                simulationRiskScore += 15;
            }
            if (stateAnalysis.suspiciousPatterns.length > 0) {
                simulationRiskScore += stateAnalysis.suspiciousPatterns.length * 10;
            }
        }

        // Combine scores
        const combinedScore =
            (simulationRiskScore * simulationWeight) +
            (anomalyDetection.riskScore * anomalyWeight);

        return Math.min(combinedScore, 100);
    }

    /**
     * Get risk level from score
     */
    private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        if (score >= 90) {
            return 'CRITICAL';
        } else if (score >= 60) {
            return 'HIGH';
        } else if (score >= 30) {
            return 'MEDIUM';
        } else {
            return 'LOW';
        }
    }

    /**
     * Get recommendation based on risk score
     */
    private getRecommendation(score: number): 'ALLOW' | 'DELAY' | 'REJECT' | 'PAUSE' {
        if (score >= 90) {
            return 'PAUSE';
        } else if (score >= 60) {
            return 'REJECT';
        } else if (score >= 30) {
            return 'DELAY';
        } else {
            return 'ALLOW';
        }
    }

    /**
     * Get cached evaluation
     */
    getCachedEvaluation(txHash: string): RiskEvaluation | undefined {
        return this.evaluationCache.get(txHash);
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.evaluationCache.clear();
    }

    /**
     * Get cache size
     */
    getCacheSize(): number {
        return this.evaluationCache.size;
    }

    /**
     * Set cache timeout
     */
    setCacheTimeout(timeout: number): void {
        this.cacheTimeout = timeout;
    }

    /**
     * Get simulator
     */
    getSimulator(): Simulator {
        return this.simulator;
    }

    /**
     * Get anomaly engine
     */
    getAnomalyEngine(): AnomalyEngine {
        return this.anomalyEngine;
    }

    /**
     * Get evaluation statistics
     */
    getEvaluationStats(): {
        cachedEvaluations: number;
        averageRiskScore: number;
        criticalCount: number;
        highCount: number;
        mediumCount: number;
        lowCount: number;
    } {
        const evaluations = Array.from(this.evaluationCache.values());

        let totalScore = 0;
        let criticalCount = 0;
        let highCount = 0;
        let mediumCount = 0;
        let lowCount = 0;

        for (const eval of evaluations) {
            totalScore += eval.riskScore;
            switch (eval.riskLevel) {
                case 'CRITICAL':
                    criticalCount++;
                    break;
                case 'HIGH':
                    highCount++;
                    break;
                case 'MEDIUM':
                    mediumCount++;
                    break;
                case 'LOW':
                    lowCount++;
                    break;
            }
        }

        return {
            cachedEvaluations: evaluations.length,
            averageRiskScore: evaluations.length > 0 ? totalScore / evaluations.length : 0,
            criticalCount,
            highCount,
            mediumCount,
            lowCount
        };
    }
}
