# Solana Agent Payout Receipts

Non-custodial MVP for turning a Solana transaction signature into an auditable payment receipt. It reads a public RPC endpoint and never requests a seed phrase, signs transactions, or holds funds.

## Run

Requires Node.js 18+.

```bash
npm test
npm run receipt -- <TRANSACTION_SIGNATURE>
npm run receipt -- <TRANSACTION_SIGNATURE> --rpc https://api.devnet.solana.com --format csv --out receipt.csv
```

The JSON receipt includes network, slot, block time, confirmation status, native SOL transfers, and SPL-token balance deltas. A missing transaction is reported as `not-found`; a transaction with an RPC error is reported as `rejected`.

## Scope and safety

This tool is an accounting/verification aid, not a wallet. Token balances are interpreted from the RPC response and should be independently checked before being used for tax, legal, or financial reporting.

## Status

MVP prepared as a candidate deliverable for the Agentic Engineering Grant. The parser is covered by four offline tests. The application evidence is in `grant-response.md`; a live RPC example should be added after the submission flow is authorized.
