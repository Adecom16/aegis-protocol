import { Simulator } from '../src/simulator';

async function testSimulation() {
    const sim = new Simulator("http://localhost:8545");
    const result = await sim.simulateTransaction({ to: "0x123", data: "0x" });
    if (result.status === 'simulated') {
        console.log("Simulation Engine tests passed.");
    } else {
        console.error("Simulation Engine tests failed.");
        process.exit(1);
    }
}

testSimulation().catch(console.error);
