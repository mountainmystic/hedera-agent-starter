# hedera-agent-starter

A minimal scaffold for building autonomous agents on Hedera.

Fork it. Drop your logic into `src/agent.js`. Your agent runs with on-chain identity, a provenance trail, and a live trust score from day one.

---

## Quick start

```
git clone -> npm install -> npm run setup -> npm start
```

**Prerequisites:** Node.js 22+, a Hedera account with some HBAR.

---

## Setup in 5 steps

**1. Clone and install**

```bash
git clone https://github.com/YOUR_USERNAME/hedera-agent-starter.git
cd hedera-agent-starter
npm install
```

**2. Top up your Toolbox balance**

Your Hedera account ID is your API key. Send any HBAR to:

```
0.0.10309126
```

No memo needed. Credits appear within ~10 seconds.
Always confirm the current deposit address at [hederatoolbox.com](https://hederatoolbox.com) before sending.

**3. Configure .env**

```bash
cp .env.example .env
```

Set `TOOLBOX_API_KEY` to your Hedera account ID (e.g. `0.0.1234567`).

**4. Run setup**

```bash
npm run setup
```

Checks your balance, accepts Toolbox terms of service, optionally walks you through DID registration.

**5. Start**

```bash
npm start
```

The agent runs immediately, logs your Fixatum score, then runs on the cron schedule.

---

## The heartbeat pattern

Every cycle the default agent does three things:

1. **Checks its Fixatum score** (free -- no HBAR spent)
2. **Runs your logic** (Step 2 in `src/agent.js`)
3. **Writes an HCS record if something meaningful happened** (0.1 HBAR)

The HCS record is your agent's permanent on-chain memory. It belongs to your agent, accumulates from day one, and can't be backdated.

**Write cadence is yours to set.**

The default writes once per UTC day. Change the guard logic in `src/agent.js`:

- **Once per day** -- default. ~3 HBAR/month.
- **Per meaningful action** -- write only when something worth recording happened. Zero writes on quiet days is fine.
- **Every cycle** -- for agents where every cycle produces distinct verifiable work. At 0.1 HBAR/write, be deliberate.

**Toolbox is optional for HCS writes.**

`hcs.js` uses Toolbox by default (0.1 HBAR/write, generates provenance). You can write directly to your topic using `@hashgraph/sdk` instead -- network fee is fractions of a cent, no Toolbox balance needed. See the SDK example at the bottom of `src/hcs.js`.

Either path writes to the same topic. The topic's age accrues either way.

**Why topic age matters.**

Your Fixatum score has four components: account age (0-25), provenance from verified Toolbox calls (0-40), on-chain screening (0-20), and a longevity bonus (0-5).

Account age is straightforward -- it's how long your Hedera account and HCS topic have been active. An agent with 200 days of history looks structurally different from one that appeared last week. That history can't be bought retroactively. Registering a DID now starts the clock. The cost is 100 HBAR one-time. The advantage compounds quietly.

---

## Add your logic

Open `src/agent.js` and find Step 2:

```js
// Step 2: Your agent logic goes here
// Examples:
//   callToolbox("token_price", { token_id: "0.0.xxx" })
//   callToolbox("hcs_monitor", { topic_id: "0.0.xxx" })
//   callToolbox("identity_check_sanctions", { account_id: "0.0.xxx" })
```

Every paid Toolbox call generates provenance that feeds your Fixatum score.

Full tool list and pricing: [hederatoolbox.com](https://hederatoolbox.com)

---

## Fixatum DID registration (optional)

**Cost:** 100 HBAR (one-time, non-refundable)

**What you get:**
- A permanent `did:hedera:mainnet:z...` identity, W3C-compatible
- A dedicated HCS topic -- your agent's on-chain memory from day one
- A genesis record written at registration
- A live trust score queryable by any agent or platform

**Register during setup:**

```bash
npm run setup
```

Answer `y` when prompted.

**Register later (agent already running):**

```bash
npm run register
```

Generates your Ed25519 keypair and prints exact payment instructions. You send the payment. The agent switches over on the next restart after you update `.env` -- no code changes needed.

---

## Project structure

```
hedera-agent-starter/
├── src/
│   ├── agent.js        -- Main loop (cron + heartbeat pattern)
│   ├── toolbox.js      -- HederaToolbox MCP caller (SSE-aware)
│   ├── fixatum.js      -- Score query + DID status helpers
│   └── hcs.js          -- HCS write wrapper (Toolbox or direct SDK)
├── scripts/
│   ├── setup.js        -- Interactive first-run
│   └── register.js     -- Fixatum DID registration guide + keygen
├── examples/
│   └── heartbeat-agent.js -- Minimal working agent (no cron)
├── CLAUDE.md           -- Instructions for AI coding assistants
├── .env.example
└── package.json
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `TOOLBOX_API_KEY` | Yes | Your Hedera account ID -- your Toolbox API key |
| `TOOLBOX_API_URL` | No | Defaults to `https://api.hederatoolbox.com` |
| `AGENT_DID` | No* | Your Fixatum DID -- set after registration |
| `AGENT_ACCOUNT_ID` | No* | Your agent's Hedera account ID |
| `AGENT_HCS_TOPIC` | No* | Your dedicated HCS topic -- set after registration |
| `AGENT_LABEL` | No | Short name used in logs and HCS records |

*The agent runs without these. Fixatum calls return null, HCS writes are silently skipped.

---

## Deploying to Railway

1. Create a new service, connect this repo
2. Set env vars in the Railway dashboard
3. Push to master -- Railway deploys automatically

No Dockerfile needed.

---

## Learn more

- [HederaToolbox](https://hederatoolbox.com) -- tool list, pricing, deposit address
- [Fixatum](https://fixatum.com) -- DID registration, trust scores
- [Hedera Consensus Service](https://hedera.com/consensus-service)
- [W3C DID specification](https://www.w3.org/TR/did-core/)

---

## License

MIT
