# Firewall Protocol - Getting Started

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example configuration
cp .env.example .env

# Edit .env with your settings
# - Set RPC_URL to your Ethereum RPC endpoint
# - Set PRIVATE_KEY for contract deployment
# - Configure protected contracts
```

### 3. Run Tests
```bash
npm test
```

### 4. Deploy Contracts
```bash
npm run deploy
```

### 5. Start Guardian Node
```bash
npm run dev
```

### 6. Run Simulations
```bash
npm run simulate
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm test` | Run test suite |
| `npm run build` | Build TypeScript |
| `npm run deploy` | Deploy smart contracts |
| `npm run dev` | Start guardian node |
| `npm run simulate` | Run transaction simulations |

## Project Structure

```
firewall-protocol/
├── contracts/              # Smart contracts
├── simulation-engine/      # Transaction simulation
├── anomaly-detection/      # Anomaly detection rules
├── guardian-node/          # Guardian node implementation
├── sdk/                    # Developer SDK
├── scripts/                # Deployment and utility scripts
├── docs/                   # Documentation
└── package.json            # Project configuration
```

## Configuration

### Environment Variables

- `RPC_URL` - Ethereum RPC endpoint
- `PRIVATE_KEY` - Private key for deployment
- `PROTECTED_CONTRACTS` - Comma-separated contract addresses
- `GUARDIAN_ENABLED` - Enable guardian node
- `GUARDIAN_EVALUATION_INTERVAL` - Evaluation interval in ms
- `GUARDIAN_ALERT_THRESHOLD` - Risk score threshold for alerts

### Guardian Configuration

Edit `guardian-node/config/guardian.config.json`:

```json
{
  "rpcUrl": "http://localhost:8545",
  "protectedContracts": ["0x..."],
  "enableAutoEvaluation": true,
  "evaluationInterval": 5000,
  "alertThreshold": 30
}
```

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Deployment

### Local Deployment

1. Start a local Ethereum node (e.g., Ganache)
2. Configure `.env` with local RPC URL
3. Run `npm run deploy`

### Testnet Deployment

1. Configure `.env` with testnet RPC URL and private key
2. Ensure account has sufficient funds
3. Run `npm run deploy`

### Mainnet Deployment

1. Configure `.env` with mainnet RPC URL and private key
2. Ensure account has sufficient funds
3. Review all contracts before deployment
4. Run `npm run deploy`

## Integration

### Using the SDK

```typescript
import { FirewallClient, PolicyBuilder } from './sdk';

const client = new FirewallClient({
    providerUrl: 'http://localhost:8545',
    firewallRegistryAddress: '0x...',
    policyManagerAddress: '0x...',
    firewallExecutorAddress: '0x...'
});

const policy = PolicyBuilder.createDefault()
    .blockFlashLoans(true)
    .preventReentrancy(true)
    .build();

await client.registerContract('0x...', policy);
```

## Monitoring

### Guardian Node Logs

The guardian node outputs real-time monitoring information:

```
[PENDING] 0x1234567890... to 0x0987654321...
[EVALUATED] 0x1234567890... Risk: 25.50 (MEDIUM) - DELAY
[ALERT] WARNING: Transaction Risk Alert - MEDIUM
```

### Statistics

The guardian node prints statistics every 30 seconds:

```
=== STATISTICS ===
Uptime: 120.5s
Transactions Monitored: 45
Transactions Evaluated: 42
Avg Evaluation Time: 350.25ms
Alerts Generated: 3
Critical Transactions: 0
```

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Verify RPC URL is correct
2. Check network connectivity
3. Ensure RPC endpoint is running

### Deployment Failures

If deployment fails:

1. Check account has sufficient funds
2. Verify private key is correct
3. Check gas price and limit settings
4. Review contract compilation errors

### Guardian Node Issues

If guardian node won't start:

1. Check RPC URL configuration
2. Verify protected contracts are valid addresses
3. Check port availability
4. Review logs for errors

## Support

For issues or questions:

1. Check documentation in `docs/`
2. Review code comments
3. Check test files for usage examples
4. Open an issue on GitHub

## Next Steps

1. Read the [Protocol Specification](docs/protocol-spec.md)
2. Review the [Architecture](docs/architecture.md)
3. Check the [Integration Guide](docs/integration-guide.md)
4. Explore the [SDK](sdk/)

---

**Status**: Ready to start
**Version**: 1.0.0
**Last Updated**: March 16, 2026
