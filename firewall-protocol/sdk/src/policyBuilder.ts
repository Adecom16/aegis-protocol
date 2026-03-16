export class PolicyBuilder {
    private policy: any = {};

    static new(): PolicyBuilder {
        return new PolicyBuilder();
    }

    requireOrigin(address: string): this {
        this.policy.requiredOrigin = address;
        return this;
    }

    limitTokenTransfer(tokenSymbol: string, maxAmount: number): this {
        if (!this.policy.transferLimits) this.policy.transferLimits = {};
        this.policy.transferLimits[tokenSymbol] = maxAmount;
        return this;
    }

    preventReentrancy(): this {
        this.policy.preventReentrancy = true;
        return this;
    }

    build(): any {
        return this.policy;
    }
}
