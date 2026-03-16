/**
 * Start Guardian Node Script
 * Starts a guardian node for the firewall protocol.
 */

import { GuardianMonitor, MonitorConfig } from '../guardian-node/src/monitor';
import * as fs from 'fs';
import * as path from 'path';

async function startGuardianNode(): Promise<void> {
    console.log('=== Firewall Protocol Guardian Node ===\n');

    try {
        // Load configuration
        const configPath = path.join(__dirname, '../guardian-node/config/guardian.config.json');
        let config: MonitorConfig;

        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf-8');
            config = JSON.parse(configData);
        } else {
            // Use default configuration
            config = {
                rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
                protectedContracts: process.env.PROTECTED_CONTRACTS?.split(',') || [],
                enableAutoEvaluation: true,
                evaluationInterval: 5000,
                alertThreshold: 30
            };
        }

        console.log('Configuration:');
        console.log(`  RPC URL: ${config.rpcUrl}`);
        console.log(`  Protected Contracts: ${config.protectedContracts.length}`);
        console.log(`  Auto Evaluation: ${config.enableAutoEvaluation}`);
        console.log(`  Evaluation Interval: ${config.evaluationInterval}ms`);
        console.log(`  Alert Threshold: ${config.alertThreshold}\n`);

        // Create and start monitor
        const monitor = new GuardianMonitor(config);

        // Register alert listener
        monitor.onAlert((alert: any) => {
            console.log(`\n[ALERT] ${alert.level}: ${alert.title}`);
            console.log(`  ${alert.message}`);
        });

        // Start monitoring
        await monitor.start();

        // Print statistics periodically
        setInterval(() => {
            const stats = monitor.getStats();
            const mempoolStats = monitor.getMempoolStats();
            const alertStats = monitor.getAlertStats();

            console.log('\n=== STATISTICS ===');
            console.log(`Uptime: ${(stats.uptime / 1000).toFixed(1)}s`);
            console.log(`Transactions Monitored: ${stats.transactionsMonitored}`);
            console.log(`Transactions Evaluated: ${stats.transactionsEvaluated}`);
            console.log(`Avg Evaluation Time: ${stats.averageEvaluationTime.toFixed(2)}ms`);
            console.log(`Alerts Generated: ${stats.alertsGenerated}`);
            console.log(`Critical Transactions: ${stats.criticalTransactions}`);
            console.log(`Queue Size: ${monitor.getQueueSize()}`);
            console.log(`Mempool TPS: ${mempoolStats.transactionsPerSecond.toFixed(2)}`);
            console.log(`Alert Stats: ${JSON.stringify(alertStats)}`);
        }, 30000);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\nShutting down guardian node...');
            monitor.stop();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n\nShutting down guardian node...');
            monitor.stop();
            process.exit(0);
        });

        console.log('Guardian node is running. Press Ctrl+C to stop.\n');
    } catch (error) {
        console.error('Error starting guardian node:', error);
        process.exit(1);
    }
}

// Start the node
startGuardianNode().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
