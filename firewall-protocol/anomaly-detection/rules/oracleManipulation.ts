export function detectOracleManipulation(priceUpdates: number[], threshold: number): boolean {
    console.log("Running Oracle Manipulation Detection Rule...");
    // Mock logic: Price deviates more than threshold
    if (priceUpdates.length < 2) return false;
    const deviation = Math.abs(priceUpdates[0] - priceUpdates[1]) / priceUpdates[0];
    return deviation > threshold;
}
