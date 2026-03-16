export class ContractProtection {
    static getProtectedInterface(originalAbi: any[]): any[] {
        // Mock injection of firewall executor interface
        return originalAbi;
    }
}
