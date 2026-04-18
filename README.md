# hedera-agent-starter

A minimal scaffold for building accountable agents on Hedera.

Fork this. Add your logic. Your agent runs on Hedera with a verifiable on-chain identity and a trust score that builds from day one.

---

## What this gives you

- **Toolbox integration** -- metered access to 23 Hedera tools via HBAR micropayments (token data, HCS reads/writes, identity screening, contract calls)
- **Fixatum DID** -- a permanent W3C-compatible identity anchored to Hedera Consensus Service
- **Heartbeat pattern** -- your agent writes a tamper-evident HCS record when something meaningful happens, building a provenance trail that feeds your trust score
- **A trust score** -- live, 0-100, computed from account age, verified tool calls, and on-chain behaviour. Other agents and platforms query this to decide how much to trust yours.

---

## Quick start

```
Fork -> npm install -> npm run setup -> npm start
```

**Prerequisites:** Node.js 22+, a Hedera account with some HBAR.

---

## Setup in 5 steps

**1. Fork and install**

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

No memo needed. Credits appear within ~10 seconds. [More info](https://hederatoolbox.com)

**3. Configure .env**

```bash
cp .env.example .env
```

Open `.env` and set `TOOLBOX_API_KEY` to your Hedera account ID (e.g. `0.0.1234567`).

**4. Run setup**

```bash
npm run setup
```

This checks your balance, accepts the Toolbox terms of service, and optionally walks you through DID registration.

**5. Start your agent**

```bash
npm start
```

The agent starts immediately, logs your Fixatum score, and runs on schedule. You'll see your score and any HCS writes in the logs.

---

## The heartbeat pattern

Every cycle, the default agent does three things:

1. **Checks its Fixatum score** (free -- no HBAR spent)
2. **Runs your logic** (whatever your agent does)
3. **Writes an HCS record if something meaningful happened** (0.1 HBAR)

The HCS record is not just a log. It's a permanent, tamper-evident entry in your agent's on-chain memory -- a topic that belongs to your agent and accumulates history from the moment it's created.

**Write cadence is yours to set.**

The default writes once per UTC day regardless of how often your cycle runs. Change the guard logic in `src/agent.js` to match your use case:

- **Once per day** -- default. Keeps your topic active with minimal spend (~3 HBAR/month).
- **Per meaningful action** -- call `writeRecord()` only when your agent completes something worth recording. Zero writes on quiet days is fine.
- **Every cycle** -- valid for high-frequency agents where each cycle produces verifiable work. At 0.1 HBAR/write, be deliberate about cadence before enabling this.

**Your HCS topic doesn't require Toolbox.**

`hcs.js` uses Toolbox as the write path by default, but your topic is a standard Hedera HCS topic. You can write to it directly using `@hashgraph/sdk` -- no Toolbox balance needed, network fee is fractions of a cent. See the SDK example at the bottom of `src/hcs.js`.

Either way, the topic was created at Fixatum registration and it belongs to your agent. Its age starts accruing from that moment.

**Why topic age matters.**

Your Fixatum score has four components: account age, provenance (verified Toolbox calls), on-chain screening, and a longevity bonus. Account age scores how long your Hedera account has been active -- your HCS topic's existence is part of that signal.

An agent with 200 days of on-chain history looks structurally different from one that appeared last week. That history can't be bought retroactively. Registering a Fixatum DID now -- even before your agent does anything significant -- starts that clock. The cost is 100 HBAR (one-time). The advantage compounds quietly.

---

## Add your logic

Open `src/agent.js`. The comment block in Step 2 shows you where to add your work:

```js
// Step 2: Your agent logic goes here
// Examples:
//   callToolbox("token_price", { token_id: "0.0.xxx" })
//   callToolbox("hcs_monitor", { topic_id: "0.0.xxx" })
//   callToolbox("identity_check_sanctions", { account_id: "0.0.xxx" })
```

Every paid Toolbox call generates provenance that feeds your Fixatum score. More verified calls = higher score = higher trust signal to other agents and platforms.

Full tool list and pricing: [hederatoolbox.com](https://hederatoolbox.com)

---

## Fixatum DID registration

**Cost:** 100 HBAR (one-time, non-refundable)

**What you get:**
- A permanent `did:hedera:mainnet:z...` identity, W3C-compatible
- A dedicated HCS topic -- your agent's on-chain memory, owned by your agent
- A genesis record written at registration
- A live trust score queryable by any agent or platform

**Register during setup:**

```bash
npm run setup
```

Setup will ask if you want to register. Answer `y` and follow the instructions.

**Register later (already running):**

```bash
npm run register
```

This generates your Ed25519 keypair and gives you the exact payment instructions. Your agent switches over automatically after you update `.env` and restart -- no code changes needed.

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

*Optional until you register a DID. The agent runs without these -- HCS writes are silently skipped.

---

## Deploying to Railway

1. Create a new service in Railway
2. Connect your GitHub repo
3. Set env vars in the Railway dashboard (copy from your `.env`)
4. Railway deploys on every push to main

Railway will run `npm start` automatically. No Dockerfile needed.

---

## Learn more

- [HederaToolbox -- full tool list and pricing](https://hederatoolbox.com)
- [Fixatum -- DID registration and trust scores](https://fixatum.com)
- [Hedera Consensus Service](https://hedera.com/consensus-service)
- [W3C DID specification](https://www.w3.org/TR/did-core/)

---

## License

MIT
