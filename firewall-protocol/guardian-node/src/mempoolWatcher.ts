export class MempoolWatcher {
    constructor(private rpcUrl: string) {}

    onPendingTransaction(callback: (tx: any) => void) {
        console.log(`Listening to mempool on ${this.rpcUrl}...`);
        // Mock mempool event
        setTimeout(() => {
            callback({ hash: "0xabc123", to: "0xDefiTarget", value: 0 });
        }, 1000);
    }
}
