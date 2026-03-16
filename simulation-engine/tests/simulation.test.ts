/**
 * Simulation Engine Tests
 * Comprehensive test suite for the simulation engine.
 */

import { Simulator } from '../src/simulator';
import { TransactionTracer } from '../src/transactionTracer';
import { StateAnalyzer } from '../src/stateAnalyzer';
import { LiquidityImpactAnalyzer } from '../src/liquidityImpact';
import { AnomalyEngine } from '../../anomaly-detection/engine';
import {
    detectFlashLoan,
    calculateFlashLoanRiskScore
} from '../../anomaly-detection/rules/flashLoanDetection';
import {
    detectLiquidityDrain,
    calculateLiquidityDrainRiskScore
} from '../../anomaly-detection/rules/liquidityDrainDetection';

// Test utilities
function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function assertEqual(actual: any, expected: any, message: string): void {
    if (actual !== expected) {
        throw new Error(`Assertion failed: ${message}. Expected ${expected}, got ${actual}`);
    }
}

// Test suite
async function runTests(): Promise<void> {
    console.log('=== Running Simulation Engine Tests ===\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Transaction Tracer
    try {
        console.log('Test 1: Transaction Tracer');
        const tracer = new TransactionTracer();
        const txHash = '0x' + '1'.repeat(64);

        const trace = tracer.createTrace(
            txHash,
            '0x' + '2'.repeat(40),
            '0x' + '3'.repeat(40),
            '0xa9059cbb',
            '1000000000000000000'
        );

        assert(trace.transactionHash === txHash, 'Transaction hash mismatch');
        assert(trace.status === 'success', 'Initial status should be success');

        tracer.recordBalanceChange(
            txHash,
            '0x' + '4'.repeat(40),
            '1000000000000000000',
            '500000000000000000'
        );

        const retrieved = tracer.getTrace(txHash);
        assert(retrieved !== undefined, 'Trace should be retrievable');
        assert(retrieved!.balanceChanges.length === 1, 'Should have one balance change');

        console.log('✓ Passed\n');
        passed++;
    } catch (error) {
        console.log(`✗ Failed: ${error}\n`);
        failed++;
    }

    // Test 2: State Analyzer
    try {
        console.log('Test 2: State Analyzer');
        const analyzer = new StateAnalyzer();
        const tracer = new TransactionTracer();
        const txHash = '0x' + '5'.repeat(64);

        const trace = tracer.createTrace(
            txHash,
            '0x' + '6'.repeat(40),
            '0x' + '7'.repeat(40),
            '0xa9059cbb'
        );

        tracer.recordBalanceChange(
            txHash,
            '0x' + '8'.repeat(40),
            '1000000000000000000',
            '100000000000000000'
        );

        const analysis = analyzer.analyzeTrace(trace);
        assert(analysis.totalBalanceChanges === 1, 'Should detect balance change');
        assert(analysis.riskFactors.hasLargeValueTransfer === false, 'Should not flag as large transfer');

        console.log('✓ Passed\n');
        passed++;
    } catch (error) {
        console.log(`✗ Failed: ${error}\n`);
        failed++;
    }

    // Test 3: Liquidity Impact Analyzer
    try {
        console.log('Test 3: Liquidity Impact Analyzer');
        const analyzer = new LiquidityImpactAnalyzer();
        const tracer = new TransactionTracer();
        const txHash = '0x' + '9'.repeat(64);

        const trace = tracer.createTrace(
            txHash,
            '0x' + 'a'.repeat(40),
            '0x' + 'b'.repeat(40),
            '0x'
        );

        const analysis = analyzer.analyzeLiquidityImpact(trace);
        assert(analysis.riskLevel === 'LOW', 'Should have low risk with no pools');

        console.log('✓ Passed\n');
        passed++;
    } catch (error) {
        console.log(`✗ Failed: ${error}\n`);
        failed++;
    }

    // Test 4: Flash Loan Detection
    try {
        console.log('Test 4: Flash Loan Detection');
        const detected = detectFlashLoan([]);
        assert(detected === false, 'Should not detect flash loan in empty traces');

        const riskScore = calculateFlashLoanRiskScore({
            detected: false,
            confidence: 0,
            borrowAmount: '0',
            repayAmount: '0',
            profitAmount: '0',
            pools: [],
            callSequence: []
        });

        assert(riskScore === 0, 'Risk score should be 0 for undetected flash loan');

        console.log('✓ Passed\n');
        passed++;
    } catch (error) {
        console.log(`✗ Failed: ${error}\n`);
        failed++;
    }

    // Test 5: Liquidity Drain Detection
    try {
        console.log('Test 5: Liquidity Drain Detection');
        const detected = detectLiquidityDrain(1000, 500);
        assert(detected === true, 'Should detect 50% drain');

        const detected2 = detectLiquidityDrain(1000, 950);
        assert(detected2 === false, 'Should not detect 5% drain');

        const riskScore = calculateLiquidityDrainRiskScore({
            detected: true,
            confidence: 0.9,
            drainPercentage: 50,
            affectedTokens: [],
            drainAmount: '500',
            timeWindow: 1,
            severity: 'CRITICAL'
        });

        assert(riskScore > 0, 'Risk score should be positive for detected drain');

        console.log('✓ Passed\n');
        passed++;
    } catch (error) {
        console.log(`✗ Failed: ${error}\n`);
        failed++;
    }

    // Test 6: Anomaly Engine
    try {
        console.log('Test 6: Anomaly Engine');
        const engine = new AnomalyEngine();
        const tracer = new TransactionTracer();
        const txHash = '0x' + 'c'.repeat(64);

        const trace = tracer.createTrace(
            txHash,
            '0x' + 'd'.repeat(40),
            '0x' + 'e'.repeat(40),
            '0xa9059cbb'
        );

        tracer.updateTransactionStatus(txHash, 'success', '0x', 21000);

        const stateAnalyzer = new StateAnalyzer();
        const stateAnalysis = stateAnalyzer.analyzeTrace(trace);

        const liquidityAnalyzer = new LiquidityImpactAnalyzer();
        const liquidityAnalysis = liquidityAnalyzer.analyzeLiquidityImpact(trace);

        const simulationResult = {
            transactionHash: txHash,
            success: true,
            trace,
            stateAnalysis,
            liquidityAnalysis,
            gasEstimate: 21000
        };

        const result = engine.analyzeTransaction(simulationResult);
        assert(result.riskScore >= 0 && result.riskScore <= 100, 'Risk score should be 0-100');
        assert(result.riskLevel !== undefined, 'Risk level should be defined');

        console.log('✓ Passed\n');
        passed++;
    } catch (error) {
        console.log(`✗ Failed: ${error}\n`);
        failed++;
    }

    // Test 7: Simulator Integration
    try {
        console.log('Test 7: Simulator Integration');
        const simulator = new Simulator('http://localhost:8545');

        const result = await simulator.simulateTransaction({
            from: '0x' + 'f'.repeat(40),
            to: '0x' + '0'.repeat(40),
            data: '0xa9059cbb',
            value: '0'
        });

        assert(result.transactionHash !== undefined, 'Should have transaction hash');
        assert(result.trace !== undefined, 'Should have trace');
        assert(result.stateAnalysis !== undefined, 'Should have state analysis');
        assert(result.liquidityAnalysis !== undefined, 'Should have liquidity analysis');

        console.log('✓ Passed\n');
        passed++;
    } catch (error) {
        console.log(`✗ Failed: ${error}\n`);
        failed++;
    }

    // Print summary
    console.log('=== TEST SUMMARY ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);

    if (failed > 0) {
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
