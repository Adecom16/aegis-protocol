import { MempoolWatcher } from './mempoolWatcher';
import { RiskEvaluator } from './riskEvaluator';
import { AlertSystem } from './alertSystem';

export class GuardianMonitor {
    private watcher: MempoolWatcher;
    private evaluator: RiskEvaluator;
    private alerts: AlertSystem;

    constructor(config: any) {
        this.watcher = new MempoolWatcher(config.rpcUrl);
        this.evaluator = new RiskEvaluator();
        this.alerts = new AlertSystem();
    }

    async start() {
        console.log("Starting Guardian Node Monitor...");
        this.watcher.onPendingTransaction(async (tx) => {
            const riskScore = await this.evaluator.evaluate(tx);
            if (riskScore > 90) {
                this.alerts.sendAlert(`Critical Threat Detected! Score: ${riskScore} - Tx: ${tx.hash}`);
                // Trigger pause mechanism
            } else if (riskScore > 60) {
                this.alerts.sendAlert(`High Risk Tx Blocked. Score: ${riskScore} - Tx: ${tx.hash}`);
            } else {
                console.log(`Tx ${tx.hash} approved. Score: ${riskScore}`);
            }
        });
    }
}
