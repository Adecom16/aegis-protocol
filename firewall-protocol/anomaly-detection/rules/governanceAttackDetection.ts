export function detectGovernanceAttack(votingPowerChanges: any[]): boolean {
    console.log("Running Governance Attack Detection Rule...");
    // Mock logic: Huge sudden increase in voting power
    return votingPowerChanges.some(change => change.delta > 1000000);
}
