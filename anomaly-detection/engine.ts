/**
 * Anomaly Detection Engine
 * Orchestrates all anomaly detection rules and generates risk scores.
 */

import { detectFlashLoan, calculateFlashLoanRiskScore } from './rules/flashLoanDetection';
import { detectLiquidityDrain, calculateLiquidityDrainRiskScore } from './rules/liquidityDrainDetection';
import { detectOracleManipulation, calculateOracleManipulationRiskScore } from './rules/oracleManipulation';
import { detectGovernanceAttack, calculateGovernanceAttackRiskScore } from './rules/governanceAttackDetection';
import { SimulationResult } from '../simulation-engine/src/simulator';

export interface AnomalyDetectionResult {
    transactionHash: string;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    detectedAnomalies: DetectedAnomaly[];
    recommendations: string[];
    timestamp: number;
}

export interface DetectedAnomaly {
    type: string;
    confidence: number;
    severity: string;
    description: string;
    riskContribution: number;
}

export class AnomalyEngine {
    private flashLoanWeight = 0.25;
    private liquidityDrainWeight = 0.25;
    private oracleManipulationWeight = 0.20;
    private governanceAttackWeight = 0.15;
    private policyViolationWeight = 0.15;

    /**
     * Analyze a transaction for anomalies
     */
    analyzeTransaction(simulationResult: SimulationResult): AnomalyDetectionResult {
        const result: AnomalyDetectionResult = {
            transactionHash: simulationResult.transactionHash,
            riskScore: 0,
            riskLevel: 'LOW',
            detectedAnomalies: [],
            recommendations: [],
            timestamp: Date.now()
        };

        if (!simulationResult.success) {
            result.riskScore = 50;
            result.riskLevel = 'MEDIUM';
            result.detectedAnomalies.push({
                type: 'TRANSACTION_FAILURE',
                confidence: 0.9,
                severity: 'MEDIUM',
                description: 'Transaction failed during simulation',
                riskContribution: 50
            });
            result.recommendations.push('Review transaction logic for errors');
            return result;
        }

        // Run all detection rules
        this.detectFlashLoanExploits(simulationResult, result);
        this.detectLiquidityDrains(simulationResult, result);
        this.detectOracleManipulation(simulationResult, result);
        this.detectGovernanceAttacks(simulationResult, result);
        this.detectStateAnomalies(simulationResult, result);

        // Calculate weighted risk score
        this.calculateWeightedRiskScore(result);

        // Determine risk level
        this.determineRiskLevel(result);

        // Generate recommendations
        this.generateRecommendations(result);

        return result;
    }

    /**
     * Detect flash loan exploits
     */
    private detectFlashLoanExploits(
        simulationResult: SimulationResult,
        result: AnomalyDetectionResult
    ): void {
        const traces = simulationResult.trace.callTraces;

        if (detectFlashLoan(traces)) {
            const riskScore = calculateFlashLoanRiskScore({
                detected: true,
                confidence: 0.8,
                borrowAmount: '0',
                repayAmount: '0',
                profitAmount: '0',
                pools: [],
                callSequence: []
            });

            result.detectedAnomalies.push({
                type: 'FLASH_LOAN_EXPLOIT',
                confidence: 0.8,
                severity: 'HIGH',
                description: 'Flash loan pattern detected in transaction',
                riskContribution: riskScore
            });
        }
    }

    /**
     * Detect liquidity drains
     */
    private detectLiquidityDrains(
        simulationResult: SimulationResult,
        result: AnomalyDetectionResult
    ): void {
        const stateAnalysis = simulationResult.stateAnalysis;

        if (stateAnalysis.riskFactors.hasLargeValueTransfer) {
            const riskScore = calculateLiquidityDrainRiskScore({
                detected: true,
                confidence: 0.7,
                drainPercentage: 25,
                affectedTokens: [],
                drainAmount: '0',
                timeWindow: 1,
                severity: 'HIGH'
            });

            result.detectedAnomalies.push({
                type: 'LIQUIDITY_DRAIN',
                confidence: 0.7,
                severity: 'HIGH',
                description: 'Large value transfer detected',
                riskContribution: riskScore
            });
        }

        if (stateAnalysis.suspiciousPatterns.includes('RAPID_MULTI_ADDRESS_TRANSFERS')) {
            result.detectedAnomalies.push({
                type: 'RAPID_TRANSFERS',
                confidence: 0.75,
                severity: 'MEDIUM',
                description: 'Rapid transfers to multiple addresses detected',
                riskContribution: 30
            });
        }
    }

    /**
     * Detect oracle manipulation
     */
    private detectOracleManipulation(
        simulationResult: SimulationResult,
        result: AnomalyDetectionResult
    ): void {
        const liquidityAnalysis = simulationResult.liquidityAnalysis;

        if (liquidityAnalysis.priceImpacts.length > 0) {
            const highImpactCount = liquidityAnalysis.priceImpacts.filter(
                p => p.severity === 'HIGH'
            ).length;

            if (highImpactCount > 0) {
                const riskScore = calculateOracleManipulationRiskScore({
                    detected: true,
                    confidence: 0.75,
                    priceDeviations: [],
                    affectedOracles: [],
                    manipulationType: 'PRICE_SPIKE',
                    severity: 'HIGH'
                });

                result.detectedAnomalies.push({
                    type: 'ORACLE_MANIPULATION',
                    confidence: 0.75,
                    severity: 'HIGH',
                    description: `High price impact detected on ${highImpactCount} pool(s)`,
                    riskContribution: riskScore
                });
            }
        }
    }

