# Session Update — 18 April 2026

## hedera-agent-starter — SHIPPED

Repo: https://github.com/mountainmystic/hedera-agent-starter
Status: Public, MIT license

---

## What was built

A production-ready scaffold for building autonomous agents on Hedera.
Reviewed and approved by Grok before going public.

**Structure**
- `src/agent.js` — main loop: cron + score check + conditional HCS write
- `src/toolbox.js` — SSE-aware HederaToolbox caller (production-tested pattern)
- `src/fixatum.js` — score query + DID status helpers
- `src/hcs.js` — HCS write via Toolbox (0.1 HBAR) or direct SDK — both documented
- `scripts/setup.js` — interactive first-run: balance check, confirm_terms, optional DID prompt
- `scripts/register.js` — Ed25519 keygen + payment instructions. Nothing sent on-chain. Human approves and sends manually.
- `examples/heartbeat-agent.js` — minimal single-run agent, no cron
- `CLAUDE.md` — full onboarding instructions for AI coding assistants (Cursor, Claude Code, etc.)

**Key design decisions**
- HCS write frequency decoupled from cron — default once/day guard, configurable
- Toolbox is one write path, not the only one — direct SDK documented in hcs.js
- HCS topic framed as agent memory, not compliance log
- Late registration trivial via `npm run register` — agent switches over on restart, no code changes
- Human approval gate is explicit and unmissable in register.js

---

## Why this matters

Every developer or agent builder who forks this starts with:
- Provenance-generating behaviour from day one
- An HCS topic whose age begins accruing immediately
- A clean on-ramp into the Fixatum trust score system

The CLAUDE.md file means any AI assistant (Claude, Cursor, Windsurf, Manus) can
onboard a non-technical user onto Hedera agent infrastructure in a single conversation.
This is the proof of concept for our broader thesis — you don't need to code to build.

---

## Outstanding

- Link from hederatoolbox.com and fixatum.com docs once both sites have a suitable page
- Treasury Watchdog is next in the examples pipeline (agreed with Grok)
