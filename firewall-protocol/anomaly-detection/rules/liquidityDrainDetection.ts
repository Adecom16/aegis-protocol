export function detectLiquidityDrain(preBalance: number, postBalance: number): boolean {
    console.log("Running Liquidity Drain Detection Rule...");
    // Mock logic: Drain > 10%
    if (preBalance === 0) return false;
    const drainPercentage = (preBalance - postBalance) / preBalance;
    return drainPercentage > 0.10;
}