    /**
     * Detect governance attacks
     */
    private detectGovernanceAttacks(
        simulationResult: SimulationResult,
        result: AnomalyDetectionResult
    ): void {
        const stateAnalysis = simulationResult.stateAnalysis;

        if (stateAnalysis.suspiciousPatterns.includes('CRITICAL_STORAGE_MODIFICATION')) {
            const riskScore = calculateGovernanceAttackRiskScore({
                detected: true,
                confidence: 0.8,
                votingPowerChanges: [],
                attackType: 'VOTE_MANIPULATION',
                affectedProposals: [],
                severity: 'HIGH'
            });

            result.detectedAnomalies.push({
                type: 'GOVERNANCE_ATTACK',
                confidence: 0.8,
                severity: 'HIGH',
                description: 'Critical storage modification detected',
                riskContribution: riskScore
            });
        }
    }

    /**
     * Detect state anomalies
     */
    private detectStateAnomalies(
        simulationResult: SimulationResult,
        result: AnomalyDetectionResult
    ): void {
        const stateAnalysis = simulationResult.stateAnalysis;

        // Check for contract creation/destruction
        if (stateAnalysis.riskFactors.hasContractCreation) {
            result.detectedAnomalies.push({
                type: 'CONTRACT_CREATION',
                confidence: 0.6,
                severity: 'MEDIUM',
                description: 'Contract creation detected',
                riskContribution: 15
            });
        }

        if (stateAnalysis.riskFactors.hasContractDestruction) {
            result.detectedAnomalies.push({
                type: 'CONTRACT_DESTRUCTION',
                confidence: 0.7,
                severity: 'HIGH',
                description: 'Contract destruction detected',
                riskContribution: 25
            });
        }

        // Check for deep call stacks (reentrancy risk)
        if (stateAnalysis.suspiciousPatterns.includes('DEEP_CALL_STACK')) {
            result.detectedAnomalies.push({
                type: 'DEEP_CALL_STACK',
                confidence: 0.65,
                severity: 'MEDIUM',
                description: 'Deep call stack detected (potential reentrancy)',
                riskContribution: 20
            });
        }

        // Check for failed transactions with state changes
        if (stateAnalysis.suspiciousPatterns.includes('FAILED_TX_WITH_STATE_CHANGES')) {
            result.detectedAnomalies.push({
                type: 'FAILED_TX_STATE_CHANGE',
                confidence: 0.8,
                severity: 'HIGH',
                description: 'Failed transaction with state changes detected',
                riskContribution: 30
            });
        }
    }

    /**
     * Calculate weighted risk score
     */
    private calculateWeightedRiskScore(result: AnomalyDetectionResult): void {
        let totalScore = 0;

        for (const anomaly of result.detectedAnomalies) {
            totalScore += anomaly.riskContribution * anomaly.confidence;
        }

        // Normalize to 0-100 scale
        result.riskScore = Math.min(totalScore, 100);
    }

    /**
     * Determine risk level
     */
    private determineRiskLevel(result: AnomalyDetectionResult): void {
        if (result.riskScore >= 90) {
            result.riskLevel = 'CRITICAL';
        } else if (result.riskScore >= 60) {
            result.riskLevel = 'HIGH';
        } else if (result.riskScore >= 30) {
            result.riskLevel = 'MEDIUM';
        } else {
            result.riskLevel = 'LOW';
        }
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(result: AnomalyDetectionResult): void {
        const anomalyTypes = new Set(result.detectedAnomalies.map(a => a.type));

        if (anomalyTypes.has('FLASH_LOAN_EXPLOIT')) {
            result.recommendations.push('Consider implementing flash loan guards');
            result.recommendations.push('Verify oracle prices are not manipulated');
        }

        if (anomalyTypes.has('LIQUIDITY_DRAIN')) {
            result.recommendations.push('Monitor liquidity pool health');
            result.recommendations.push('Consider implementing withdrawal limits');
        }

        if (anomalyTypes.has('ORACLE_MANIPULATION')) {
            result.recommendations.push('Use multiple oracle sources');
            result.recommendations.push('Implement price deviation checks');
        }

        if (anomalyTypes.has('GOVERNANCE_ATTACK')) {
            result.recommendations.push('Review governance voting mechanisms');
            result.recommendations.push('Implement voting delays');
        }

        if (anomalyTypes.has('DEEP_CALL_STACK')) {
            result.recommendations.push('Review contract for reentrancy vulnerabilities');
            result.recommendations.push('Consider using checks-effects-interactions pattern');
        }

        if (result.riskLevel === 'CRITICAL') {
            result.recommendations.push('URGENT: Consider pausing affected contract');
            result.recommendations.push('URGENT: Notify security team immediately');
        }
    }

    /**
     * Set detection weights
     */
    setDetectionWeights(
        flashLoan: number,
        liquidityDrain: number,
        oracleManipulation: number,
        governanceAttack: number,
        policyViolation: number
    ): void {
        const total = flashLoan + liquidityDrain + oracleManipulation + governanceAttack + policyViolation;

        this.flashLoanWeight = flashLoan / total;
        this.liquidityDrainWeight = liquidityDrain / total;
        this.oracleManipulationWeight = oracleManipulation / total;
        this.governanceAttackWeight = governanceAttack / total;
        this.policyViolationWeight = policyViolation / total;
    }

    /**
     * Get detection weights
     */
    getDetectionWeights() {
        return {
            flashLoan: this.flashLoanWeight,
            liquidityDrain: this.liquidityDrainWeight,
            oracleManipulation: this.oracleManipulationWeight,
            governanceAttack: this.governanceAttackWeight,
            policyViolation: this.policyViolationWeight
        };
    }
}
