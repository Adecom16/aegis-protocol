import { Simulator } from '../simulation-engine/src/simulator';

const sim = new Simulator("http://localhost:8545");
sim.simulateTransaction({ to: "0xTest", value: 100 }).then(result => {
    console.log("Simulation Result:", result);
});
