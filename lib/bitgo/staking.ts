// lib/bitgo/staking.ts
// ─────────────────────────────────────────────────────────────────────────────
// STAKING — BitGo Go-Staking (CaaS) REST client (typed wrappers).
// ─────────────────────────────────────────────────────────────────────────────
//
// WHAT THIS IS
//   Thin, typed HTTP wrappers around BitGo's Go Account staking API. This is the
//   ONLY place that speaks the go-staking endpoints; it returns raw BitGo JSON and
//   knows nothing about the UI. The domain mapping lives in lib/domain/staking.ts
//   and the orchestration (real APR + demo settlement) in lib/staking/service.ts.
//
// WHERE THE API LIVES
//   · Base URL (testnet):  https://app.bitgo-test.com   (Go-Staking is BETA and
//     testnet-only). Configured in lib/bitgo/config.ts via BITGO_API_BASE.
//   · Auth: Bearer access token (BITGO_ACCESS_TOKEN), added by bitgoFetch().
//   · Routes hang off:  /api/go-staking/v1
//     The {accountId} is the Go Account id (GO_ACCOUNT_A_ID) and {coin} is the OFC
//     coin id (e.g. "ofctsol"), which doubles as the path segment.
//
// OFFICIAL DOCS (verify before changing — project rule "no invented endpoints")
//   · LLM/Markdown index:   https://developers.bitgo.com/llms.txt
//   · Go Account staking:   https://developers.bitgo.com/docs/crypto-as-a-service-stake
//   · Cookbook (Go Account):https://developers.bitgo.com/cookbooks/stake-assets-go-account
//   · Rewards (Go Account): https://developers.bitgo.com/docs/stake-rewards-go-account
//   The endpoint PATHS below come from the go-staking service listing in llms.txt.
//   Where a response shape could not be confirmed live it is read defensively
//   (lib/bitgo/fields.ts) and flagged with TODO(verify).
// ─────────────────────────────────────────────────────────────────────────────
import 'server-only';
import { bitgoConfig } from './config';
import { bitgoFetch, expressFetch } from './client';
import { nested } from './fields';

const STAKING = '/api/go-staking/v1';

/** GET /coins — coins available for staking across the service. */
export function listStakingCoins() {
  return bitgoFetch<unknown>('GET', `${STAKING}/coins`);
}

/** GET /{coin}/accounts/{id}/attributes — staking attributes for one asset on a
 *  Go Account: minimums, disclaimers and the reward rate. This is metadata, so it
 *  is expected to resolve even on an unfunded account (see extractRewardRate). */
export function getStakingAttributes(accountId: string, coin: string) {
  return bitgoFetch<unknown>(
    'GET',
    `${STAKING}/${encodeURIComponent(coin)}/accounts/${encodeURIComponent(accountId)}/attributes`,
  );
}

/** GET /accounts/{id}/coins — per-coin staking position on a Go Account:
 *  activeStake, pendingStake, pendingUnstake, rewards, plus attributes. In this
 *  app the POSITION is demo (the account is unfunded); we only read the RATE from
 *  here. Kept for completeness and for when the account is funded. */
export function getAccountStaking(accountId: string) {
  return bitgoFetch<unknown>(
    'GET',
    `${STAKING}/accounts/${encodeURIComponent(accountId)}/coins`,
  );
}

/** GET /accounts/{id}/rewards — staking rewards history for a Go Account. */
export function getStakingRewards(accountId: string) {
  return bitgoFetch<unknown>(
    'GET',
    `${STAKING}/accounts/${encodeURIComponent(accountId)}/rewards`,
  );
}

/** Pull the annual reward rate (percentage string, e.g. "7") out of an attributes
 *  or account-coins response. The documented location is
 *  `attributes.disclaimerAttributes.staking.rewardPercentageRate`; we also probe a
 *  couple of near variants because the exact nesting is not verified live.
 *  Returns null when no rate is present (caller falls back to a badged demo APR). */
export function extractRewardRate(body: unknown): string | null {
  // TODO(verify): confirm the exact path against a live attributes response.
  const candidates: unknown[] = [
    nested(body, 'disclaimerAttributes', 'staking', 'rewardPercentageRate'),
    nested(body, 'attributes', 'disclaimerAttributes', 'staking', 'rewardPercentageRate'),
    nested(body, 'staking', 'rewardPercentageRate'),
    nested(body, 'rewardPercentageRate'),
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() !== '') return c.trim();
    if (typeof c === 'number' && Number.isFinite(c)) return String(c);
  }
  return null;
}

// ── Write path: stake = preview → sign → finalize; unstake = finalize ──────────
// The real staking flow, verified against the Go Account cookbook. NOTE (testnet
// demo): the Go Account here is unfunded, so a real finalize settles to
// insufficient funds — exactly like createMarketOrder in lib/bitgo/trading.ts.
// That is why the app reads the REAL rate from this client but settles the
// stake/unstake in the local demo ledger (lib/staking/service.ts). These wrappers
// are wired and typed for when the account is funded; they are not fired in the
// demo path.

/** Half-signed OFC payload returned by Express, sent back to finalize. */
interface StakingPreview {
  payload?: Record<string, unknown>;
  feeInfo?: { feeString?: string };
}
interface OfcSignResult {
  payload?: Record<string, unknown>;
  signature?: string;
}

/** POST /{coin}/accounts/{id}/requests/preview — generate an unsigned staking
 *  request. `amount` is in BASE units. Returns the `payload` to sign + fee info. */
export function previewStake(accountId: string, coin: string, amountBase: string) {
  return bitgoFetch<StakingPreview>(
    'POST',
    `${STAKING}/${encodeURIComponent(coin)}/accounts/${encodeURIComponent(accountId)}/requests/preview`,
    { amount: amountBase },
  );
}

/** Full real STAKE: preview → sign the payload in Express → finalize with the
 *  half-signed payload. `amount` is in BASE units. Returns the staking request
 *  object (id, type, status). Not used in the demo settlement path. */
export async function stakeReal(accountId: string, coin: string, amountBase: string) {
  const preview = await previewStake(accountId, coin, amountBase);
  const signed = await expressFetch<OfcSignResult>('POST', '/api/v2/ofc/signPayload', {
    walletId: accountId,
    walletPassphrase: bitgoConfig.walletPassphrase,
    payload: preview.payload,
  });
  const halfSigned = signed.payload
    ? { ...signed.payload, signature: signed.signature }
    : signed;
  return bitgoFetch<unknown>(
    'POST',
    `${STAKING}/${encodeURIComponent(coin)}/accounts/${encodeURIComponent(accountId)}/requests/finalize`,
    { type: 'STAKE', amount: amountBase, frontTransferSendRequest: { halfSigned } },
  );
}

/** Real UNSTAKE: a single finalize with type UNSTAKE. BitGo handles the internal
 *  transfers, so no client signature is required. `amount` is in BASE units. */
export function unstakeReal(accountId: string, coin: string, amountBase: string) {
  return bitgoFetch<unknown>(
    'POST',
    `${STAKING}/${encodeURIComponent(coin)}/accounts/${encodeURIComponent(accountId)}/requests/finalize`,
    { type: 'UNSTAKE', amount: amountBase },
  );
}
