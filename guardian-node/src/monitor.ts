/**
 * Guardian Monitor
 * Orchestrates the guardian node operations.
 */

import { MempoolWatcher, PendingTransaction } from './mempoolWatcher';
import { RiskEvaluator, RiskEvaluation } from './riskEvaluator';
import { AlertSystem } from './alertSystem';

export interface MonitorConfig {
    rpcUrl: string;
    protectedContracts: string[];
    enableAutoEvaluation: boolean;
    evaluationInterval: number; // milliseconds
    alertThreshold: number; // risk score threshold for alerts
}

export interface MonitorStats {
    uptime: number;
    transactionsMonitored: number;
    transactionsEvaluated: number;
    averageEvaluationTime: number;
    alertsGenerated: number;
    criticalTransactions: number;
}

export class GuardianMonitor {
    private watcher: MempoolWatcher;
    private evaluator: RiskEvaluator;
    private alerts: AlertSystem;
    private config: MonitorConfig;
    private isRunning = false;
    private startTime = 0;
    private transactionsMonitored = 0;
    private transactionsEvaluated = 0;
    private totalEvaluationTime = 0;
    private alertsGenerated = 0;
    private criticalTransactions = 0;
    private evaluationQueue: PendingTransaction[] = [];
    private isEvaluating = false;

    constructor(config: MonitorConfig) {
        this.config = config;
        this.watcher = new MempoolWatcher(config.rpcUrl);
        this.evaluator = new RiskEvaluator(config.rpcUrl);
        this.alerts = new AlertSystem();

        // Register protected contracts
        for (const contract of config.protectedContracts) {
            this.watcher.registerProtectedContract(contract);
        }
    }

    /**
     * Start the monitor
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('Monitor is already running');
            return;
        }

        this.isRunning = true;
        this.startTime = Date.now();

        console.log('Starting Guardian Monitor...');
        console.log(`Protected contracts: ${this.config.protectedContracts.length}`);
        console.log(`RPC URL: ${this.config.rpcUrl}`);

        try {
            // Start mempool watcher
            await this.watcher.startWatching();

            // Register pending transaction handler
            this.watcher.onPendingTransaction((tx: PendingTransaction) => {
                this.handlePendingTransaction(tx);
            });

            // Start evaluation loop if enabled
            if (this.config.enableAutoEvaluation) {
                this.startEvaluationLoop();
            }

            console.log('Guardian Monitor started successfully');
        } catch (error) {
            console.error('Error starting Guardian Monitor:', error);
            this.isRunning = false;
        }
    }

    /**
     * Stop the monitor
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.watcher.stopWatching();

        console.log('Guardian Monitor stopped');
    }

    /**
     * Handle pending transaction
     */
    private handlePendingTransaction(tx: PendingTransaction): void {
        this.transactionsMonitored++;

        console.log(`[PENDING] ${tx.hash.slice(0, 10)}... to ${tx.to.slice(0, 10)}...`);

        // Add to evaluation queue
        this.evaluationQueue.push(tx);

        // Evaluate immediately if not already evaluating
        if (!this.isEvaluating && !this.config.enableAutoEvaluation) {
            this.evaluateNextTransaction();
        }
    }

    /**
     * Start evaluation loop
     */
    private startEvaluationLoop(): void {
        setInterval(() => {
            if (this.evaluationQueue.length > 0 && !this.isEvaluating) {
                this.evaluateNextTransaction();
            }
        }, this.config.evaluationInterval);
    }

    /**
     * Evaluate next transaction in queue
     */
    private async evaluateNextTransaction(): Promise<void> {
        if (this.evaluationQueue.length === 0 || this.isEvaluating) {
            return;
        }

        this.isEvaluating = true;
        const tx = this.evaluationQueue.shift();

        if (!tx) {
            this.isEvaluating = false;
            return;
        }

        try {
            const startTime = Date.now();
            const evaluation = await this.evaluator.evaluate(tx);
            const evaluationTime = Date.now() - startTime;

            this.transactionsEvaluated++;
            this.totalEvaluationTime += evaluationTime;

            // Handle evaluation result
            this.handleEvaluationResult(tx, evaluation);
        } catch (error) {
            console.error(`Error evaluating transaction ${tx.hash}:`, error);
        } finally {
            this.isEvaluating = false;
        }
    }

