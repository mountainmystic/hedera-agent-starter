/**
 * scripts/register.js
 * Register a Fixatum DID for your agent.
 * Run: npm run register
 *
 * Works whether you're setting up for the first time or adding a DID
 * to an agent that's already running.
 *
 * What this script does:
 *   1. Generates an Ed25519 keypair locally (nothing sent on-chain)
 *   2. Prints the exact payment you need to send
 *   3. Gives you the exact .env values to paste when your DID arrives
 *
 * IMPORTANT: This script does NOT send any transaction or touch any wallet.
 * The payment in Step 1 below must be sent by you, manually, from your
 * own Hedera account. No on-chain action happens without your explicit approval.
 */

import { generateKeyPairSync } from "crypto";

// -- Ed25519 keypair generation -----------------------------------------------
// Standard Hedera wallets use ECDSA. Fixatum DIDs require Ed25519.
// They are not interchangeable -- this generates the correct key type.

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

Your Ed25519 keypair has been generated locally.
Nothing has been sent on-chain. Read all steps before doing anything.

  Public key (multibase):  ${publicKeyMultibase}
  Private key (hex):       ${privateKeyHex}

  SAVE YOUR PRIVATE KEY NOW. It is not stored anywhere.
  If you lose it you cannot prove ownership of this DID.

${"─".repeat(60)}
  Step 1: YOU send the payment (manual action required)
${"─".repeat(60)}

  To:     0.0.10394452   (Fixatum wallet)
  Amount: 100 HBAR       (exact -- not more, not less for clean records)
  Memo:   ${publicKeyMultibase}

  Send from: ${accountId}
  The memo must be exactly the public key above -- nothing else.
  Payment is non-refundable. Verify the address at fixatum.com before sending.

  Do NOT close this window until you have saved your private key.

${"─".repeat(60)}
  Step 2: Wait for confirmation (~30 seconds)
${"─".repeat(60)}

  Once your payment is detected:
    - Your DID is issued
    - A dedicated HCS topic is created for your agent
    - A genesis record is written to that topic

  Check status:
    https://did.fixatum.com/did/${accountId}

${"─".repeat(60)}
  Step 3: Update your .env
${"─".repeat(60)}

  When your DID appears at the URL above, add these to your .env:

  AGENT_DID=did:hedera:mainnet:${publicKeyMultibase}_${accountId}
  AGENT_HCS_TOPIC=<topic_id from did.fixatum.com/did/${accountId}>

${"─".repeat(60)}
  Already running?
${"─".repeat(60)}

  Update .env and restart. Your agent switches over automatically.
  No code changes needed.

${"=".repeat(60)}
`);
