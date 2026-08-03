#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

function tokenDecimals(meta, mint) {
  const entries = [...(meta?.preTokenBalances ?? []), ...(meta?.postTokenBalances ?? [])];
  return entries.find((entry) => entry.mint === mint)?.uiTokenAmount?.decimals ?? 0;
}

function toUiAmount(raw, decimals) {
  const negative = raw < 0n;
  const absolute = negative ? -raw : raw;
  const digits = absolute.toString().padStart(decimals + 1, "0");
  if (decimals === 0) return `${negative ? "-" : ""}${digits}`;
  const split = digits.length - decimals;
  const whole = digits.slice(0, split);
  const fraction = digits.slice(split).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function collectTokenDeltas(meta) {
  const before = new Map();
  const after = new Map();
  for (const entry of meta?.preTokenBalances ?? []) {
    before.set(`${entry.owner}|${entry.mint}`, BigInt(entry.uiTokenAmount.amount));
  }
  for (const entry of meta?.postTokenBalances ?? []) {
    after.set(`${entry.owner}|${entry.mint}`, BigInt(entry.uiTokenAmount.amount));
  }

  const keys = new Set([...before.keys(), ...after.keys()]);
  return [...keys].flatMap((key) => {
    const [owner, mint] = key.split("|");
    const delta = (after.get(key) ?? 0n) - (before.get(key) ?? 0n);
    if (delta === 0n) return [];
    const decimals = tokenDecimals(meta, mint);
    return [{
      asset: mint,
      assetType: "spl-token",
      owner,
      rawAmount: delta.toString(),
      amount: toUiAmount(delta, decimals),
      decimals
    }];
  });
}

function collectNativeTransfers(transaction) {
  const keys = transaction?.transaction?.message?.accountKeys ?? [];
  const accountAt = (index) => keys[index]?.pubkey ?? keys[index];
  const instructions = transaction?.transaction?.message?.instructions ?? [];
  return instructions.flatMap((instruction) => {
    const parsed = instruction?.parsed;
    if (instruction?.program !== "system" || parsed?.type !== "transfer") return [];
    const info = parsed.info ?? {};
    const lamports = BigInt(info.lamports ?? 0);
    return [{
      asset: "SOL",
      assetType: "native",
      from: info.source ?? accountAt(instruction.accounts?.[0]),
      to: info.destination ?? accountAt(instruction.accounts?.[1]),
      rawAmount: lamports.toString(),
      amount: toUiAmount(lamports, 9),
      decimals: 9
    }];
  });
}

export function buildReceipt(signature, network, transaction) {
  if (!transaction) {
    return { signature, network, status: "not-found", confirmed: false, transfers: [] };
  }
  const error = transaction.meta?.err ?? null;
  return {
    signature,
    network,
    slot: transaction.slot ?? null,
    blockTime: transaction.blockTime ?? null,
    status: error ? "rejected" : "confirmed",
    confirmed: !error,
    error,
    transfers: [...collectNativeTransfers(transaction), ...collectTokenDeltas(transaction.meta)]
  };
}

export function receiptToCsv(receipt) {
  const header = "signature,network,status,asset,assetType,amount,rawAmount,from,to,owner,slot,blockTime";
  const rows = receipt.transfers.map((transfer) => [
    receipt.signature,
    receipt.network,
    receipt.status,
    transfer.asset,
    transfer.assetType,
    transfer.amount,
    transfer.rawAmount,
    transfer.from ?? "",
    transfer.to ?? "",
    transfer.owner ?? "",
    receipt.slot ?? "",
    receipt.blockTime ?? ""
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return [header, ...rows].join("\n") + "\n";
}

async function rpcRequest(rpcUrl, signature) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [signature, {
        encoding: "jsonParsed",
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0
      }]
    })
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`RPC ${payload.error.code}: ${payload.error.message}`);
  return payload.result;
}

function parseArgs(argv) {
  const [signature, ...rest] = argv;
  const options = { signature, rpc: DEFAULT_RPC, format: "json", out: null };
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--rpc") options.rpc = rest[++index];
    else if (rest[index] === "--format") options.format = rest[++index];
    else if (rest[index] === "--out") options.out = rest[++index];
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.signature) {
    console.error("Usage: npm run receipt -- <signature> [--rpc <url>] [--format json|csv] [--out <file>]");
    process.exitCode = 2;
    return;
  }
  const network = options.rpc.includes("devnet") ? "devnet" : options.rpc.includes("testnet") ? "testnet" : "mainnet-beta";
  const receipt = buildReceipt(options.signature, network, await rpcRequest(options.rpc, options.signature));
  const output = options.format === "csv" ? receiptToCsv(receipt) : `${JSON.stringify(receipt, null, 2)}\n`;
  if (options.out) await import("node:fs/promises").then(({ writeFile }) => writeFile(options.out, output, "utf8"));
  else process.stdout.write(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
