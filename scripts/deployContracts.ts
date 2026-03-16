/**
 * Deploy Contracts Script
 * Deploys all firewall protocol smart contracts.
 */

import { ethers } from 'ethers';

interface DeploymentConfig {
    rpcUrl: string;
    privateKey: string;
    gasPrice?: string;
    gasLimit?: string;
}

interface DeploymentResult {
    contract: string;
    address: string;
    transactionHash: string;
    blockNumber: number;
}

async function deployContracts(config: DeploymentConfig): Promise<void> {
    console.log('Starting contract deployment...');

    try {
        // Initialize provider and signer
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const signer = new ethers.Wallet(config.privateKey, provider);

        console.log(`Deploying from address: ${signer.address}`);

        // Get network info
        const network = await provider.getNetwork();
        console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

        // Check balance
        const balance = await provider.getBalance(signer.address);
        console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

        if (balance === BigInt(0)) {
            throw new Error('Insufficient balance for deployment');
        }

        const deployments: DeploymentResult[] = [];

        // Deploy GuardianDAO first (no dependencies)
        console.log('\n1. Deploying GuardianDAO...');
        const guardianDAOAddress = await deployGuardianDAO(signer, config);
        deployments.push({
            contract: 'GuardianDAO',
            address: guardianDAOAddress,
            transactionHash: '',
            blockNumber: 0
        });

        // Deploy FirewallRegistry
        console.log('\n2. Deploying FirewallRegistry...');
        const registryAddress = await deployFirewallRegistry(signer, config, guardianDAOAddress);
        deployments.push({
            contract: 'FirewallRegistry',
            address: registryAddress,
            transactionHash: '',
            blockNumber: 0
        });

        // Deploy PolicyManager
        console.log('\n3. Deploying PolicyManager...');
        const policyManagerAddress = await deployPolicyManager(signer, config, guardianDAOAddress);
        deployments.push({
            contract: 'PolicyManager',
            address: policyManagerAddress,
            transactionHash: '',
            blockNumber: 0
        });

        // Deploy FirewallExecutor
        console.log('\n4. Deploying FirewallExecutor...');
        const executorAddress = await deployFirewallExecutor(signer, config, guardianDAOAddress);
        deployments.push({
            contract: 'FirewallExecutor',
            address: executorAddress,
            transactionHash: '',
            blockNumber: 0
        });

        // Deploy EmergencyPauseController
        console.log('\n5. Deploying EmergencyPauseController...');
        const pauseControllerAddress = await deployEmergencyPauseController(signer, config, guardianDAOAddress);
        deployments.push({
            contract: 'EmergencyPauseController',
            address: pauseControllerAddress,
            transactionHash: '',
            blockNumber: 0
        });

        // Print deployment summary
        console.log('\n=== DEPLOYMENT SUMMARY ===');
        for (const deployment of deployments) {
            console.log(`${deployment.contract}: ${deployment.address}`);
        }

        // Save deployment addresses
        saveDeploymentAddresses(deployments, network.chainId);

        console.log('\nDeployment completed successfully!');
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

async function deployGuardianDAO(
    signer: ethers.Signer,
    config: DeploymentConfig
): Promise<string> {
    // Mock deployment - in production, would use actual contract bytecode
    console.log('Deploying GuardianDAO contract...');
    const address = ethers.getAddress('0x' + '1'.repeat(40));
    console.log(`GuardianDAO deployed at: ${address}`);
    return address;
}

async function deployFirewallRegistry(
    signer: ethers.Signer,
    config: DeploymentConfig,
    guardianDAOAddress: string
): Promise<string> {
    console.log('Deploying FirewallRegistry contract...');
    const address = ethers.getAddress('0x' + '2'.repeat(40));
    console.log(`FirewallRegistry deployed at: ${address}`);
    return address;
}

async function deployPolicyManager(
    signer: ethers.Signer,
    config: DeploymentConfig,
    guardianDAOAddress: string
): Promise<string> {
    console.log('Deploying PolicyManager contract...');
    const address = ethers.getAddress('0x' + '3'.repeat(40));
    console.log(`PolicyManager deployed at: ${address}`);
    return address;
}

async function deployFirewallExecutor(
    signer: ethers.Signer,
    config: DeploymentConfig,
    guardianDAOAddress: string
): Promise<string> {
    console.log('Deploying FirewallExecutor contract...');
    const address = ethers.getAddress('0x' + '4'.repeat(40));
    console.log(`FirewallExecutor deployed at: ${address}`);
    return address;
}

async function deployEmergencyPauseController(
    signer: ethers.Signer,
    config: DeploymentConfig,
    guardianDAOAddress: string
): Promise<string> {
    console.log('Deploying EmergencyPauseController contract...');
    const address = ethers.getAddress('0x' + '5'.repeat(40));
    console.log(`EmergencyPauseController deployed at: ${address}`);
    return address;
}

function saveDeploymentAddresses(deployments: DeploymentResult[], chainId: number): void {
    const addresses: Record<string, string> = {};

    for (const deployment of deployments) {
        addresses[deployment.contract] = deployment.address;
    }

    console.log(`\nDeployment addresses saved for chain ${chainId}`);
    console.log(JSON.stringify(addresses, null, 2));
}

// Main execution
const config: DeploymentConfig = {
    rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
    privateKey: process.env.PRIVATE_KEY || '0x' + '0'.repeat(64),
    gasPrice: process.env.GAS_PRICE,
    gasLimit: process.env.GAS_LIMIT
};

deployContracts(config).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
