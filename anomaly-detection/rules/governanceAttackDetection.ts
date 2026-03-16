/**
 * Governance Attack Detection
 * Detects governance manipulation and voting attacks in transaction traces.
 */

export interface GovernanceAttackPattern {
    detected: boolean;
    confidence: number;
    votingPowerChanges: VotingPowerChange[];
    attackType: 'VOTE_MANIPULATION' | 'DELEGATION_ATTACK' | 'PROPOSAL_HIJACK' | 'NONE';
    affectedProposals: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface VotingPowerChange {
    voter: string;
    powerBefore: string;
    powerAfter: string;
    changePercentage: number;
    timestamp: number;
}

/**
 * Detect governance attacks
 */
export function detectGovernanceAttack(votingPowerChanges: any[]): boolean {
    const pattern = analyzeGovernanceAttackPattern(votingPowerChanges);
    return pattern.detected && pattern.confidence > 0.6;
}

/**
 * Analyze governance attack pattern details
 */
export function analyzeGovernanceAttackPattern(
    votingPowerChanges: any[]
): GovernanceAttackPattern {
    const pattern: GovernanceAttackPattern = {
        detected: false,
        confidence: 0,
        votingPowerChanges: [],
        attackType: 'NONE',
        affectedProposals: [],
        severity: 'LOW'
    };

    if (!votingPowerChanges || votingPowerChanges.length === 0) {
        return pattern;
    }

    // Analyze voting power changes
    const significantChanges: VotingPowerChange[] = [];

    for (const change of votingPowerChanges) {
        try {
            const before = BigInt(change.before || 0);
            const after = BigInt(change.after || 0);

            if (before === BigInt(0) && after > BigInt(0)) {
                // Sudden voting power acquisition
                const changePercentage = 100;
                significantChanges.push({
                    voter: change.voter,
                    powerBefore: before.toString(),
                    powerAfter: after.toString(),
                    changePercentage,
                    timestamp: change.timestamp || Date.now()
                });
            } else if (before > BigInt(0)) {
                const changePercentage = Number(((after - before) * BigInt(100)) / before);
                if (Math.abs(changePercentage) > 50) {
                    significantChanges.push({
                        voter: change.voter,
                        powerBefore: before.toString(),
                        powerAfter: after.toString(),
                        changePercentage,
                        timestamp: change.timestamp || Date.now()
                    });
                }
            }
        } catch {
            // Skip invalid changes
        }
    }

    pattern.votingPowerChanges = significantChanges;

    // Detect attack patterns
    if (significantChanges.length > 0) {
        pattern.detected = true;
        pattern.confidence = Math.min(0.5 + (significantChanges.length * 0.1), 0.95);

        // Determine attack type
        if (significantChanges.length >= 3) {
            pattern.attackType = 'VOTE_MANIPULATION';
            pattern.severity = 'HIGH';
        } else if (significantChanges.some(c => c.changePercentage > 100)) {
            pattern.attackType = 'DELEGATION_ATTACK';
            pattern.severity = 'CRITICAL';
        } else {
            pattern.attackType = 'VOTE_MANIPULATION';
            pattern.severity = 'MEDIUM';
        }
    }

    return pattern;
}

/**
 * Detect rapid voting power accumulation
 */
export function detectRapidVotingPowerAccumulation(
    votingHistory: Array<{ timestamp: number; power: number }>
): boolean {
    if (votingHistory.length < 2) {
        return false;
    }

    // Sort by timestamp
    votingHistory.sort((a, b) => a.timestamp - b.timestamp);

    // Check for rapid accumulation within 1 minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentChanges = votingHistory.filter(v => v.timestamp > oneMinuteAgo);

    if (recentChanges.length < 2) {
        return false;
    }

    // Calculate total power increase
    const initialPower = recentChanges[0].power;
    const finalPower = recentChanges[recentChanges.length - 1].power;
    const increase = finalPower - initialPower;
    const increasePercentage = (increase / initialPower) * 100;

    return increasePercentage > 50;
}

/**
 * Detect delegation attack
 */
export function detectDelegationAttack(
    delegationEvents: Array<{ from: string; to: string; amount: string }>
): boolean {
    if (delegationEvents.length < 2) {
        return false;
    }

    // Check for suspicious delegation patterns
    const delegationMap = new Map<string, number>();

    for (const event of delegationEvents) {
        const count = delegationMap.get(event.to) || 0;
        delegationMap.set(event.to, count + 1);
    }

    // If one address receives many delegations, it's suspicious
    for (const count of delegationMap.values()) {
        if (count >= 3) {
            return true;
        }
    }

    return false;
}

/**
 * Detect proposal hijacking
 */
export function detectProposalHijack(
    proposalVotes: Map<string, { for: number; against: number }>,
    votingThreshold: number = 50
): boolean {
    for (const [proposalId, votes] of proposalVotes) {
        const total = votes.for + votes.against;
        if (total === 0) continue;

        const forPercentage = (votes.for / total) * 100;

        // Sudden swing in voting
        if (forPercentage > votingThreshold && votes.against === 0) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate governance attack risk score
 */
export function calculateGovernanceAttackRiskScore(pattern: GovernanceAttackPattern): number {
    let score = 0;

    if (!pattern.detected) {
        return 0;
    }

    // Base score based on confidence
    score += pattern.confidence * 50;

    // Severity multiplier
    switch (pattern.severity) {
        case 'CRITICAL':
            score += 40;
            break;
        case 'HIGH':
            score += 30;
            break;
        case 'MEDIUM':
            score += 15;
            break;
        case 'LOW':
            score += 5;
            break;
    }

    // Additional score for multiple voting power changes
    if (pattern.votingPowerChanges.length > 2) {
        score += 10;
    }

    // Attack type multiplier
    if (pattern.attackType === 'DELEGATION_ATTACK') {
        score += 20;
    } else if (pattern.attackType === 'PROPOSAL_HIJACK') {
        score += 15;
    }

    return Math.min(score, 100);
}

/**
 * Get governance attack risk description
 */
export function getGovernanceAttackRiskDescription(pattern: GovernanceAttackPattern): string {
    if (!pattern.detected) {
        return 'No governance attack detected';
    }

    const parts: string[] = [];

    parts.push(`Type: ${pattern.attackType}`);
    parts.push(`Severity: ${pattern.severity}`);

    if (pattern.votingPowerChanges.length > 0) {
        parts.push(`Affected voters: ${pattern.votingPowerChanges.length}`);
    }

    if (pattern.affectedProposals.length > 0) {
        parts.push(`Affected proposals: ${pattern.affectedProposals.length}`);
    }

    return parts.join('; ');
}

/**
 * Detect voting power concentration
 */
export function detectVotingPowerConcentration(
    voterPowers: Map<string, number>,
    concentrationThreshold: number = 30
): boolean {
    if (voterPowers.size === 0) {
        return false;
    }

    const totalPower = Array.from(voterPowers.values()).reduce((a, b) => a + b, 0);
    const topVoterPower = Math.max(...voterPowers.values());
    const concentration = (topVoterPower / totalPower) * 100;

    return concentration > concentrationThreshold;
}

/**
 * Detect flash loan voting attack
 */
export function detectFlashLoanVotingAttack(
    hasFlashLoan: boolean,
    hasGovernanceAttack: boolean
): boolean {
    return hasFlashLoan && hasGovernanceAttack;
}
