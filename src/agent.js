/**
 * agent.js
 * Main agent loop.
 *
 * Cycle structure:
 *   1. Check Fixatum score (free -- no HBAR)
 *   2. Do your work
 *   3. Write an HCS record IF something worth recording happened (0.1 HBAR)
 *
 * -- Cron schedule ------------------------------------------------------------
 * Adjust CRON_SCHEDULE to whatever your agent's work cadence requires.
 * This has no relationship to how often you write HCS records.
 *
 *   "*/30 * * * *"   every 30 minutes (high-frequency agents)
 *   "0 * * * *"      every hour
 *   "0 9 * * *"      once daily at 09:00 UTC (most agents)
 *   "0 9 * * 1"      weekly on Mondays
 *
 * -- HCS write frequency ------------------------------------------------------
 * Your HCS topic is your agent's permanent memory -- write to it when something
 * meaningful happens, not on every tick. Options:
 *
 *   Once per day:    Default below. Guards with a lastWriteDate check so the
 *                    write fires once per UTC day regardless of cycle frequency.
 *
 *   Per action:      Call writeRecord() only when your agent completes something
 *                    worth recording -- a significant finding, a task completed,
 *                    an alert fired. Remove the date guard and use didMeaningfulWork.
 *
 *   Every cycle:     Valid for high-frequency agents where each cycle produces
 *                    verifiable work. At 0.1 HBAR/write and 48 cycles/day that's
 *                    ~4.8 HBAR/day -- make sure the cadence is intentional.
 */

import "dotenv/config";
import cron from "node-cron";
import { logScore, getScore } from "./fixatum.js";
import { writeRecord } from "./hcs.js";
import { callToolbox } from "./toolbox.js";

// -- Configuration ------------------------------------------------------------

const CRON_SCHEDULE = "0 * * * *"; // every hour -- adjust to your cadence
const AGENT_LABEL = process.env.AGENT_LABEL || "agent";

let cycleCount = 0;
let lastHcsWriteDate = null; // guards once-per-day HCS writes

// -- Startup ------------------------------------------------------------------

console.log(`[${AGENT_LABEL}] Starting up...`);
await logScore(); // print current Fixatum score to logs on boot

// -- Core cycle ---------------------------------------------------------------

async function runCycle() {
  cycleCount++;
  const now = new Date();
  const startedAt = now.toISOString();
  console.log(`\n[${AGENT_LABEL}] Cycle ${cycleCount} -- ${startedAt}`);

  try {
    // Step 1: Check your score (free) -----------------------------------------
    const score = await getScore();
    if (score) {
      console.log(`[${AGENT_LABEL}] Score: ${score.score}/100 Grade ${score.grade}`);
    }

    // Step 2: Your agent logic goes here --------------------------------------
    // Replace or extend this block with whatever your agent does.
    // Examples:
    //   - Query a Hedera token:        callToolbox("token_price", { token_id: "0.0.xxx" })
    //   - Scan an HCS topic:           callToolbox("hcs_monitor", { topic_id: "0.0.xxx" })
    //   - Screen a wallet:             callToolbox("identity_check_sanctions", { account_id: "0.0.xxx" })
    //
    // Every paid Toolbox call generates provenance that feeds your Fixatum score.

    const didMeaningfulWork = true; // replace with real condition
    const observation = "Cycle complete. Add your logic here.";
    console.log(`[${AGENT_LABEL}] ${observation}`);

    // Step 3: Write HCS record -- once per day (default) ----------------------
    // The date guard below ensures one record per UTC day regardless of how
    // often this cycle runs. Change the guard logic to match your use case:
    //
    //   Per action:  remove the guard, call writeRecord() only when didMeaningfulWork
    //   Every cycle: remove the guard entirely

    const todayUTC = now.toUTCString().slice(0, 16); // e.g. "Fri, 18 Apr 2026"
    const shouldWrite = didMeaningfulWork && lastHcsWriteDate !== todayUTC;

    if (shouldWrite) {
      await writeRecord("heartbeat", {
        cycle: cycleCount,
        score: score?.score ?? null,
        grade: score?.grade ?? null,
        observation,
      });
      lastHcsWriteDate = todayUTC;
    }

  } catch (err) {
    console.error(`[${AGENT_LABEL}] Cycle error:`, err.message);
  }
}

// -- Scheduler ----------------------------------------------------------------

// Run immediately on start, then on schedule.
await runCycle();

cron.schedule(CRON_SCHEDULE, runCycle);
console.log(`[${AGENT_LABEL}] Scheduled -- ${CRON_SCHEDULE}`);

// -- Graceful shutdown --------------------------------------------------------

process.on("SIGTERM", () => {
  console.log(`[${AGENT_LABEL}] SIGTERM received -- shutting down.`);
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(`[${AGENT_LABEL}] SIGINT received -- shutting down.`);
  process.exit(0);
});
