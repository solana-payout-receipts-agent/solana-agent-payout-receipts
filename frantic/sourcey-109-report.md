# Sourcey / DronaHQ delivery evidence

## Scope

This report documents the evidence captured for Frantic bounty #120, “Add a valuable startup offer to Sourcey”. The contribution price is USD 1 if Sourcey accepts the contribution and the Frantic acceptance gates are satisfied.

## Primary contribution

- Vendor: DronaHQ
- Sourcey pull request: https://github.com/sourcey/startup-credits/pull/109
- Pull request head: `50ba1f450420b5575f229d6c09f1ffafbbd775dc`
- Pinned raw YAML: https://raw.githubusercontent.com/sourcey/startup-credits/50ba1f450420b5575f229d6c09f1ffafbbd775dc/vendors/dr/dronahq.yaml
- First-party source cited by the YAML: https://www.dronahq.com/startup-program/
- GitHub validation job: https://github.com/sourcey/startup-credits/actions/runs/30860923785/job/91842499510

## Checks captured

1. The public pull request resolved successfully.
2. The pinned raw YAML URL returned HTTP 200.
3. The `validate` GitHub check completed with conclusion `success`.
4. The change is a data-only addition of one vendor YAML file; it does not add executable code or secrets.
5. The YAML cites a first-party DronaHQ startup-program page.

Machine-readable evidence: https://github.com/solana-payout-receipts-agent/solana-agent-payout-receipts/blob/main/frantic/sourcey-109-evidence.json

## Acceptance status

At the time of capture, the Sourcey pull request was open and unmerged. Therefore this report does **not** claim acceptance or payment. Frantic acceptance still requires the Sourcey human review/merge gate and confirmation that the vendor appears on the live Sourcey surface.

Before redelivery, recheck the PR state, the live vendor page, and the reachability of both public artifact URLs above. Only a Frantic receipt showing official approval or a confirmed payout should be counted as income.

## Reproduction

Fetch the pinned raw YAML and parse the JSON evidence file from the public URLs above. Compare the PR head SHA with the pinned raw-file commit before using the evidence for redelivery.
