import test from "node:test";
import assert from "node:assert/strict";
import { buildReceipt, receiptToCsv } from "../src/receipt.mjs";

const fixture = {
  slot: 123,
  blockTime: 1700000000,
  meta: {
    err: null,
    preTokenBalances: [{ owner: "Bob", mint: "USDC", uiTokenAmount: { amount: "1000000", decimals: 6 } }],
    postTokenBalances: [{ owner: "Bob", mint: "USDC", uiTokenAmount: { amount: "3500000", decimals: 6 } }]
  },
  transaction: {
    message: {
      accountKeys: [{ pubkey: "Alice" }, { pubkey: "Bob" }],
      instructions: [{
        program: "system",
        parsed: { type: "transfer", info: { source: "Alice", destination: "Bob", lamports: 250000000 } }
      }]
    }
  }
};

test("builds a confirmed receipt with native and SPL transfers", () => {
  const receipt = buildReceipt("sig-1", "devnet", fixture);
  assert.equal(receipt.status, "confirmed");
  assert.equal(receipt.confirmed, true);
  assert.equal(receipt.transfers[0].amount, "0.25");
  assert.equal(receipt.transfers[1].amount, "2.5");
  assert.equal(receipt.transfers[1].asset, "USDC");
});

test("marks failed transactions as rejected", () => {
  const receipt = buildReceipt("sig-2", "mainnet-beta", { ...fixture, meta: { ...fixture.meta, err: { InstructionError: [0, "Custom"] } } });
  assert.equal(receipt.status, "rejected");
  assert.equal(receipt.confirmed, false);
});

test("returns an explicit not-found state", () => {
  assert.deepEqual(buildReceipt("missing", "mainnet-beta", null), {
    signature: "missing",
    network: "mainnet-beta",
    status: "not-found",
    confirmed: false,
    transfers: []
  });
});

test("exports a safe CSV row", () => {
  const csv = receiptToCsv(buildReceipt("sig-1", "devnet", fixture));
  assert.match(csv, /signature,network,status/);
  assert.match(csv, /"sig-1","devnet","confirmed","SOL"/);
});
