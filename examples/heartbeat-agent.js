/**
 * examples/heartbeat-agent.js
 * The minimal working agent.
 *
 * This is src/agent.js stripped to its essentials.
 * Use it to understand the heartbeat pattern before building on top of it.
 *
 * Run: node examples/heartbeat-agent.js
 * (Requires a .env file in the project root)
 */

import "dotenv/config";
import { getScore } from "../src/fixatum.js";
import { writeRecord } from "../src/hcs.js";

const AGENT_LABEL = process.env.AGENT_LABEL || "agent";

console.log(`[${AGENT_LABEL}] Heartbeat agent starting...`);

// 1. Check score (free -- builds provenance)
const score = await getScore();
if (score) {
  console.log(`[${AGENT_LABEL}] Score: ${score.score}/100 Grade ${score.grade}`);
} else {
  console.log(`[${AGENT_LABEL}] No DID yet -- run: npm run register`);
}

// 2. Your logic here
const observation = "Heartbeat. All systems nominal.";
console.log(`[${AGENT_LABEL}] ${observation}`);

// 3. Write HCS record (0.1 HBAR -- requires DID and topic)
//    Remove or replace with direct SDK write if preferred (see src/hcs.js)
await writeRecord("heartbeat", {
  score: score?.score ?? null,
  grade: score?.grade ?? null,
  observation,
});

console.log(`[${AGENT_LABEL}] Done.`);
