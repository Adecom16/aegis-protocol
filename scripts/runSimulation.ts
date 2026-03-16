/**
 * Run Simulation Script
 * Runs transaction simulations for testing and analysis.
 */

import { Simulator } from '../simulation-engine/src/simulator';
import { AnomalyEngine } from '../anomaly-detection/engine';

async function runSimulation(): Promise<void> {
    console.log('=== Firewall Protocol Simulation Engine ===\n');

    try {
        const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
        console.log(`Connecting to RPC: ${rpcUrl}\n`);

        // Initialize simulator and anomaly engine
        const simulator = new Simulator(rpcUrl);
        const anomalyEngine = new AnomalyEngine();

        // Example transactions to simulate
        const transactions = [
            {
                from: '0x' + '1'.repeat(40),
                to: '0x' + '2'.repeat(40),
                data: '0xa9059cbb' + '0'.repeat(64), // transfer function
                value: '1000000000000000000' // 1 ETH
            },
            {
                from: '0x' + '3'.repeat(40),
                to: '0x' + '4'.repeat(40),
                data: '0x23b872dd' + '0'.repeat(64), // transferFrom function
                value: '0'
            }
        ];

        console.log(`Simulating ${transactions.length} transactions...\n`);

        for (let i = 0; i < transactions.length; i++) {
            const tx = transactions[i];
            console.log(`\n--- Transaction ${i + 1} ---`);
            console.log(`From: ${tx.from}`);
            console.log(`To: ${tx.to}`);
            console.log(`Value: ${tx.value}`);

            try {
                // Simulate transaction
                const simulationResult = await simulator.simulateTransaction(tx);

                console.log(`\nSimulation Result:`);
                console.log(`  Status: ${simulationResult.success ? 'SUCCESS' : 'FAILED'}`);
                console.log(`  Gas Estimate: ${simulationResult.gasEstimate}`);

                if (simulationResult.error) {
                    console.log(`  Error: ${simulationResult.error}`);
                }

                // Analyze state changes
                const stateAnalysis = simulationResult.stateAnalysis;
                console.log(`\nState Analysis:`);
                console.log(`  Balance Changes: ${stateAnalysis.totalBalanceChanges}`);
                console.log(`  Storage Changes: ${stateAnalysis.totalStorageChanges}`);
                console.log(`  Addresses Affected: ${stateAnalysis.addressesAffected.size}`);
                console.log(`  Contracts Created: ${stateAnalysis.contractsCreated}`);
                console.log(`  Suspicious Patterns: ${stateAnalysis.suspiciousPatterns.length}`);

                if (stateAnalysis.suspiciousPatterns.length > 0) {
                    console.log(`  Patterns: ${stateAnalysis.suspiciousPatterns.join(', ')}`);
                }

                // Analyze liquidity impact
                const liquidityAnalysis = simulationResult.liquidityAnalysis;
                console.log(`\nLiquidity Analysis:`);
                console.log(`  Affected Pools: ${liquidityAnalysis.affectedPools.length}`);
                console.log(`  Price Impacts: ${liquidityAnalysis.priceImpacts.length}`);
                console.log(`  Slippage Risks: ${liquidityAnalysis.slippageRisks.length}`);
                console.log(`  Liquidity Drain: ${liquidityAnalysis.liquidityDrainDetected}`);
                console.log(`  MEV Risk: ${liquidityAnalysis.mevRiskDetected}`);
                console.log(`  Risk Level: ${liquidityAnalysis.riskLevel}`);

                // Detect anomalies
                const anomalyResult = anomalyEngine.analyzeTransaction(simulationResult);
                console.log(`\nAnomaly Detection:`);
                console.log(`  Risk Score: ${anomalyResult.riskScore.toFixed(2)}`);
                console.log(`  Risk Level: ${anomalyResult.riskLevel}`);
                console.log(`  Detected Anomalies: ${anomalyResult.detectedAnomalies.length}`);

                for (const anomaly of anomalyResult.detectedAnomalies) {
                    console.log(`    - ${anomaly.type} (${anomaly.severity}): ${anomaly.description}`);
                }

                if (anomalyResult.recommendations.length > 0) {
                    console.log(`  Recommendations:`);
                    for (const rec of anomalyResult.recommendations) {
                        console.log(`    - ${rec}`);
                    }
                }
            } catch (error) {
                console.error(`Error simulating transaction: ${error}`);
            }
        }

        console.log('\n\n=== SIMULATION COMPLETE ===');
    } catch (error) {
        console.error('Error running simulation:', error);
        process.exit(1);
    }
}

// Run simulation
runSimulation().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
