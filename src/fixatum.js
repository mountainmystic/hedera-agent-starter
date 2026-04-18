/**
 * fixatum.js
 * Helpers for querying Fixatum DID status and trust score.
 * Registration is handled by scripts/register.js.
 */

import { callToolbox } from "./toolbox.js";

const FIXATUM_API_URL = "https://did.fixatum.com";
const AGENT_DID = process.env.AGENT_DID;
const AGENT_ACCOUNT_ID = process.env.AGENT_ACCOUNT_ID;

/**
 * Fetch the live Fixatum trust score for this agent.
 * Free tool — costs nothing, no balance needed.
 *
 * Returns null if no DID is registered yet.
 *
 * @returns {Promise<{score: number, grade: string, components: object} | null>}
 */
export async function getScore() {
  if (!AGENT_DID) return null;

  const result = await callToolbox("fixatum_score", { did: AGENT_DID });
  if (!result.ok || !result.data) return null;

  return {
    score: result.data.score ?? null,
    grade: result.data.grade ?? null,
    components: result.data.components ?? {},
    raw: result.data,
  };
}

/**
 * Check registration status for this agent's account.
 * Useful on startup to confirm DID is live.
 *
 * @returns {Promise<{registered: boolean, did: string | null, topic: string | null}>}
 */
export async function getStatus() {
  if (!AGENT_ACCOUNT_ID) return { registered: false, did: null, topic: null };

  try {
    const res = await fetch(`${FIXATUM_API_URL}/did/${AGENT_ACCOUNT_ID}`);
    if (!res.ok) return { registered: false, did: null, topic: null };
    const data = await res.json();
    return {
      registered: !!data.agent_did,
      did: data.agent_did ?? null,
      topic: data.agent_topic_id ?? null,
    };
  } catch {
    return { registered: false, did: null, topic: null };
  }
}

/**
 * Log the current score to console in a clean format.
 * Call this at agent startup or after each cycle if you want visibility.
 */
export async function logScore() {
  const score = await getScore();
  if (!score) {
    console.log("[fixatum] No DID registered — run: npm run register");
    return;
  }
  console.log(
    `[fixatum] Score: ${score.score}/100  Grade: ${score.grade}  ` +
      `| Age: ${score.components.age ?? "—"}  ` +
      `Provenance: ${score.components.provenance ?? "—"}  ` +
      `Screening: ${score.components.screening ?? "—"}`
  );
}
