/**
 * hcs.js
 * Write records to your agent's dedicated HCS topic.
 *
 * Your HCS topic is your agent's permanent on-chain memory.
 * Write to it when something meaningful happens — not on a timer.
 * Once per day, once per significant action, or every cycle if your agent
 * produces high-frequency verifiable work. You decide the cadence.
 *
 * -- Two ways to write --------------------------------------------------------
 *
 * Option A -- via HederaToolbox (default, used here):
 *   writeRecord("action", { ... })
 *   Cost: 0.1 HBAR per write via your Toolbox balance.
 *   Each write also generates provenance that feeds your Fixatum score.
 *
 * Option B -- direct Hedera SDK (bring your own):
 *   Use @hashgraph/sdk directly if you prefer full control.
 *   See the SDK example at the bottom of this file.
 *   You still get the permanent topic and aged history from Fixatum registration.
 *   Your score still benefits from account age and screening -- Toolbox provenance
 *   is one component, not the whole picture.
 *
 * -- Record types -------------------------------------------------------------
 *
 * The record_type field is free-form -- define whatever makes sense for your agent.
 * Suggestions:
 *   "heartbeat"   -- daily liveness proof
 *   "action"      -- a task your agent completed
 *   "observation" -- something your agent noticed or decided
 *   "alert"       -- an anomaly or threshold breach
 *   "memory"      -- a summary or insight worth keeping permanently
 *
 * Requires AGENT_HCS_TOPIC and AGENT_DID in your .env.
 * Both are assigned at Fixatum registration -- run: npm run register
 */

import { callToolbox } from "./toolbox.js";

const AGENT_DID = process.env.AGENT_DID;
const AGENT_HCS_TOPIC = process.env.AGENT_HCS_TOPIC;
const AGENT_LABEL = process.env.AGENT_LABEL || "agent";

/**
 * Write a record to the agent's HCS topic via HederaToolbox.
 *
 * Call this when something worth recording happens -- not necessarily
 * every cycle. One meaningful record per day is enough to keep your
 * topic active and your history growing.
 *
 * @param {string} recordType  - Short string identifying the record category
 * @param {object} data        - Structured payload (will be JSON-stringified)
 * @returns {Promise<{ok: boolean, record_id: string | null}>}
 */
export async function writeRecord(recordType, data = {}) {
  if (!AGENT_DID || !AGENT_HCS_TOPIC) {
    console.log(
      "[hcs] Skipping -- DID or topic not set. Run: npm run register"
    );
    return { ok: false, record_id: null };
  }

  const result = await callToolbox("hcs_write_record", {
    topic_id: AGENT_HCS_TOPIC,
    entity_id: AGENT_DID,
    record_type: recordType,
    data: JSON.stringify({
      agent: AGENT_LABEL,
      timestamp: new Date().toISOString(),
      ...data,
    }),
  });

  if (!result.ok) {
    console.error("[hcs] Write failed:", result);
    return { ok: false, record_id: null };
  }

  const record_id = result.data?.record_id ?? null;
  console.log(`[hcs] Record written -- type: ${recordType}  id: ${record_id}`);
  return { ok: true, record_id };
}

// -- Option B: Direct SDK write (reference only -- not called above) ----------
//
// If you prefer to write directly to Hedera without routing through Toolbox:
//
// import { Client, AccountId, PrivateKey, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
//
// const client = Client.forMainnet();
// client.setOperator(
//   AccountId.fromString(process.env.AGENT_ACCOUNT_ID),
//   PrivateKey.fromStringECDSA(process.env.AGENT_PRIVATE_KEY)  // your wallet key
// );
//
// const record = JSON.stringify({
//   agent: AGENT_LABEL,
//   record_type: "action",
//   timestamp: new Date().toISOString(),
//   data: { ... }
// });
//
// const tx = await new TopicMessageSubmitTransaction()
//   .setTopicId(AGENT_HCS_TOPIC)
//   .setMessage(record)
//   .execute(client);
//
// const receipt = await tx.getReceipt(client);
//
// Notes:
//   - Network fee is ~$0.0001 USD, paid in HBAR from your wallet directly
//   - No Toolbox balance needed
//   - No provenance generated for Fixatum scoring (Toolbox calls drive that component)
//   - Topic ownership and account age scoring are unaffected -- both accrue regardless
