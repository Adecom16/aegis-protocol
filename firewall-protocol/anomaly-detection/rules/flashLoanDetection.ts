export function detectFlashLoan(traces: any[]): boolean {
    console.log("Running Flash Loan Detection Rule...");
    // Mock logic: Look for borrow and repay in same tx
    const borrows = traces.filter(t => t.method === 'borrow');
    const repays = traces.filter(t => t.method === 'repay');
    return borrows.length > 0 && repays.length > 0;
}
