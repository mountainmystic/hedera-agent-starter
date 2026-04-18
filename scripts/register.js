/**
 * scripts/register.js
 * Register a Fixatum DID for your agent.
 * Run: npm run register
 *
 * Works whether you're setting up for the first time or adding a DID
 * to an agent that's already running.
 *
 * What this script does:
 *   1. Generates an Ed25519 keypair (required -- standard Hedera wallets use ECDSA,
 *      which is NOT compatible with Fixatum DIDs)
 *   2. Shows you the exact payment to send
 *   3. Gives you the exact .env values to paste when your DID arrives
 *
 * Nothing is sent on-chain by this script. You make the payment yourself.
 */

import { generateKeyPairSync } from "crypto";

// -- Ed25519 keypair generation -----------------------------------------------

function base58Encode(buffer) {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = [0];

  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let result = "";
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) result += "1";
  for (let i = digits.length - 1; i >= 0; i--) result += ALPHABET[digits[i]];
  return result;
}

function derivePublicKeyMultibase(publicKeyDer) {
  const rawPublicKey = publicKeyDer.slice(-32);
  const multicodecPrefix = Buffer.from([0xed, 0x01]);
  const combined = Buffer.concat([multicodecPrefix, rawPublicKey]);
  return "z" + base58Encode(combined);
}

// -- Generate -----------------------------------------------------------------

const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});

const publicKeyMultibase = derivePublicKeyMultibase(publicKey);
const privateKeyHex = Buffer.from(privateKey).slice(-32).toString("hex");

// -- Output -------------------------------------------------------------------

const dotenv = await import("dotenv");
dotenv.default.config();

const accountId = process.env.AGENT_ACCOUNT_ID || process.env.TOOLBOX_API_KEY || "0.0.XXXXXXX";

console.log(`
${"=".repeat(60)}
  Fixatum DID Registration
${"=".repeat(60)}

Your Ed25519 keypair has been generated.
Save the private key securely -- it cannot be recovered.

  Public key (multibase):  ${publicKeyMultibase}
  Private key (hex):       ${privateKeyHex}

${"─".repeat(60)}
  Step 1: Send payment
${"─".repeat(60)}

  To:     0.0.10394452   (Fixatum wallet)
  Amount: 100 HBAR       (exact)
  Memo:   ${publicKeyMultibase}

  Send from your agent's Hedera account: ${accountId}
  The memo must be exactly the public key string above -- nothing else.

  Do NOT close this window until you have saved your private key.

${"─".repeat(60)}
  Step 2: Wait for confirmation (~30 seconds)
${"─".repeat(60)}

  Once the watcher picks up your payment:
    - Your DID is issued
    - A dedicated HCS topic is created for your agent
    - A genesis record is written to that topic

  Check registration status:
    https://did.fixatum.com/did/${accountId}

${"─".repeat(60)}
  Step 3: Update your .env
${"─".repeat(60)}

  When your DID appears at the URL above, add these to your .env:

  AGENT_DID=did:hedera:mainnet:${publicKeyMultibase}_${accountId}
  AGENT_HCS_TOPIC=<topic_id from did.fixatum.com/did/${accountId}>

  The AGENT_HCS_TOPIC value will be visible in the /did/ response
  once registration is complete.

${"─".repeat(60)}
  Already running?
${"─".repeat(60)}

  Your agent will start writing HCS records automatically on the
  next cycle after you update .env and restart.

  No code changes needed -- hcs.js and fixatum.js read AGENT_DID
  and AGENT_HCS_TOPIC on every cycle.

${"=".repeat(60)}
`);
