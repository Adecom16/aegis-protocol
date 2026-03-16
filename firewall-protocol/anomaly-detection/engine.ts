import { detectFlashLoan } from './rules/flashLoanDetection';
import { detectLiquidityDrain } from './rules/liquidityDrainDetection';

export class AnomalyEngine {
    analyzeTransaction(simulationResult: any): number {
        let riskScore = 0;

        if (detectFlashLoan(simulationResult.traces)) {
            riskScore += 40;
        }

        // Assume mock balances
        if (detectLiquidityDrain(100, 80)) {
            riskScore += 50;
        }

        return Math.min(riskScore, 100);
    }
}
