function runSimulation(game, strategy, iterations = 10000) {
  let totalPayout = 0;
  let busts = 0;

  for (let i = 0; i < iterations; i++) {
    const result = simulateGame(game, strategy);
    totalPayout += result.payout;
    if (result.bust) busts++;
  }

  return { expectedValue: totalPayout / iterations, bustRate: busts / iterations };
}

function simulateGame(game, roundsToBank) {
  if (game === 'packet_sniffer') {
    let trace = 0;
    for (let round = 1; round <= roundsToBank; round++) {
      const missChance = 0.05 + (round * 0.05); 
      if (Math.random() < missChance) return { payout: 0.25, bust: true }; 
      trace += 0.2;
      if (trace >= 1) return { payout: 0.25, bust: true };
    }
    return { payout: 0.7 + (roundsToBank * 0.3), bust: false };
  }
  
  if (game === 'daemon_hunt') {
    let infection = 0;
    for (let round = 1; round <= roundsToBank; round++) {
      const missChance = 0.1 + (round * 0.05);
      if (Math.random() < missChance) infection += 0.15 * 3;
      if (infection >= 1) return { payout: 0.25, bust: true };
    }
    return { payout: 0.7 + (roundsToBank * 0.35), bust: false };
  }

  if (game === 'signal_jamming') {
    let trace = 0;
    for (let sec = 1; sec <= roundsToBank; sec++) {
      const slipChance = 0.02 + (sec * 0.01);
      if (Math.random() < slipChance) return { payout: 0.25, bust: true };
      trace += 0.08;
      if (trace >= 1) return { payout: 0.25, bust: true };
    }
    return { payout: Math.max(0.2, (roundsToBank * 1000) / 5000), bust: false };
  }

  if (game === 'chrome_courier') {
    for (let district = 1; district <= roundsToBank; district++) {
      const crashChance = 0.1 + (district * 0.05);
      if (Math.random() < crashChance) return { payout: (district - 1) * 0.5, bust: true };
    }
    return { payout: 0.5 + (roundsToBank * 0.5), bust: false };
  }
  return { payout: 0, bust: false };
}

console.log("=== MONTE CARLO BALANCE SIMULATION ===");
const games = ['packet_sniffer', 'daemon_hunt', 'signal_jamming', 'chrome_courier'];
for (const game of games) {
  console.log(`\n--- ${game.toUpperCase()} ---`);
  for (let strategy = 1; strategy <= 10; strategy++) {
    const res = runSimulation(game, strategy);
    console.log(`Strategy: Bank at ${strategy} | EV: ${res.expectedValue.toFixed(2)}x | Bust Rate: ${(res.bustRate * 100).toFixed(1)}%`);
  }
}
