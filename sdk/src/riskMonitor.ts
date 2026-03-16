/**
 * Risk Monitor
 * Monitors contract risk in real-time.
 */

import { FirewallClient } from './firewallClient';

export interface RiskMetrics {
    contractAddress: string;
    currentRiskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lastUpdate: number;
    transactionsMonitored: number;
    anomaliesDetected: number;
    alertsGenerated: number;
}

export interface RiskHistory {
    timestamp: number;
    riskScore: number;
    riskLevel: string;
    anomalies: string[];
}

export class RiskMonitor {
    private firewallClient: FirewallClient;
    private contractAddress: string;
    private riskMetrics: RiskMetrics;
    private riskHistory: RiskHistory[] = [];
    private listeners: Array<(metrics: RiskMetrics) => void> = [];
    private isMonitoring = false;
    private monitoringInterval: NodeJS.Timeout | null = null;

    constructor(firewallClient: FirewallClient, contractAddress: string) {
        this.firewallClient = firewallClient;
        this.contractAddress = contractAddress;
        this.riskMetrics = {
            contractAddress,
            currentRiskScore: 0,
            riskLevel: 'LOW',
            lastUpdate: Date.now(),
            transactionsMonitored: 0,
            anomaliesDetected: 0,
            alertsGenerated: 0
        };
    }

    /**
     * Start monitoring
     */
    startMonitoring(interval: number = 5000): void {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;

        this.monitoringInterval = setInterval(() => {
            this.updateRiskMetrics();
        }, interval);

        console.log(`Risk monitoring started for ${this.contractAddress}`);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        console.log(`Risk monitoring stopped for ${this.contractAddress}`);
    }

    /**
     * Update risk metrics
     */
    private updateRiskMetrics(): void {
        // Simulate risk score update
        const previousScore = this.riskMetrics.currentRiskScore;
        const newScore = Math.max(0, previousScore + (Math.random() - 0.5) * 10);

        this.riskMetrics.currentRiskScore = Math.min(newScore, 100);
        this.riskMetrics.riskLevel = this.getRiskLevel(this.riskMetrics.currentRiskScore);
        this.riskMetrics.lastUpdate = Date.now();
        this.riskMetrics.transactionsMonitored++;

        // Record history
        this.recordHistory();

        // Notify listeners
        this.notifyListeners();
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
     * Record risk history
     */
    private recordHistory(): void {
        const history: RiskHistory = {
            timestamp: Date.now(),
            riskScore: this.riskMetrics.currentRiskScore,
            riskLevel: this.riskMetrics.riskLevel,
            anomalies: []
        };

        this.riskHistory.push(history);

        // Keep only last 1000 records
        if (this.riskHistory.length > 1000) {
            this.riskHistory.shift();
        }
    }

    /**
     * Register listener
     */
    onRiskUpdate(callback: (metrics: RiskMetrics) => void): void {
        this.listeners.push(callback);
    }

    /**
     * Notify listeners
     */
    private notifyListeners(): void {
        for (const listener of this.listeners) {
            try {
                listener(this.riskMetrics);
            } catch (error) {
                console.error('Error in risk listener:', error);
            }
        }
    }

    /**
     * Get current risk metrics
     */
    getRiskMetrics(): RiskMetrics {
        return { ...this.riskMetrics };
    }

    /**
     * Get risk history
     */
    getRiskHistory(limit: number = 100): RiskHistory[] {
        return this.riskHistory.slice(-limit);
    }

    /**
     * Get average risk score
     */
    getAverageRiskScore(): number {
        if (this.riskHistory.length === 0) {
            return 0;
        }

        const sum = this.riskHistory.reduce((acc, h) => acc + h.riskScore, 0);
        return sum / this.riskHistory.length;
    }

    /**
     * Get max risk score
     */
    getMaxRiskScore(): number {
        if (this.riskHistory.length === 0) {
            return 0;
        }

        return Math.max(...this.riskHistory.map(h => h.riskScore));
    }

    /**
     * Get min risk score
     */
    getMinRiskScore(): number {
        if (this.riskHistory.length === 0) {
            return 0;
        }

        return Math.min(...this.riskHistory.map(h => h.riskScore));
    }

    /**
     * Record anomaly
     */
    recordAnomaly(anomalyType: string): void {
        this.riskMetrics.anomaliesDetected++;

        if (this.riskHistory.length > 0) {
            const lastHistory = this.riskHistory[this.riskHistory.length - 1];
            lastHistory.anomalies.push(anomalyType);
        }
    }

    /**
     * Record alert
     */
    recordAlert(): void {
        this.riskMetrics.alertsGenerated++;
    }

    /**
     * Get risk trend
     */
    getRiskTrend(): 'INCREASING' | 'DECREASING' | 'STABLE' {
        if (this.riskHistory.length < 2) {
            return 'STABLE';
        }

        const recent = this.riskHistory.slice(-10);
        const avgRecent = recent.reduce((sum, h) => sum + h.riskScore, 0) / recent.length;
        const avgPrevious = this.riskHistory.slice(-20, -10).reduce((sum, h) => sum + h.riskScore, 0) / 10;

        const diff = avgRecent - avgPrevious;

        if (diff > 5) {
            return 'INCREASING';
        } else if (diff < -5) {
            return 'DECREASING';
        } else {
            return 'STABLE';
        }
    }

    /**
     * Is monitoring active
     */
    isActive(): boolean {
        return this.isMonitoring;
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.riskHistory = [];
    }

    /**
     * Get summary
     */
    getSummary(): {
        contractAddress: string;
        currentRisk: number;
        riskLevel: string;
        trend: string;
        averageRisk: number;
        maxRisk: number;
        minRisk: number;
        anomalies: number;
        alerts: number;
    } {
        return {
            contractAddress: this.contractAddress,
            currentRisk: this.riskMetrics.currentRiskScore,
            riskLevel: this.riskMetrics.riskLevel,
            trend: this.getRiskTrend(),
            averageRisk: this.getAverageRiskScore(),
            maxRisk: this.getMaxRiskScore(),
            minRisk: this.getMinRiskScore(),
            anomalies: this.riskMetrics.anomaliesDetected,
            alerts: this.riskMetrics.alertsGenerated
        };
    }
}