    /**
     * Handle evaluation result
     */
    private handleEvaluationResult(tx: PendingTransaction, evaluation: RiskEvaluation): void {
        const riskScoreStr = evaluation.riskScore.toFixed(2);

        console.log(
            `[EVALUATED] ${tx.hash.slice(0, 10)}... Risk: ${riskScoreStr} (${evaluation.riskLevel}) - ${evaluation.recommendation}`
        );

        // Generate alert if risk score exceeds threshold
        if (evaluation.riskScore >= this.config.alertThreshold) {
            this.generateAlert(tx, evaluation);
        }

        // Track critical transactions
        if (evaluation.riskLevel === 'CRITICAL') {
            this.criticalTransactions++;
        }

        // Handle recommendations
        this.handleRecommendation(tx, evaluation);
    }

    /**
     * Generate alert for high-risk transaction
     */
    private generateAlert(tx: PendingTransaction, evaluation: RiskEvaluation): void {
        const anomalies = evaluation.anomalyDetection?.detectedAnomalies.map(a => a.type) || [];

        this.alerts.sendTransactionAlert(
            tx.hash,
            tx.to,
            evaluation.riskLevel,
            evaluation.riskScore,
            anomalies
        );

        this.alertsGenerated++;
    }

    /**
     * Handle recommendation
     */
    private handleRecommendation(tx: PendingTransaction, evaluation: RiskEvaluation): void {
        switch (evaluation.recommendation) {
            case 'ALLOW':
                console.log(`✓ Transaction approved`);
                break;
            case 'DELAY':
                console.log(`⏱ Transaction delayed for further analysis`);
                break;
            case 'REJECT':
                console.log(`✗ Transaction rejected`);
                this.alerts.sendAlert(
                    'Transaction Rejected',
                    `Transaction ${tx.hash.slice(0, 10)}... has been rejected due to high risk`,
                    'ERROR'
                );
                break;
            case 'PAUSE':
                console.log(`🛑 EMERGENCY: Contract pause triggered`);
                this.alerts.sendEmergencyAlert(
                    tx.to,
                    `Critical risk detected in transaction ${tx.hash.slice(0, 10)}...`
                );
                break;
        }
    }

    /**
     * Register alert listener
     */
    onAlert(callback: (alert: any) => void): void {
        this.alerts.onAlert(callback);
    }

    /**
     * Add protected contract
     */
    addProtectedContract(address: string): void {
        this.watcher.registerProtectedContract(address);
        this.config.protectedContracts.push(address);
    }

    /**
     * Remove protected contract
     */
    removeProtectedContract(address: string): void {
        this.watcher.unregisterProtectedContract(address);
        this.config.protectedContracts = this.config.protectedContracts.filter(
            a => a.toLowerCase() !== address.toLowerCase()
        );
    }

    /**
     * Get monitor statistics
     */
    getStats(): MonitorStats {
        const uptime = this.isRunning ? Date.now() - this.startTime : 0;
        const avgEvaluationTime = this.transactionsEvaluated > 0
            ? this.totalEvaluationTime / this.transactionsEvaluated
            : 0;

        return {
            uptime,
            transactionsMonitored: this.transactionsMonitored,
            transactionsEvaluated: this.transactionsEvaluated,
            averageEvaluationTime: avgEvaluationTime,
            alertsGenerated: this.alertsGenerated,
            criticalTransactions: this.criticalTransactions
        };
    }

    /**
     * Get mempool statistics
     */
    getMempoolStats() {
        return this.watcher.getMempoolStats();
    }

    /**
     * Get alert statistics
     */
    getAlertStats() {
        return this.alerts.getAlertStats();
    }

    /**
     * Get evaluation queue size
     */
    getQueueSize(): number {
        return this.evaluationQueue.length;
    }

    /**
     * Is monitor running
     */
    isMonitorRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Get watcher
     */
    getWatcher(): MempoolWatcher {
        return this.watcher;
    }

    /**
     * Get evaluator
     */
    getEvaluator(): RiskEvaluator {
        return this.evaluator;
    }

    /**
     * Get alert system
     */
    getAlertSystem(): AlertSystem {
        return this.alerts;
    }
}
