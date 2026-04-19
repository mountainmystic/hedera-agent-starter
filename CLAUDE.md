# CLAUDE.md
# Instructions for AI coding assistants

You are helping someone build an autonomous agent on Hedera using this scaffold.
Read this file first. It will save you significant research time.

---

## What this repo is

A complete, working scaffold for a Hedera agent. All Hedera-specific plumbing is
already written and tested in production. You do not need to research Hedera APIs,
HCS message formats, SSE parsing, or DID registration flows -- it is all handled.

Your job is almost always one of these:
  - Fill in the agent's logic (Step 2 in src/agent.js)
  - Adjust the cron schedule and HCS write frequency
  - Add new Toolbox tool calls to the cycle
  - Help the user understand what their agent is doing

---

## The one file you will edit most

**src/agent.js** -- the main loop.

Find this comment block and replace it with the user's logic:

```js
// Step 2: Your agent logic goes here
const didMeaningfulWork = true; // replace with real condition
const observation = "Cycle complete. Add your logic here.";
```

Everything above and below that block is infrastructure -- leave it alone unless
the user specifically asks you to change the schedule or HCS write behaviour.

---

## How to call Hedera tools

Use the callToolbox() function from src/toolbox.js. It handles auth and SSE parsing.

```js
import { callToolbox } from "./toolbox.js";

const result = await callToolbox("tool_name", { param: "value" });
if (result.ok) {
  console.log(result.data);
}
```

callToolbox() always resolves -- it never throws. Check result.ok before using result.data.

### Available tools (with costs)

Free (no balance needed):
  fixatum_score       -- live trust score for any DID
  fixatum_status      -- registration status for an account
  account_info        -- Toolbox balance and pricing
  get_terms           -- terms of service
  confirm_terms       -- accept terms (run once before paid tools)

0.10 HBAR per call:
  hcs_monitor         -- HCS topic status and recent messages
  hcs_query           -- natural language search over HCS messages
  hcs_write_record    -- write tamper-evident record to an HCS topic
  token_price         -- live price, market cap, 24h volume
  token_monitor       -- whale movements and unusual transfer patterns

0.20 HBAR per call:
  identity_resolve    -- account profile, token holdings, transaction history
  governance_monitor  -- open proposals, deadlines, current vote tallies
  contract_read       -- contract info, bytecode, storage details

0.50 HBAR per call:
  identity_verify_kyc -- KYC grant status for a Hedera account

1.00 HBAR per call:
  hcs_understand      -- anomaly detection, trends, risk assessment on a topic
  hcs_verify_record   -- verify a record has not been tampered with
  identity_check_sanctions -- on-chain risk signals and behavioural screening
                             ⚠️  HIGH COST WARNING: 1.0 HBAR per call. Do NOT call
                             this on every cycle or every score query. Cache the
                             result and refresh at most once per 24 hours. Suitable
                             for one-time screening at registration, or on a long
                             interval. Calling this in a tight loop will drain your
                             Toolbox balance rapidly.
  governance_analyze  -- voter sentiment, participation, outcome prediction
  contract_call       -- read-only contract function call

1.50 HBAR per call:
  contract_analyze    -- activity patterns, caller distribution, risk assessment

2.00 HBAR per call:
  hcs_audit_trail     -- full chronological audit trail for an entity

100 HBAR one-time:
  fixatum_register    -- register a permanent DID on Hedera (irreversible)

Every paid tool call generates provenance that feeds the agent's Fixatum trust score.

---

## How to write to the agent's HCS topic

The agent's HCS topic is its permanent on-chain memory. Use writeRecord() from src/hcs.js:

```js
import { writeRecord } from "./hcs.js";

await writeRecord("observation", {
  summary: "Something worth recording",
  value: 42,
});
```

writeRecord() silently skips if AGENT_DID or AGENT_HCS_TOPIC are not set in .env.
It will never crash the agent.

Write cadence guidance:
  - Once per day is fine for most agents (default behaviour)
  - Write per meaningful action if your agent produces irregular work
  - Avoid writing every cycle unless each cycle produces genuinely distinct work
  - Cost is 0.1 HBAR per write

Alternatively, the user can write directly to their HCS topic using @hashgraph/sdk
without going through Toolbox. See the commented example at the bottom of src/hcs.js.

---

## Environment variables the agent needs

Required to run at all:
  TOOLBOX_API_KEY     -- the agent's Hedera account ID (e.g. 0.0.1234567)

Required for HCS writes and score queries (set after Fixatum registration):
  AGENT_DID           -- did:hedera:mainnet:z..._0.0.XXXXXXX
  AGENT_ACCOUNT_ID    -- the agent's Hedera account ID
  AGENT_HCS_TOPIC     -- the agent's dedicated HCS topic ID (e.g. 0.0.XXXXXXX)

Optional:
  AGENT_LABEL         -- short name used in logs and HCS records
  TOOLBOX_API_URL     -- defaults to https://api.hederatoolbox.com

The agent runs without AGENT_DID and AGENT_HCS_TOPIC -- Fixatum calls and HCS
writes are gracefully skipped until registration is complete.

---

## Fixatum DID registration

If the user wants a permanent on-chain identity for their agent:

```bash
npm run register
```

This generates an Ed25519 keypair and prints exact payment instructions.
The user sends 100 HBAR to the Fixatum wallet with the public key as memo.
Registration completes within ~30 seconds. No code changes needed after .env is updated.

Do NOT attempt to automate the payment step. It requires the user to send HBAR
from their own wallet. Always route irreversible on-chain actions through the human.

---

## Deploying to Railway

1. Create a new service in Railway, connect the GitHub repo
2. Set env vars in the Railway dashboard (same as .env)
3. Railway runs npm start automatically on every push to main
4. No Dockerfile needed

---

## What not to change

- src/toolbox.js -- SSE parsing is production-tested, do not rewrite it
- scripts/register.js -- keypair generation logic is correct, do not modify
- The graceful shutdown handlers in src/agent.js
- The callToolbox() pattern -- always resolve, never throw

---

## If the user is non-technical

They can describe their agent in plain English and you can translate it directly
into the Step 2 block in src/agent.js. Example:

  User: "I want my agent to check the price of HBAR every hour and write a
         record if it moves more than 5% since the last check."

  You: Fill in Step 2 with a token_price call, compare to a stored lastPrice
       variable, and call writeRecord() conditionally. Add lastPrice to the
       module scope. That's the entire change needed.

The scaffold handles everything else. The user's idea is the only missing piece.
