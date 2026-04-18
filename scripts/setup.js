/**
 * scripts/setup.js
 * Interactive first-run setup.
 * Run: npm run setup
 *
 * What this does:
 *   1. Reads your .env file and validates required variables
 *   2. Checks your Toolbox balance
 *   3. Runs confirm_terms if not already accepted
 *   4. Optionally launches DID registration (npm run register)
 */

import { existsSync, copyFileSync } from "fs";
import { createInterface } from "readline";
import { callToolbox } from "../src/toolbox.js";

// -- .env bootstrap -----------------------------------------------------------

if (!existsSync(".env")) {
  if (existsSync(".env.example")) {
    copyFileSync(".env.example", ".env");
    console.log("Created .env from .env.example -- fill in your values and re-run setup.");
  } else {
    console.error("No .env file found. Copy .env.example to .env and fill in your values.");
  }
  process.exit(1);
}

const { default: dotenv } = await import("dotenv");
dotenv.config();

// -- Helpers ------------------------------------------------------------------

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function section(title) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(` ${title}`);
  console.log("─".repeat(50));
}

// -- Main ---------------------------------------------------------------------

const rl = createInterface({ input: process.stdin, output: process.stdout });

console.log("\n Hedera Agent Starter -- Setup\n");

// Step 1: Validate env
section("1 / 4  Checking configuration");

const TOOLBOX_API_KEY = process.env.TOOLBOX_API_KEY;
const AGENT_DID = process.env.AGENT_DID;

if (!TOOLBOX_API_KEY || TOOLBOX_API_KEY.includes("XXXXXXX")) {
  console.error(
    "\n  TOOLBOX_API_KEY is not set.\n" +
    "  Your Hedera account ID is your API key.\n" +
    "  Top up at https://hederatoolbox.com -- send any HBAR to 0.0.10309126 (no memo).\n" +
    "  Credits appear within ~10 seconds.\n"
  );
  rl.close();
  process.exit(1);
}

console.log(`  API key:  ${TOOLBOX_API_KEY}`);
console.log(`  DID:      ${AGENT_DID || "(not registered)"}`);

// Step 2: Balance check
section("2 / 4  Checking Toolbox balance");

const accountInfo = await callToolbox("account_info", {});
if (!accountInfo.ok) {
  console.error("  Could not reach HederaToolbox. Check your internet connection.");
  rl.close();
  process.exit(1);
}

const balance = accountInfo.data?.balance_hbar ?? accountInfo.data?.balance ?? "unknown";
console.log(`  Balance:  ${balance} HBAR`);

if (typeof balance === "number" && balance < 1) {
  console.log(
    "\n  Low balance. Top up before running your agent.\n" +
    "  Send any HBAR to 0.0.10309126 -- credits within ~10 seconds."
  );
}

// Step 3: confirm_terms
section("3 / 4  Terms of service");

const termsResult = await callToolbox("confirm_terms", {});
if (termsResult.ok) {
  console.log("  Terms accepted. Paid tools are now available.");
} else {
  console.log("  Terms may already be accepted -- continuing.");
}

// Step 4: DID registration prompt
section("4 / 4  Fixatum DID registration");

if (AGENT_DID && !AGENT_DID.includes("...")) {
  console.log(`  DID already registered: ${AGENT_DID}`);
  console.log("  Setup complete. Run: npm start");
  rl.close();
  process.exit(0);
}

console.log(
  "\n  A Fixatum DID is optional but recommended.\n" +
  "\n  What you get:\n" +
  "    - A permanent W3C-compatible identity on Hedera\n" +
  "    - Your own dedicated HCS topic (your agent's on-chain memory)\n" +
  "    - A live trust score that builds over time based on your agent's behaviour\n" +
  "\n  Cost: 100 HBAR (one-time, non-refundable)\n" +
  "  Your HCS topic's age is a hard-to-fake signal in your trust score.\n" +
  "  Starting the clock early compounds -- even if you don't use it yet.\n"
);

const answer = await ask(rl, "  Register a Fixatum DID now? (y/N): ");

if (answer.trim().toLowerCase() === "y") {
  console.log("\n  Launching registration...\n");
  rl.close();
  const { execSync } = await import("child_process");
  execSync("node scripts/register.js", { stdio: "inherit" });
} else {
  console.log(
    "\n  Skipped. You can register any time with: npm run register\n" +
    "  Setup complete. Run: npm start\n"
  );
  rl.close();
}
