import { GuardianMonitor } from '../guardian-node/src/monitor';
import * as config from '../guardian-node/config/guardian.config.json';

const monitor = new GuardianMonitor(config);
monitor.start().catch(console.error);
